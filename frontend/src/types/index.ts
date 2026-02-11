export interface User {
  id: string;
  username: string;
  email: string;
  created_at: string | null;
  updated_at: string | null;
}

export interface Ruleset {
  id: string;
  key: string;
  name: string;
  source_type: string;
  entity_types: string[];
  entity_count: number;
  created_at: string | null;
  updated_at: string | null;
}

/** Raw entity data blob from Open5e or other sources. Schema-driven — shape varies by entity type. */
export type EntityData = Record<string, unknown>;

export interface RulesetEntity {
  id: string;
  ruleset_id: string;
  entity_type: string;
  source_key: string;
  name: string;
  entity_data?: EntityData;
}

export interface Campaign {
  id: string;
  user_id: string;
  ruleset_id: string;
  name: string;
  description: string;
  status: 'active' | 'paused' | 'completed';
  settings: CampaignSettings;
  created_at: string;
  updated_at: string;
  character_count: number;
}

export interface CampaignSettings {
  [key: string]: unknown;
}

export interface ClassData {
  name?: string;
  [key: string]: unknown;
}

/** Equipment can be a simple name string or a structured object. */
export type EquipmentItem = string | { name: string; [key: string]: unknown };

/** Spell reference can be a simple name string or a structured object. */
export type SpellEntry = string | { name: string; [key: string]: unknown };

export interface Character {
  id: string;
  campaign_id: string;
  user_id: string;
  name: string;
  character_type: 'pc' | 'npc';
  level: number;
  core_data: CoreData;
  class_data: ClassData;
  equipment: EquipmentItem[];
  spells: SpellEntry[];
  created_at: string;
  updated_at: string;
}

export interface CoreData {
  ability_scores?: AbilityScores;
  hp_max?: number;
  hp_current?: number;
  ac?: number;
  speed?: number;
  proficiency_bonus?: number;
  species?: string;
  alignment?: string;
  background?: string;
}

export interface AbilityScores {
  str: number;
  dex: number;
  con: number;
  int: number;
  wis: number;
  cha: number;
}

export interface Overlay {
  id: string;
  user_id: string;
  ruleset_id: string;
  entity_type: string;
  source_key: string;
  overlay_type: 'modify' | 'homebrew' | 'disable';
  overlay_data: Record<string, unknown>;
  campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedResponse<T> {
  entities: T[];
  total: number;
  page: number;
  pages: number;
  per_page: number;
}
