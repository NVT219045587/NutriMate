import { Avatar, Button, Descriptions, Form, Input, InputNumber, Modal, Select, Typography, message } from 'antd';
import { EditOutlined, UserOutlined } from '@ant-design/icons';
import { useState } from 'react';
import dayjs from 'dayjs';
import type { UserProfile } from '../../types';
import { updateProfile } from '../../api/userApi';

const { Text } = Typography;

interface Props {
  profile: UserProfile;
  onUpdate: (profile: UserProfile) => void;
}

export default function ProfileCard({ profile, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const openEdit = () => {
    form.setFieldsValue({
      fullName: profile.fullName,
      age: profile.age,
      weight: profile.weight,
      height: profile.height,
      gender: profile.gender,
    });
    setOpen(true);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const values = await form.validateFields();
      const updated = await updateProfile(values);
      onUpdate(updated);
      setOpen(false);
      message.success('Profile updated');
    } catch {
      message.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <Avatar size={56} icon={<UserOutlined />} style={{ background: '#1677ff' }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 16 }}>{profile.fullName}</div>
            <Text type="secondary">@{profile.username}</Text>
          </div>
          <Button icon={<EditOutlined />} style={{ marginLeft: 'auto' }} onClick={openEdit} size="small">Edit</Button>
        </div>
        <Descriptions column={1} size="small" styles={{ label: { color: '#8c8c8c' } }}>
          <Descriptions.Item label="Age">{profile.age} years</Descriptions.Item>
          <Descriptions.Item label="Weight">{profile.weight} kg</Descriptions.Item>
          <Descriptions.Item label="Height">{profile.height} cm</Descriptions.Item>
          <Descriptions.Item label="Gender" style={{ textTransform: 'capitalize' }}>{profile.gender}</Descriptions.Item>
          <Descriptions.Item label="Member since">{dayjs(profile.createdAt).format('MMM YYYY')}</Descriptions.Item>
          {profile.lastLoginAt && (
            <Descriptions.Item label="Last login">{dayjs(profile.lastLoginAt).format('DD MMM YYYY HH:mm')}</Descriptions.Item>
          )}
        </Descriptions>
      </div>

      <Modal title="Edit Profile" open={open} onOk={handleSave} confirmLoading={loading} onCancel={() => setOpen(false)}>
        <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Full Name" name="fullName" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Age" name="age" rules={[{ required: true }]}>
            <InputNumber min={1} max={120} addonAfter="yrs" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Weight" name="weight" rules={[{ required: true }]}>
            <InputNumber min={1} max={500} addonAfter="kg" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Height" name="height" rules={[{ required: true }]}>
            <InputNumber min={50} max={300} addonAfter="cm" style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item label="Gender" name="gender" rules={[{ required: true }]}>
            <Select>
              <Select.Option value="male">Male</Select.Option>
              <Select.Option value="female">Female</Select.Option>
              <Select.Option value="other">Other</Select.Option>
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}
