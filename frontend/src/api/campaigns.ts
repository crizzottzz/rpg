import client from './client';
import type { Campaign } from '../types';

export async function listCampaigns() {
  const res = await client.get('/campaigns');
  return res.data.campaigns as Campaign[];
}

export async function getCampaign(id: string) {
  const res = await client.get(`/campaigns/${id}`);
  return res.data.campaign as Campaign;
}

export async function createCampaign(data: {
  ruleset_id: string;
  name: string;
  description?: string;
}) {
  const res = await client.post('/campaigns', data);
  return res.data.campaign as Campaign;
}

export async function updateCampaign(id: string, data: Partial<Campaign>) {
  const res = await client.put(`/campaigns/${id}`, data);
  return res.data.campaign as Campaign;
}

export async function deleteCampaign(id: string) {
  await client.delete(`/campaigns/${id}`);
}
