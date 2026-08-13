import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Card, Form, Image, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, Upload } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons'
import {
  createProduct,
  deleteProduct,
  getCategories,
  getProducts,
  setProductStatus,
  updateProduct,
  uploadImage,
} from '../api/products'
import type { Category, Product, ProductInput } from '../api/products'

const { Text } = Typography

/** 分 → 元显示。 */
function formatYuan(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return '操作失败'
}

interface ProductFormValues {
  name: string
  subtitle?: string
  categoryId: string
  priceYuan: number
  originalPriceYuan?: number
  stock: number
  tags?: string[]
  cover?: string
}

/** 封面列：后台访问不到小程序本地静态图，图加载失败时退化为商品名首字占位。 */
function ProductCover({ product }: { product: Product }) {
  const [failed, setFailed] = useState(false)
  const src = product.cover || `/static/img/${product.id}.png`

  if (failed || !src) {
    return (
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: 6,
          background: '#f5f5f5',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 18,
          fontWeight: 600,
          color: '#bfbfbf',
        }}
      >
        {product.name.charAt(0)}
      </div>
    )
  }

  return (
    <Image
      src={src}
      width={48}
      height={48}
      style={{ objectFit: 'cover', borderRadius: 6 }}
      preview={false}
      onError={() => setFailed(true)}
    />
  )
}

