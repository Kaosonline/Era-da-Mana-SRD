export interface ContentItem {
  id: string;
  category: string;
  title: string;
  content: string;
  // Campos específicos para magias (opcionais)
  spellLevel?: number;
  spellSchool?: string;
  spellCastingTime?: string;
  spellDuration?: string;
  spellRange?: string;
  spellArea?: string;
  spellComponents?: string;
  spellSavingThrow?: string;
  spellSpellResistance?: string;
}