import { Progress, Statistic, Typography } from 'antd';
import { FireOutlined } from '@ant-design/icons';
import type { DailyLogResponse } from '../../types';

const { Text } = Typography;

interface Props {
  data: DailyLogResponse | null;
}

function goalColor(pct: number) {
  if (pct < 60) return '#52c41a';
  if (pct < 85) return '#1677ff';
  if (pct < 100) return '#faad14';
  return '#ff4d4f';
}

export default function DailyGoalCard({ data }: Props) {
  if (!data) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Text type="secondary">Loading…</Text></div>;

  const pct = Math.min(Math.round((data.totalConsumed / data.dailyGoal) * 100), 999);
  const color = goalColor(Math.min(pct, 100));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%' }}>
      <Text strong style={{ fontSize: 15, marginBottom: 8 }}>Daily Calories</Text>
      <Progress
        type="dashboard"
        percent={Math.min(pct, 100)}
        format={() => (
          <div style={{ textAlign: 'center' }}>
            <FireOutlined style={{ fontSize: 18, color }} />
            <div style={{ fontSize: 18, fontWeight: 700, color }}>{Math.round(data.totalConsumed)}</div>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>kcal eaten</div>
          </div>
        )}
        strokeColor={color}
        size={140}
      />
      <div style={{ display: 'flex', gap: 24, marginTop: 12 }}>
        <Statistic title="Goal" value={Math.round(data.dailyGoal)} suffix="kcal" valueStyle={{ fontSize: 16 }} />
        <Statistic
          title="Remaining"
          value={Math.round(Math.max(data.remaining, 0))}
          suffix="kcal"
          valueStyle={{ fontSize: 16, color: data.remaining < 0 ? '#ff4d4f' : '#52c41a' }}
        />
      </div>
      {data.remaining < 0 && (
        <Text type="danger" style={{ marginTop: 8, fontSize: 12 }}>
          {Math.abs(Math.round(data.remaining))} kcal over daily goal
        </Text>
      )}
    </div>
  );
}
