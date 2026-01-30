import client from './client';
import type { User } from '../types';

export async function login(username: string, password: string) {
  const res = await client.post('/auth/login', { username, password });
  return res.data as { access_token: string; refresh_token: string; user: User };
}

export async function getMe() {
  const res = await client.get('/auth/me');
  return res.data.user as User;
}
