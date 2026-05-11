import api from './axiosClient';
import type { DailyLogResponse, NutritionLogDto, WeeklyHistoryResponse } from '../types';

export async function getDailyLog(date?: string): Promise<DailyLogResponse> {
  const res = await api.get<DailyLogResponse>('/nutrition/daily', { params: { date } });
  return res.data;
}

export async function getWeeklyHistory(): Promise<WeeklyHistoryResponse> {
  const res = await api.get<WeeklyHistoryResponse>('/nutrition/history');
  return res.data;
}

export async function logFood(foodId: string, qty: number, logDate?: string): Promise<NutritionLogDto> {
  const res = await api.post<NutritionLogDto>('/nutrition/log', { foodId, qty, logDate });
  return res.data;
}

export async function deleteLog(id: string): Promise<void> {
  await api.delete(`/nutrition/log/${id}`);
}
