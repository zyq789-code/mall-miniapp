import { useState } from 'react'
import { App, Button, Card, Form, Input } from 'antd'
import { useNavigate } from 'react-router-dom'
import { login } from '../api/auth'

interface LoginFormValues {
  username: string
  password: string
}

/** 登录页：提交到 /api/auth/login，成功存 token 后跳转商品管理。 */
export default function Login() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [loading, setLoading] = useState(false)

  const handleFinish = async (values: LoginFormValues) => {
    setLoading(true)
    try {
      const result = await login(values.username, values.password)
      localStorage.setItem('token', result.token)
      localStorage.setItem('nickname', result.nickname)
      message.success('登录成功')
      navigate('/products')
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f0f2f5',
      }}
    >
      <Card title="商城管理后台" style={{ width: 360 }}>
        <Form<LoginFormValues> name="login" onFinish={handleFinish} size="large">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" autoComplete="username" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block loading={loading}>
              登录
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  )
}
