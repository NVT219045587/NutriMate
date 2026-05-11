import { useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Select, Typography, message, Row, Col } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { register } from '../api/authApi';
import { useAuthStore } from '../store/authStore';

const { Title, Text } = Typography;

const passwordRules = [
  { required: true, message: 'Password is required' },
  { min: 8, message: 'At least 8 characters' },
  {
    validator: (_: unknown, value: string) => {
      if (!value) return Promise.resolve();
      const checks = [/[A-Z]/, /[a-z]/, /[0-9]/, /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/];
      const messages = ['uppercase letter', 'lowercase letter', 'digit', 'special character'];
      for (let i = 0; i < checks.length; i++) {
        if (!checks[i].test(value)) return Promise.reject(`Must contain a ${messages[i]}`);
      }
      return Promise.resolve();
    },
  },
];

export default function RegisterPage() {
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onFinish = async (values: {
    username: string; password: string; fullName: string;
    age: number; weight: number; height: number; gender: string;
  }) => {
    setLoading(true);
    try {
      const { csrfToken, user } = await register(values);
      setAuth(user, csrfToken);
      navigate('/');
    } catch (err: unknown) {
      const data = (err as { response?: { data?: { error?: string; errors?: Array<{ msg: string }> } } })?.response?.data;
      message.error(data?.error ?? data?.errors?.[0]?.msg ?? 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '24px 0' }}>
      <Card style={{ width: 480, boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <Title level={2} style={{ margin: 0, color: '#1677ff' }}>NutriMate</Title>
          <Text type="secondary">Create your account</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Username" name="username" rules={[
                { required: true }, { min: 3, max: 50, message: '3–50 characters' }
              ]}>
                <Input placeholder="e.g. johndoe" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Full Name" name="fullName" rules={[{ required: true }]}>
                <Input placeholder="John Doe" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Password" name="password" rules={passwordRules}>
            <Input.Password placeholder="Min 8 chars, upper, lower, digit, special" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Age" name="age" rules={[{ required: true }]}>
                <InputNumber min={1} max={120} style={{ width: '100%' }} addonAfter="yrs" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Weight" name="weight" rules={[{ required: true }]}>
                <InputNumber min={1} max={500} style={{ width: '100%' }} addonAfter="kg" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Height" name="height" rules={[{ required: true }]}>
                <InputNumber min={50} max={300} style={{ width: '100%' }} addonAfter="cm" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item label="Gender" name="gender" rules={[{ required: true }]}>
            <Select placeholder="Select gender">
              <Select.Option value="male">Male</Select.Option>
              <Select.Option value="female">Female</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>

          <Button type="primary" htmlType="submit" loading={loading} size="large" block>
            Create Account
          </Button>
        </Form>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">Already have an account? </Text>
          <Link to="/login">Sign in</Link>
        </div>
      </Card>
    </div>
  );
}
