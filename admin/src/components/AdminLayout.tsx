import { Button, Layout, Menu, Space } from 'antd'
import {
  AppstoreOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
} from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const { Header, Sider, Content } = Layout

const MENU_ITEMS = [
  { key: '/products', icon: <AppstoreOutlined />, label: '商品管理' },
  { key: '/orders', icon: <ShoppingCartOutlined />, label: '订单管理' },
]

/** 后台整体布局：左侧菜单 + 顶部用户信息与退出按钮，内容区由路由 Outlet 填充。 */
export default function AdminLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const nickname = localStorage.getItem('nickname') ?? '管理员'

  const selectedKey = location.pathname.startsWith('/orders') ? '/orders' : '/products'

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nickname')
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider>
        <div
          style={{
            height: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
          }}
        >
          商城管理后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[selectedKey]}
          items={MENU_ITEMS}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            background: '#fff',
            paddingInline: 24,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
          }}
        >
          <Space>
            <span>{nickname}</span>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              退出登录
            </Button>
          </Space>
        </Header>
        <Content style={{ margin: 24 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
