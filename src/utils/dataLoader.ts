import type { ContentItem } from '../types/content';

// Cache para o índice (metadados leves)
let indexCache: ContentItem[] | null = null;

// Cache para módulos de conteúdo carregados sob demanda
const contentModuleCache = new Map<string, string>();

const contentModules = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: false,
}) as Record<string, () => Promise<string>>;

function buildModulePath(category: string, id: string): string {
  const possiblePaths = [
    `../content/${category}/${id}.md`,
    `../content/${category}/${id.replace(/-/g, ' ')}.md`,
    `../content/${category}/${id.replace(/-/g, '_')}.md`,
  ];

  for (const path of possiblePaths) {
    if (contentModules[path]) {
      return path;
    }
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
  if (indexCache) {
    return indexCache;
  }

  try {
    const response = await fetch('/content-index.json');
    if (!response.ok) {
      throw new Error(`Failed to load content index: ${response.status}`);
    }
    const data = await response.json();
    indexCache = data.items as ContentItem[];
    return indexCache;
  } catch (error) {
    console.error('Erro ao carregar índice de conteúdo, tentando fallback...', error);
    return loadContentFallback();
  }
}

async function loadContentFallback(): Promise<ContentItem[]> {
  if (indexCache) return indexCache;

  const moduleEntries = Object.entries(contentModules);
  const loadedItems: ContentItem[] = [];

  for (const [path, loadModule] of moduleEntries) {
    try {
      const source = await loadModule();
      const category = getCategoryFromPath(path);
      const title = getTitleFromMarkdown(source);
      const id = getIdFromPath(path);

      let item: ContentItem = {
        id,
        category,
        title,
        content: source,
      };

      if (category === 'magias') {
        const { parseSpellMetadata } = await import('./spellParser');
        const spellMetadata = parseSpellMetadata(source);
        if (spellMetadata) {
          const mapped: Partial<ContentItem> = {};

          if (spellMetadata.escola) {
            mapped.spellSchool = spellMetadata.escola;
          }

          if (spellMetadata.classes && spellMetadata.classes.length > 0) {
            mapped.spellClasses = spellMetadata.classes.map((c: { nome: string; nivel: number }) => ({
              className: c.nome,
              level: c.nivel
            }));
            const levels = spellMetadata.classes.map((c: { nivel: number }) => c.nivel);
            mapped.spellLevel = Math.min(...levels);
          }

          if (spellMetadata.tempoConjuracao) {
            mapped.spellCastingTime = spellMetadata.tempoConjuracao;
          }

          if (spellMetadata.duracao) {
            mapped.spellDuration = spellMetadata.duracao;
          }

          item = { ...item, ...mapped };
        }
      }

      loadedItems.push(item);
    } catch (error) {
      console.error(`Erro ao carregar ${path}:`, error);
    }
  }

  const sortedItems = loadedItems.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.title.localeCompare(b.title);
  });

  indexCache = sortedItems;
  return sortedItems;
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

function getCategoryFromPath(path: string): string {
  const parts = path.split('/');
  const contentIdx = parts.findIndex(p => p === 'content');
  if (contentIdx !== -1 && parts.length > contentIdx + 1) {
    return parts[contentIdx + 1].toLowerCase();
  }
  return 'General';
}

function getTitleFromMarkdown(markdown: string): string {
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const headerMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headerMatch) {
      return headerMatch[1].trim();
    }
  }
  return 'Artigo sem título';
}

function getIdFromPath(path: string): string {
  const clean = path.replace(/^\.\.\/content\//, '').replace(/\.md$/, '');
  const parts = clean.split('/');
  return parts[parts.length - 1];
}
