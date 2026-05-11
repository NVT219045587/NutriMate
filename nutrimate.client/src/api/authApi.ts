import axios from 'axios';
import type { AuthResponse } from '../types';

export async function register(data: {
  username: string;
  password: string;
  fullName: string;
  age: number;
  weight: number;
  height: number;
  gender: string;
}): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>('/api/auth/register', data, { withCredentials: true });
  return res.data;
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const res = await axios.post<AuthResponse>('/api/auth/login', { username, password }, { withCredentials: true });
  return res.data;
}

export async function logout(): Promise<void> {
  await axios.post('/api/auth/logout', {}, { withCredentials: true });
}

export async function refresh(): Promise<AuthResponse> {
  const res = await axios.get<AuthResponse>('/api/auth/refresh', { withCredentials: true });
  return res.data;
}