/** 商品管理页：列表 / 搜索筛选 / 新增 / 编辑 / 上架下架 / 删除。 */
export default function Products() {
  const { message } = App.useApp()
  const [form] = Form.useForm<ProductFormValues>()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [query, setQuery] = useState<{ keyword?: string; status?: 'on' | 'off' }>({})

  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [coverPreview, setCoverPreview] = useState<string>('')
  const [submitting, setSubmitting] = useState(false)
  const [statusLoadingId, setStatusLoadingId] = useState<string | null>(null)

  const fetchProducts = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getProducts(query)
      setProducts(data.list)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [query, message])

  useEffect(() => {
    void fetchProducts()
  }, [fetchProducts])

  useEffect(() => {
    void getCategories().then(setCategories)
  }, [])

  const categoryName = useMemo(() => {
    const map = new Map(categories.map((c) => [c.id, c.name]))
    return (id: string) => map.get(id) ?? id
  }, [categories])

  const categoryOptions = useMemo(
    () =>
      categories
        .filter((c) => c.parentId === null)
        .map((top) => ({
          label: top.name,
          options: [
            { value: top.id, label: top.name },
            ...categories
              .filter((c) => c.parentId === top.id)
              .map((c) => ({ value: c.id, label: c.name })),
          ],
        })),
    [categories],
  )

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    setCoverPreview('')
    setModalOpen(true)
  }

  const openEdit = (record: Product) => {
    setEditing(record)
    form.resetFields()
    form.setFieldsValue({
      name: record.name,
      subtitle: record.subtitle,
      categoryId: record.categoryId,
      priceYuan: record.price / 100,
      originalPriceYuan: record.originalPrice > 0 ? record.originalPrice / 100 : undefined,
      stock: record.stock,
      tags: record.tags,
      cover: record.cover,
    })
    setCoverPreview(record.cover || '')
    setModalOpen(true)
  }

  const handleSubmit = async () => {
    let values: ProductFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const payload: ProductInput = {
      name: values.name.trim(),
      subtitle: values.subtitle,
      categoryId: values.categoryId,
      price: Math.round(values.priceYuan * 100),
      originalPrice:
        values.originalPriceYuan !== undefined && values.originalPriceYuan !== null
          ? Math.round(values.originalPriceYuan * 100)
          : undefined,
      stock: values.stock,
      tags: values.tags ?? [],
      cover: values.cover,
    }

    setSubmitting(true)
    try {
      if (editing) {
        await updateProduct(editing.id, payload)
        message.success('商品已更新')
      } else {
        await createProduct(payload)
        message.success('商品已创建')
      }
      setModalOpen(false)
      await fetchProducts()
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (record: Product, checked: boolean) => {
    const next: 'on' | 'off' = checked ? 'on' : 'off'
    setStatusLoadingId(record.id)
    try {
      await setProductStatus(record.id, next)
      message.success(next === 'on' ? '已上架' : '已下架')
      await fetchProducts()
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setStatusLoadingId(null)
    }
  }

  const handleDelete = async (record: Product) => {
    try {
      await deleteProduct(record.id)
      message.success('已删除')
      await fetchProducts()
    } catch (error) {
      message.error(getErrorMessage(error))
    }
  }

  const columns: ColumnsType<Product> = [
    {
      title: '封面',
      dataIndex: 'cover',
      width: 72,
      render: (_: string, record) => <ProductCover product={record} />,
    },
    {
      title: '名称',
      dataIndex: 'name',
      render: (_, record) => (
        <div>
          <Text strong>{record.name}</Text>
          {record.subtitle ? (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {record.subtitle}
              </Text>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      width: 110,
      render: (id: string) => categoryName(id),
    },
    {
      title: '价格',
      dataIndex: 'price',
      width: 100,
      render: (price: number) => formatYuan(price),
    },
    { title: '库存', dataIndex: 'stock', width: 80 },
    { title: '销量', dataIndex: 'sales', width: 80 },
    {
      title: '状态',
      dataIndex: 'status',
      width: 90,
      render: (status: string) => (
        <Tag color={status === 'on' ? 'success' : 'default'}>{status === 'on' ? '在售' : '下架'}</Tag>
      ),
    },
    {
      title: '操作',
      key: 'actions',
      width: 230,
      render: (_, record) => (
        <Space size="middle">
          <Switch
            size="small"
            checked={record.status === 'on'}
            checkedChildren="在售"
            unCheckedChildren="下架"
            loading={statusLoadingId === record.id}
            onChange={(checked) => void handleToggleStatus(record, checked)}
          />
          <Button type="link" size="small" onClick={() => openEdit(record)}>
            编辑
          </Button>
          <Popconfirm
            title="确认删除该商品？"
            okText="删除"
            okButtonProps={{ danger: true }}
            onConfirm={() => void handleDelete(record)}
          >
            <Button type="link" size="small" danger>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <Card>
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }} align="center">
        <Space wrap>
          <Input.Search
            placeholder="搜索商品名称"
            allowClear
            style={{ width: 240 }}
            onSearch={(value) => setQuery((q) => ({ ...q, keyword: value.trim() || undefined }))}
          />
          <Select
            placeholder="状态筛选"
            allowClear
            style={{ width: 140 }}
            options={[
              { value: 'on', label: '在售' },
              { value: 'off', label: '下架' },
            ]}
            onChange={(value) => setQuery((q) => ({ ...q, status: value }))}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void fetchProducts()}>
            刷新
          </Button>
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
          新增商品
        </Button>
      </Space>

      <Table<Product>
        rowKey="id"
        columns={columns}
        dataSource={products}
        loading={loading}
        scroll={{ x: 900 }}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
      />

      <Modal
        title={editing ? '编辑商品' : '新增商品'}
        open={modalOpen}
        onOk={() => void handleSubmit()}
        onCancel={() => setModalOpen(false)}
        confirmLoading={submitting}
        width={520}
      >
        <Form<ProductFormValues> form={form} layout="vertical" initialValues={{ stock: 0, tags: [] }}>
          <Form.Item name="cover" label="商品图片">
            <Upload
              listType="picture-card"
              maxCount={1}
              showUploadList={false}
              accept="image/*"
              beforeUpload={(file) => {
                const reader = new FileReader()
                reader.onload = async () => {
                  try {
                    const res = await uploadImage(reader.result as string)
                    const url = `http://8.163.34.25${res.url}`
                    form.setFieldValue('cover', url)
                    setCoverPreview(url)
                    message.success('图片上传成功')
                  } catch (e) {
                    message.error(getErrorMessage(e))
                  }
                }
                reader.readAsDataURL(file)
                return false
              }}
            >
              {coverPreview ? (
                <img src={coverPreview} alt="封面" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ color: '#999' }}>+ 上传图片</div>
              )}
            </Upload>
          </Form.Item>
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="商品名称" maxLength={50} />
          </Form.Item>
          <Form.Item name="subtitle" label="副标题">
            <Input placeholder="副标题（可选）" maxLength={100} />
          </Form.Item>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="请选择分类" options={categoryOptions} />
          </Form.Item>
          <Form.Item name="priceYuan" label="价格（元）" rules={[{ required: true, message: '请输入价格' }]}>
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }} placeholder="如 99.00" />
          </Form.Item>
          <Form.Item name="originalPriceYuan" label="原价（元）">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} placeholder="可选，如 129.00" />
          </Form.Item>
          <Form.Item name="stock" label="库存" rules={[{ required: true, message: '请输入库存' }]}>
            <InputNumber min={0} precision={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="tags" label="标签">
            <Select mode="tags" open={false} suffixIcon={null} placeholder="输入后回车，如 包邮、正品" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
