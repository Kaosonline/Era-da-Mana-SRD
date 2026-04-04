export interface ContentItem {
  id: string;
  title: string;
  category: string;
  content: string;
  
  spellLevel?: number;
  spellSchool?: string;
  spellCastingTime?: string;
  spellDuration?: string;
  spellClasses?: Array<{ className: string; level: number }>;
}

export interface ContentIndexEntry {
  id: string;
  title: string;
  category: string;
  spellLevel?: number;
  spellSchool?: string;
  spellCastingTime?: string;
  spellDuration?: string;
  spellClasses?: Array<{ className: string; level: number }>;
}

export interface SpellFilters {
  level?: string;
  school?: string;
  castingTime?: string;
  duration?: string;
}