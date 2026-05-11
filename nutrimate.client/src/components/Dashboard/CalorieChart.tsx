import { Typography } from 'antd';
import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, ReferenceLine, ResponsiveContainer
} from 'recharts';
import dayjs from 'dayjs';
import type { WeeklyHistoryResponse } from '../../types';

const { Text } = Typography;

interface Props {
  data: WeeklyHistoryResponse | null;
}

export default function CalorieChart({ data }: Props) {
  if (!data) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}><Text type="secondary">Loading chart…</Text></div>;

  const chartData = data.history.map(item => ({
    date: dayjs(item.date).format('ddd D'),
    calories: item.calories,
    goal: item.goal,
  }));

  return (
    <div style={{ height: '100%', minHeight: 200 }}>
      <Text strong style={{ fontSize: 15 }}>7-Day Calorie Intake</Text>
      <ResponsiveContainer width="100%" height="90%">
        <ComposedChart data={chartData} margin={{ top: 16, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 12 }} />
          <YAxis tick={{ fontSize: 12 }} unit=" kcal" width={75} />
          <Tooltip formatter={(v: number) => [`${v} kcal`]} />
          <Legend />
          <ReferenceLine y={data.dailyGoal} stroke="#faad14" strokeDasharray="6 3" label={{ value: 'Goal', position: 'right', fontSize: 11, fill: '#faad14' }} />
          <Bar dataKey="calories" name="Consumed" fill="#1677ff" radius={[4, 4, 0, 0]} maxBarSize={48} />
          <Line dataKey="goal" name="Daily Goal" stroke="#faad14" strokeWidth={2} dot={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
