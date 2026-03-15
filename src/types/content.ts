export interface ContentItem {
  id: string;
  title: string;
  category: string;
  content: string;
  
  // Campos de spells
  spellLevel?: number; // menor nível (para filtro)
  spellSchool?: string;
  spellCastingTime?: string;
  spellDuration?: string;
  spellClasses?: Array<{ className: string; level: number }>; // para exibição
}

export interface SpellFilters {
  level?: string;
  school?: string;
  castingTime?: string;
  duration?: string;
}