import { useCallback, useEffect, useState } from 'react'
import {
  App,
  Button,
  Card,
  Descriptions,
  Drawer,
  Popconfirm,
  Space,
  Spin,
  Table,
  Tabs,
  Tag,
  Timeline,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { ReloadOutlined } from '@ant-design/icons'
import { getOrder, getOrders, shipOrder } from '../api/orders'
import type { Order, OrderItem, OrderStatus } from '../api/orders'

const { Text } = Typography

/** 状态中文映射 + 标签颜色。 */
const STATUS_META: Record<OrderStatus, { label: string; color: string }> = {
  pending_pay: { label: '待付款', color: 'warning' },
  pending_ship: { label: '待发货', color: 'processing' },
  pending_receive: { label: '待收货', color: 'blue' },
  completed: { label: '已完成', color: 'success' },
  canceled: { label: '已取消', color: 'default' },
}

/** 分 → 元显示。 */
function formatYuan(cents: number): string {
  return `¥${(cents / 100).toFixed(2)}`
}

function formatTime(timestamp: number | null | undefined): string {
  if (!timestamp) return '-'
  return new Date(timestamp).toLocaleString('zh-CN')
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message
  return '操作失败'
}

/** 商品摘要：前 2 个商品名，超过则补 "等 N 件"。 */
function renderItemSummary(items: OrderItem[]): string {
  if (!items.length) return '-'
  const names = items.map((it) => it.name)
  const shown = names.slice(0, 2).join('、')
  return names.length > 2 ? `${shown} 等 ${names.length} 件` : shown
}

/** 订单管理页：列表 / 状态筛选 / 发货 / 详情 Drawer。 */
export default function Orders() {
  const { message } = App.useApp()

  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<OrderStatus | undefined>(undefined)
  const [shippingId, setShippingId] = useState<string | null>(null)

  const [detailOpen, setDetailOpen] = useState(false)
  const [detail, setDetail] = useState<Order | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    try {
      const data = await getOrders(status ? { status } : {})
      setOrders(data.list)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [status, message])

  useEffect(() => {
    void fetchOrders()
  }, [fetchOrders])

  const openDetail = async (record: Order) => {
    setDetail(record)
    setDetailOpen(true)
    setDetailLoading(true)
    try {
      const fresh = await getOrder(record.id)
      setDetail(fresh)
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setDetailLoading(false)
    }
  }

  const closeDetail = () => {
    setDetailOpen(false)
    setDetail(null)
  }

  const handleShip = async (record: Order) => {
    setShippingId(record.id)
    try {
      await shipOrder(record.id)
      message.success('已发货')
      await fetchOrders()
    } catch (error) {
      message.error(getErrorMessage(error))
    } finally {
      setShippingId(null)
    }
  }

  const columns: ColumnsType<Order> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      width: 180,
      render: (orderNo: string) => <Text copyable={{ text: orderNo }}>{orderNo}</Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 100,
      render: (value: OrderStatus) => {
        const meta = STATUS_META[value]
        return <Tag color={meta.color}>{meta.label}</Tag>
      },
    },
    {
      title: '商品',
      dataIndex: 'items',
      render: (_, record) => <span>{renderItemSummary(record.items)}</span>,
    },
    {
      title: '实付金额',
      dataIndex: 'payAmount',
      width: 120,
      render: (payAmount: number) => <Text strong>{formatYuan(payAmount)}</Text>,
    },
    {
      title: '下单时间',
      dataIndex: 'createTime',
      width: 170,
      render: (createTime: number) => formatTime(createTime),
    },
    {
      title: '操作',
      key: 'actions',
      width: 130,
      render: (_, record) => (
        <Space size="small" onClick={(event) => event.stopPropagation()}>
          <Button type="link" size="small" onClick={() => void openDetail(record)}>
            详情
          </Button>
          {record.status === 'pending_ship' ? (
            <Popconfirm
              title="确认发货？"
              description={`订单 ${record.orderNo} 将标记为已发货`}
              okText="发货"
              cancelText="取消"
              onConfirm={() => void handleShip(record)}
            >
              <Button type="link" size="small" loading={shippingId === record.id}>
                发货
              </Button>
            </Popconfirm>
          ) : null}
        </Space>
      ),
    },
  ]

  const timelineItems = detail
    ? [
        { children: `下单时间：${formatTime(detail.createTime)}`, color: 'blue' },
        ...(detail.payTime ? [{ children: `支付时间：${formatTime(detail.payTime)}`, color: 'blue' }] : []),
        ...(detail.shipTime ? [{ children: `发货时间：${formatTime(detail.shipTime)}`, color: 'blue' }] : []),
        ...(detail.receiveTime
          ? [{ children: `收货时间：${formatTime(detail.receiveTime)}`, color: 'green' }]
          : []),
      ]
    : []

  return (
    <Card>
      <Space style={{ marginBottom: 8, width: '100%', justifyContent: 'space-between' }} align="center">
        <Tabs
          activeKey={status ?? 'all'}
          onChange={(key) => setStatus(key === 'all' ? undefined : (key as OrderStatus))}
          items={[
            { key: 'all', label: '全部' },
            { key: 'pending_pay', label: '待付款' },
            { key: 'pending_ship', label: '待发货' },
            { key: 'pending_receive', label: '待收货' },
            { key: 'completed', label: '已完成' },
            { key: 'canceled', label: '已取消' },
          ]}
        />
        <Button icon={<ReloadOutlined />} onClick={() => void fetchOrders()}>
          刷新
        </Button>
      </Space>

      <Table<Order>
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={loading}
        scroll={{ x: 860 }}
        pagination={{ pageSize: 10, showTotal: (total) => `共 ${total} 条` }}
        onRow={(record) => ({
          onClick: () => void openDetail(record),
          style: { cursor: 'pointer' },
        })}
      />

      <Drawer
        title={detail ? `订单详情 ${detail.orderNo}` : '订单详情'}
        open={detailOpen}
        onClose={closeDetail}
        width={520}
      >
        {detail ? (
          <Spin spinning={detailLoading}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Descriptions
                column={1}
                size="small"
                bordered
                title="基本信息"
                items={[
                  { key: 'orderNo', label: '订单号', children: detail.orderNo },
                  {
                    key: 'status',
                    label: '状态',
                    children: (
                      <Tag color={STATUS_META[detail.status].color}>{STATUS_META[detail.status].label}</Tag>
                    ),
                  },
                  { key: 'createTime', label: '下单时间', children: formatTime(detail.createTime) },
                ]}
              />

              <Descriptions
                column={1}
                size="small"
                bordered
                title="收货地址"
                items={
                  detail.address
                    ? [
                        { key: 'name', label: '收货人', children: detail.address.name },
                        { key: 'phone', label: '联系电话', children: detail.address.phone },
                        {
                          key: 'detail',
                          label: '地址',
                          children: `${detail.address.region} ${detail.address.detail}`,
                        },
                      ]
                    : [{ key: 'empty', label: '收货地址', children: '无' }]
                }
              />

              <Descriptions
                column={1}
                size="small"
                bordered
                title="商品明细"
                items={detail.items.map((item, index) => ({
                  key: `${item.goodsId}-${index}`,
                  label: item.name,
                  children: (
                    <Space direction="vertical" size={0}>
                      {item.spec ? <Text type="secondary">{item.spec}</Text> : null}
                      <Text>
                        {formatYuan(item.price)} × {item.quantity}
                      </Text>
                    </Space>
                  ),
                }))}
              />

              <Descriptions
                column={1}
                size="small"
                bordered
                title="金额明细"
                items={[
                  { key: 'total', label: '商品总额', children: formatYuan(detail.totalAmount) },
                  { key: 'freight', label: '运费', children: formatYuan(detail.freight) },
                  {
                    key: 'coupon',
                    label: '优惠券',
                    children: detail.couponDeduction > 0 ? `-${formatYuan(detail.couponDeduction)}` : '¥0.00',
                  },
                  {
                    key: 'points',
                    label: '积分抵扣',
                    children: detail.pointsDeduction > 0 ? `-${formatYuan(detail.pointsDeduction)}` : '¥0.00',
                  },
                  {
                    key: 'pay',
                    label: '实付金额',
                    children: <Text strong>{formatYuan(detail.payAmount)}</Text>,
                  },
                ]}
              />

              <div>
                <Text strong>时间线</Text>
                <Timeline style={{ marginTop: 12 }} items={timelineItems} />
              </div>
            </Space>
          </Spin>
        ) : (
          <Text type="secondary">加载中...</Text>
        )}
      </Drawer>
    </Card>
  )
}
