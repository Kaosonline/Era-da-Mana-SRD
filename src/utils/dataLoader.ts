import type { ContentItem } from '../types/content';

const contentModules = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: false,
}) as Record<string, () => Promise<string>>;

const contentModuleCache = new Map<string, string>();

let indexCache: ContentItem[] | null = null;

function buildModulePath(category: string, id: string): string {
  const possiblePaths = [
    `../content/${category}/${id}.md`,
    `../content/${category}/${id.replace(/-/g, ' ')}.md`,
    `../content/${category}/${id.replace(/-/g, '_')}.md`,
  ];

  for (const path of possiblePaths) {
    if (contentModules[path]) return path;
  }

  const allPaths = Object.keys(contentModules);
  const normalizedId = id.toLowerCase();
  const normalizedCategory = category.toLowerCase();

  const found = allPaths.find(p => {
    const normalized = p.toLowerCase();
    return normalized.includes(normalizedCategory) && 
           (normalized.includes(normalizedId) || 
            normalized.includes(normalizedId.replace(/-/g, ' ')) ||
            normalized.includes(normalizedId.replace(/-/g, '_')));
  });

  return found || possiblePaths[0];
}

export async function loadContentIndex(): Promise<ContentItem[]> {
  if (indexCache) return indexCache;

  try {
    const response = await fetch('/content-index.json');
    if (!response.ok) throw new Error(`Failed to load index: ${response.status}`);
    const data = await response.json();
    indexCache = data.items as ContentItem[];
    return indexCache;
  } catch (error) {
    console.error('Erro ao carregar índice JSON, usando fallback vazio:', error);
    indexCache = [];
    return indexCache;
  }
}

export async function loadContentItem(category: string, id: string): Promise<string | null> {
  const cacheKey = `${category}/${id}`;

  if (contentModuleCache.has(cacheKey)) {
    return contentModuleCache.get(cacheKey) || null;
  }

  const modulePath = buildModulePath(category, id);

  if (!contentModules[modulePath]) {
    console.warn(`Módulo não encontrado para ${category}/${id}`);
    return null;
  }

  try {
    const source = await contentModules[modulePath]();
    contentModuleCache.set(cacheKey, source);
    return source;
  } catch (error) {
    console.error(`Erro ao carregar conteúdo ${category}/${id}:`, error);
    return null;
  }
}

export function clearContentCache(): void {
  indexCache = null;
  contentModuleCache.clear();
}

export function getCategories(items: ContentItem[]): string[] {
  return Array.from(new Set(items.map(item => item.category))).sort();
}

export function getUniqueSpellValues(items: ContentItem[], field: keyof ContentItem): string[] {
  const values = items
    .filter(item => item.category === 'magias' && item[field])
    .map(item => String(item[field]))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));

  return values;
}
