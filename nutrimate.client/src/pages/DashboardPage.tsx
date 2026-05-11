import { useEffect, useState, useCallback } from 'react';
import { Card, Spin } from 'antd';
import GridLayout from 'react-grid-layout';
import type { Layout } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import dayjs from 'dayjs';
import type { UserProfile, DailyLogResponse, WeeklyHistoryResponse } from '../types';
import { getProfile } from '../api/userApi';
import { getDailyLog, getWeeklyHistory } from '../api/nutritionApi';
import AppLayout from '../components/Layout/AppLayout';
import ProfileCard from '../components/Dashboard/ProfileCard';
import BmiCard from '../components/Dashboard/BmiCard';
import DailyGoalCard from '../components/Dashboard/DailyGoalCard';
import CalorieChart from '../components/Dashboard/CalorieChart';
import FoodLogCard from '../components/Dashboard/FoodLogCard';

const STORAGE_KEY = 'nutrimate-dashboard-layout';

const defaultLayout: Layout[] = [
  { i: 'profile',   x: 0,  y: 0, w: 4, h: 7,  minW: 3, minH: 5 },
  { i: 'bmi',       x: 4,  y: 0, w: 4, h: 7,  minW: 3, minH: 5 },
  { i: 'dailyGoal', x: 8,  y: 0, w: 4, h: 7,  minW: 3, minH: 5 },
  { i: 'chart',     x: 0,  y: 7, w: 12, h: 8, minW: 6, minH: 5 },
  { i: 'foodLog',   x: 0,  y: 15, w: 12, h: 11, minW: 6, minH: 7 },
];

function loadLayout(): Layout[] {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : defaultLayout;
  } catch {
    return defaultLayout;
  }
}

export default function DashboardPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [dailyLog, setDailyLog] = useState<DailyLogResponse | null>(null);
  const [weeklyHistory, setWeeklyHistory] = useState<WeeklyHistoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [layout, setLayout] = useState<Layout[]>(loadLayout);
  const [containerWidth, setContainerWidth] = useState(window.innerWidth - 64);

  const today = dayjs().format('YYYY-MM-DD');

  const fetchDailyLog = useCallback(async () => {
    const [log, history] = await Promise.all([getDailyLog(today), getWeeklyHistory()]);
    setDailyLog(log);
    setWeeklyHistory(history);
  }, [today]);

  useEffect(() => {
    Promise.all([getProfile(), getDailyLog(today), getWeeklyHistory()])
      .then(([p, log, history]) => {
        setProfile(p);
        setDailyLog(log);
        setWeeklyHistory(history);
      })
      .finally(() => setLoading(false));

    const handleResize = () => setContainerWidth(window.innerWidth - 64);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [today]);

  const handleLayoutChange = (newLayout: Layout[]) => {
    setLayout(newLayout);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newLayout));
  };

  if (loading) {
    return (
      <AppLayout>
        <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 80 }}>
          <Spin size="large" tip="Loading your dashboard…" />
        </div>
      </AppLayout>
    );
  }

  const cardStyle: React.CSSProperties = {
    height: '100%', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
  };
  const bodyStyle: React.CSSProperties = { height: 'calc(100% - 56px)', overflow: 'auto', padding: 16 };

  return (
    <AppLayout>
      <GridLayout
        layout={layout}
        cols={12}
        rowHeight={30}
        width={containerWidth}
        onLayoutChange={handleLayoutChange}
        draggableHandle=".drag-handle"
        margin={[12, 12]}
      >
        <div key="profile">
          <Card
            title={<span className="drag-handle" style={{ cursor: 'grab' }}>Profile</span>}
            style={cardStyle}
            styles={{ body: bodyStyle }}
          >
            {profile && <ProfileCard profile={profile} onUpdate={setProfile} />}
          </Card>
        </div>

        <div key="bmi">
          <Card
            title={<span className="drag-handle" style={{ cursor: 'grab' }}>BMI</span>}
            style={cardStyle}
            styles={{ body: bodyStyle }}
          >
            {profile && <BmiCard profile={profile} />}
          </Card>
        </div>

        <div key="dailyGoal">
          <Card
            title={<span className="drag-handle" style={{ cursor: 'grab' }}>Daily Goal</span>}
            style={cardStyle}
            styles={{ body: bodyStyle }}
          >
            <DailyGoalCard data={dailyLog} />
          </Card>
        </div>

        <div key="chart">
          <Card
            title={<span className="drag-handle" style={{ cursor: 'grab' }}>Calorie History</span>}
            style={cardStyle}
            styles={{ body: { ...bodyStyle, overflow: 'hidden' } }}
          >
            <CalorieChart data={weeklyHistory} />
          </Card>
        </div>

        <div key="foodLog">
          <Card
            title={<span className="drag-handle" style={{ cursor: 'grab' }}>Food Log</span>}
            style={cardStyle}
            styles={{ body: bodyStyle }}
          >
            <FoodLogCard dailyLog={dailyLog} selectedDate={today} onRefresh={fetchDailyLog} />
          </Card>
        </div>
      </GridLayout>
    </AppLayout>
  );
}
