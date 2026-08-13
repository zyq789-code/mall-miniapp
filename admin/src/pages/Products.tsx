import { useCallback, useEffect, useMemo, useState } from 'react'
import { App, Button, Card, Divider, Form, Image, Input, InputNumber, Modal, Popconfirm, Select, Space, Switch, Table, Tag, Typography, Upload } from 'antd'
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
import type { Category, Product, ProductInput, SpecGroup } from '../api/products'
import { generateSkuRows } from '../lib/sku'
import type { SkuRow } from '../lib/sku'

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
  const [specsState, setSpecsState] = useState<SpecGroup[]>([])
  const [skuRows, setSkuRows] = useState<SkuRow[]>([])

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
    setSpecsState([])
    setSkuRows([])
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
    const specs = record.specs ?? []
    const existing = (record.skus ?? []).map((s) => ({
      attrs: s.attrs,
      price: s.price / 100,
      stock: s.stock,
    }))
    setSpecsState(specs)
    setSkuRows(generateSkuRows(specs, existing, { price: record.price / 100, stock: 0 }))
    setModalOpen(true)
  }

  /** 表单当前商品价（元），作为新 SKU 组合的默认价。 */
  const getBasePriceYuan = (): number => {
    const value = form.getFieldValue('priceYuan')
    return typeof value === 'number' && Number.isFinite(value) ? value : 0
  }

  /** 规格变化后按笛卡尔积刷新 SKU 表格，尽量沿用已填价格/库存。 */
  const refreshSkuRows = (specs: SpecGroup[]) => {
    setSkuRows(generateSkuRows(specs, skuRows, { price: getBasePriceYuan(), stock: 0 }))
  }

  const addSpec = () => {
    const next = [...specsState, { name: '', values: [] }]
    setSpecsState(next)
    refreshSkuRows(next)
  }

  const updateSpecName = (index: number, name: string) => {
    const next = specsState.map((s, i) => (i === index ? { ...s, name } : s))
    setSpecsState(next)
    refreshSkuRows(next)
  }

  const updateSpecValues = (index: number, values: string[]) => {
    const next = specsState.map((s, i) => (i === index ? { ...s, values } : s))
    setSpecsState(next)
    refreshSkuRows(next)
  }

  const removeSpec = (index: number) => {
    const next = specsState.filter((_, i) => i !== index)
    setSpecsState(next)
    refreshSkuRows(next)
  }

  const updateSkuRow = (index: number, patch: Partial<SkuRow>) => {
    setSkuRows((rows) => rows.map((r, i) => (i === index ? { ...r, ...patch } : r)))
  }

  const removeSkuRow = (index: number) => {
    setSkuRows((rows) => rows.filter((_, i) => i !== index))
  }

  /** attrs 组合的稳定 key（SKU 表格 rowKey）。 */
  const skuRowKey = (row: SkuRow): string =>
    Object.keys(row.attrs)
      .sort()
      .map((k) => `${k}:${row.attrs[k]}`)
      .join('|')

  const handleSubmit = async () => {
    let values: ProductFormValues
    try {
      values = await form.validateFields()
    } catch {
      return
    }

    const invalidSpec = specsState.find(
      (s) => !s.name.trim() || s.values.length === 0 || s.values.some((v) => !v.trim()),
    )
    if (invalidSpec) {
      message.error('每个规格维度需填写名称，且至少包含一个值')
      return
    }
    if (specsState.length > 0 && skuRows.length === 0) {
      message.error('请至少保留一个 SKU')
      return
    }

    const basePrice = Math.round(values.priceYuan * 100)
    const payload: ProductInput = {
      name: values.name.trim(),
      subtitle: values.subtitle,
      categoryId: values.categoryId,
      price: basePrice,
      originalPrice:
        values.originalPriceYuan !== undefined && values.originalPriceYuan !== null
          ? Math.round(values.originalPriceYuan * 100)
          : undefined,
      stock: values.stock,
      tags: values.tags ?? [],
      cover: values.cover,
      specs: specsState,
      // 提交时 price 由元转分；默认价 0 时兜底为商品价，避免空价 SKU 被后端拒收。
      skus: skuRows.map((row, i) => ({
        id: `${editing?.id ?? 'g'}-s${i + 1}`,
        attrs: row.attrs,
        price: Math.round(row.price * 100) || basePrice,
        stock: row.stock,
      })),
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

  /** SKU 表格列：每个规格维度一列 + 价格 + 库存 + 删除。 */
  const skuColumns: ColumnsType<SkuRow> = [
    ...specsState.map((spec, index) => ({
      title: spec.name || '规格',
      key: `spec-${index}`,
      render: (_: unknown, row: SkuRow) => row.attrs[spec.name],
    })),
    {
      title: '价格（元）',
      key: 'price',
      width: 120,
      render: (_, row, index) => (
        <InputNumber
          min={0.01}
          precision={2}
          style={{ width: '100%' }}
          value={row.price}
          onChange={(value) => updateSkuRow(index, { price: Number(value ?? 0) })}
        />
      ),
    },
    {
      title: '库存',
      key: 'stock',
      width: 110,
      render: (_, row, index) => (
        <InputNumber
          min={0}
          precision={0}
          style={{ width: '100%' }}
          value={row.stock}
          onChange={(value) => updateSkuRow(index, { stock: Number(value ?? 0) })}
        />
      ),
    },
    {
      title: '',
      key: 'action',
      width: 64,
      render: (_, _row, index) => (
        <Button type="link" size="small" danger onClick={() => removeSkuRow(index)}>
          删除
        </Button>
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
        width={720}
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

          <Divider orientation="left" plain>
            规格与 SKU
          </Divider>
          {specsState.map((spec, index) => (
            <div key={index} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', marginBottom: 8 }}>
              <Input
                style={{ width: 180 }}
                placeholder="规格名称，如 颜色"
                value={spec.name}
                onChange={(e) => updateSpecName(index, e.target.value)}
              />
              <Select
                mode="tags"
                open={false}
                suffixIcon={null}
                style={{ flex: 1 }}
                placeholder="输入值后回车，如 黑色"
                value={spec.values}
                onChange={(values) => updateSpecValues(index, values)}
              />
              <Button type="text" danger onClick={() => removeSpec(index)}>
                删除
              </Button>
            </div>
          ))}
          <Button type="dashed" block icon={<PlusOutlined />} onClick={addSpec} style={{ marginBottom: 8 }}>
            添加规格维度
          </Button>

          {specsState.length > 0 && (
            <>
              <Divider orientation="left" plain>
                SKU 列表
              </Divider>
              <Table<SkuRow>
                rowKey={skuRowKey}
                size="small"
                pagination={false}
                columns={skuColumns}
                dataSource={skuRows}
                scroll={{ x: 640 }}
              />
            </>
          )}
        </Form>
      </Modal>
    </Card>
  )
}
