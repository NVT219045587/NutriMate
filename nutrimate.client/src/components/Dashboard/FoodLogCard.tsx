import { useState, useEffect } from 'react';
import { Button, DatePicker, Form, InputNumber, Popconfirm, Select, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs, { Dayjs } from 'dayjs';
import type { DailyLogResponse, Food, NutritionLogDto } from '../../types';
import { getFoods } from '../../api/foodApi';
import { logFood, deleteLog } from '../../api/nutritionApi';

const { Text } = Typography;

const TYPE_COLORS: Record<string, string> = {
  Protein: 'blue', Carbohydrate: 'gold', Fat: 'orange',
  Vegetable: 'green', Fruit: 'magenta', Dairy: 'cyan',
};

interface Props {
  dailyLog: DailyLogResponse | null;
  selectedDate: string;
  onRefresh: () => void;
}

export default function FoodLogCard({ dailyLog, selectedDate, onRefresh }: Props) {
  const [foods, setFoods] = useState<Food[]>([]);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();
  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [logDate, setLogDate] = useState<Dayjs>(dayjs());

  useEffect(() => {
    getFoods().then(setFoods).catch(() => {});
  }, []);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      setAdding(true);
      await logFood(values.foodId, values.qty, logDate.format('YYYY-MM-DD'));
      form.resetFields(['foodId', 'qty']);
      setSelectedFood(null);
      onRefresh();
      message.success('Food logged!');
    } catch {
      message.error('Failed to log food.');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLog(id);
      onRefresh();
      message.success('Removed.');
    } catch {
      message.error('Failed to remove entry.');
    }
  };

  const columns = [
    { title: 'Food', dataIndex: 'foodName', key: 'foodName', ellipsis: true },
    {
      title: 'Type', dataIndex: 'foodType', key: 'foodType', width: 100,
      render: (t: string) => <Tag color={TYPE_COLORS[t] ?? 'default'}>{t}</Tag>,
    },
    {
      title: 'Qty', key: 'qty', width: 110,
      render: (_: unknown, r: NutritionLogDto) => `${r.qty} × ${r.unitOfMeasurement}`,
    },
    {
      title: 'Calories', dataIndex: 'totalCalories', key: 'calories', width: 90,
      render: (v: number) => <Text strong>{Math.round(v)} kcal</Text>,
    },
    {
      title: '', key: 'action', width: 50,
      render: (_: unknown, r: NutritionLogDto) => (
        <Popconfirm title="Remove this entry?" onConfirm={() => handleDelete(r.id)} okText="Yes" cancelText="No">
          <Button type="text" danger icon={<DeleteOutlined />} size="small" />
        </Popconfirm>
      ),
    },
  ];

  const previewCalories = selectedFood && form.getFieldValue('qty')
    ? Math.round(selectedFood.caloriesPerUnit * form.getFieldValue('qty'))
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{ marginBottom: 12, fontWeight: 600, fontSize: 15 }}>
        Food Log — {dayjs(selectedDate).format('ddd, D MMM YYYY')}
      </div>

      <Form form={form} layout="inline" style={{ marginBottom: 12, flexWrap: 'wrap', gap: 8 }}>
        <Form.Item name="foodId" rules={[{ required: true, message: '' }]} style={{ minWidth: 220 }}>
          <Select
            showSearch
            placeholder="Search food…"
            optionFilterProp="label"
            onChange={(id) => setSelectedFood(foods.find(f => f.foodId === id) ?? null)}
            options={foods.map(f => ({
              value: f.foodId,
              label: `${f.foodName} (${f.caloriesPerUnit} kcal/${f.unitOfMeasurement})`,
            }))}
            style={{ width: 280 }}
          />
        </Form.Item>
        <Form.Item name="qty" rules={[{ required: true, message: '' }]}>
          <InputNumber
            min={0.01} step={0.5} placeholder="Qty"
            addonAfter={selectedFood?.unitOfMeasurement ?? 'unit'}
            style={{ width: 140 }}
            onChange={() => form.validateFields(['qty']).catch(() => {})}
          />
        </Form.Item>
        <Form.Item>
          <DatePicker
            value={logDate}
            onChange={v => v && setLogDate(v)}
            format="DD MMM YYYY"
            allowClear={false}
          />
        </Form.Item>
        <Form.Item>
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd} loading={adding}>
              Add
            </Button>
            {previewCalories !== null && (
              <Text type="secondary" style={{ fontSize: 12 }}>≈ {previewCalories} kcal</Text>
            )}
          </Space>
        </Form.Item>
      </Form>

      <Table
        columns={columns}
        dataSource={dailyLog?.logs ?? []}
        rowKey="id"
        size="small"
        pagination={false}
        scroll={{ y: 240 }}
        locale={{ emptyText: 'No food logged today' }}
        summary={() =>
          dailyLog && dailyLog.logs.length > 0 ? (
            <Table.Summary.Row>
              <Table.Summary.Cell index={0} colSpan={3}><Text strong>Total</Text></Table.Summary.Cell>
              <Table.Summary.Cell index={3}>
                <Text strong>{Math.round(dailyLog.totalConsumed)} kcal</Text>
              </Table.Summary.Cell>
              <Table.Summary.Cell index={4} />
            </Table.Summary.Row>
          ) : null
        }
      />
    </div>
  );
}
