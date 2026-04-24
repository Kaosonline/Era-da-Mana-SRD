export interface ContentItem {
  id: string;
  title: string;
  category: string;
  content: string;
  subcategory?: string;
  
  spellLevel?: number;
  spellSchool?: string;
  spellCastingTime?: string;
  spellDuration?: string;
  spellClasses?: Array<{ className: string; level: number }>;
  
  featType?: string;
  hasPrerequisites?: boolean;
}

export interface ContentIndexEntry {
  id: string;
  title: string;
  category: string;
  subcategory?: string;
  spellLevel?: number;
  spellSchool?: string;
  spellCastingTime?: string;
  spellDuration?: string;
  spellClasses?: Array<{ className: string; level: number }>;
  featType?: string;
  hasPrerequisites?: boolean;
}

export interface SpellFilters {
  level?: string;
  school?: string;
  castingTime?: string;
  duration?: string;
}