const CATEGORY_ICONS: Record<string, string> = {
  'raças': '🧝',
  'classes': '⚔️',
  'magias': '✨',
  'talentos': '📜',
  'perícias': '🎯',
  'equipamentos': '🛡️',
  'condições': '⚠️',
  'regras': '📖',
};

export function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category.toLowerCase()] || '📚';
}

export function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
}
