import client from './client';
import type { Character } from '../types';

export async function listCharacters(campaignId: string) {
  const res = await client.get(`/campaigns/${campaignId}/characters`);
  return res.data.characters as Character[];
}

export async function getCharacter(id: string) {
  const res = await client.get(`/characters/${id}`);
  return res.data.character as Character;
}

export async function createCharacter(
  campaignId: string,
  data: Partial<Character>
) {
  const res = await client.post(`/campaigns/${campaignId}/characters`, data);
  return res.data.character as Character;
}

export async function updateCharacter(id: string, data: Partial<Character>) {
  const res = await client.put(`/characters/${id}`, data);
  return res.data.character as Character;
}

export async function deleteCharacter(id: string) {
  await client.delete(`/characters/${id}`);
}
