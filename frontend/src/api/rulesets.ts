import client from './client';
import type { Ruleset, RulesetEntity, PaginatedResponse } from '../types';

export async function listRulesets() {
  const res = await client.get('/rulesets');
  return res.data.rulesets as Ruleset[];
}

export async function getRuleset(id: string) {
  const res = await client.get(`/rulesets/${id}`);
  return res.data.ruleset as Ruleset;
}

export async function listEntities(
  rulesetId: string,
  params: { type?: string; search?: string; page?: number; per_page?: number }
) {
  const res = await client.get(`/rulesets/${rulesetId}/entities`, { params });
  return res.data as PaginatedResponse<RulesetEntity>;
}

export async function getEntity(rulesetId: string, entityId: string) {
  const res = await client.get(`/rulesets/${rulesetId}/entities/${entityId}`);
  return res.data.entity as RulesetEntity;
}
