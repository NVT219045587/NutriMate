import { Button, Layout, Typography, Dropdown, Avatar, Space } from 'antd';
import { LogoutOutlined, UserOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../api/authApi';
import { useAuthStore } from '../../store/authStore';

const { Header, Content } = Layout;
const { Text } = Typography;

interface Props {
  children: React.ReactNode;
}

export default function AppLayout({ children }: Props) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout().catch(() => {});
    clearAuth();
    navigate('/login');
  };

  const menuItems: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sign Out',
      onClick: handleLogout,
      danger: true,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Header style={{ display: 'flex', alignItems: 'center', background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0', position: 'sticky', top: 0, zIndex: 100 }}>
        <Text strong style={{ fontSize: 18, color: '#1677ff', flex: 1 }}>NutriMate</Text>
        <Dropdown menu={{ items: menuItems }} trigger={['click']}>
          <Button type="text" style={{ height: 'auto', padding: '4px 8px' }}>
            <Space>
              <Avatar size="small" icon={<UserOutlined />} style={{ background: '#1677ff' }} />
              <Text>{user?.fullName}</Text>
            </Space>
          </Button>
        </Dropdown>
      </Header>
      <Content style={{ padding: '24px', maxWidth: 1400, margin: '0 auto', width: '100%' }}>
        {children}
      </Content>
    </Layout>
  );
}
