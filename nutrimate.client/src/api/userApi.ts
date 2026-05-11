import api from './axiosClient';
import type { UserProfile } from '../types';

export async function getProfile(): Promise<UserProfile> {
  const res = await api.get<UserProfile>('/user/profile');
  return res.data;
}

export async function updateProfile(data: Partial<Pick<UserProfile, 'fullName' | 'age' | 'weight' | 'height' | 'gender'>>): Promise<UserProfile> {
  const res = await api.put<UserProfile>('/user/profile', data);
  return res.data;
}
