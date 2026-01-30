import client from './client';
import type { Overlay } from '../types';

export async function listOverlays(params?: {
  ruleset_id?: string;
  campaign_id?: string;
  entity_type?: string;
}) {
  const res = await client.get('/overlays', { params });
  return res.data.overlays as Overlay[];
}

export async function createOverlay(data: {
  ruleset_id: string;
  entity_type: string;
  source_key: string;
  overlay_type: string;
  overlay_data: Record<string, unknown>;
  campaign_id?: string;
}) {
  const res = await client.post('/overlays', data);
  return res.data.overlay as Overlay;
}

export async function updateOverlay(
  id: string,
  data: { overlay_data?: Record<string, unknown>; overlay_type?: string }
) {
  const res = await client.put(`/overlays/${id}`, data);
  return res.data.overlay as Overlay;
}

export async function deleteOverlay(id: string) {
  await client.delete(`/overlays/${id}`);
}
