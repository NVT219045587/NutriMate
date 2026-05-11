import { Progress, Tag, Typography } from 'antd';
import type { UserProfile } from '../../types';
import { calculateBmi, getBmiInfo, bmiToPercent } from '../../utils/bmi';

const { Text } = Typography;

const BMI_RANGES = [
  { label: 'Underweight', range: '< 18.5', color: '#1677ff' },
  { label: 'Healthy', range: '18.5–24.9', color: '#52c41a' },
  { label: 'Overweight', range: '25–29.9', color: '#faad14' },
  { label: 'Obese I', range: '30–34.9', color: '#ff7a45' },
  { label: 'Obese II+', range: '≥ 35', color: '#ff4d4f' },
];

interface Props {
  profile: UserProfile;
}

export default function BmiCard({ profile }: Props) {
  const bmi = calculateBmi(profile.weight, profile.height);
  const info = getBmiInfo(bmi);
  const percent = bmiToPercent(bmi);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', alignItems: 'center' }}>
      <Text strong style={{ fontSize: 15, marginBottom: 8 }}>Body Mass Index</Text>
      <Progress
        type="dashboard"
        percent={percent}
        format={() => (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: info.color }}>{bmi}</div>
            <div style={{ fontSize: 11, color: '#8c8c8c' }}>BMI</div>
          </div>
        )}
        strokeColor={info.color}
        size={140}
      />
      <Tag color={info.color} style={{ marginTop: 8, fontWeight: 600 }}>{info.category}</Tag>
      <Text type="secondary" style={{ fontSize: 12, marginTop: 4 }}>{info.description}</Text>

      <div style={{ marginTop: 16, width: '100%' }}>
        {BMI_RANGES.map(r => (
          <div key={r.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, padding: '2px 0' }}>
            <Text style={{ color: r.color, fontWeight: info.category.startsWith(r.label.split(' ')[0]) ? 700 : 400 }}>
              {r.label}
            </Text>
            <Text type="secondary">{r.range}</Text>
          </div>
        ))}
      </div>
    </div>
  );
}
