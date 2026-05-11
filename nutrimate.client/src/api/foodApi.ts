import api from './axiosClient';
import type { Food } from '../types';

export async function getFoods(search?: string, type?: string): Promise<Food[]> {
  const res = await api.get<Food[]>('/food', { params: { search, type } });
  return res.data;
}
