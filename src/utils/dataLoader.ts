import type { ContentItem } from '../types/content';

const contentModules = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: false,
}) as Record<string, () => Promise<string>>;

const MAX_CACHE_SIZE = 100;
const contentModuleCache = new Map<string, string>();

let indexCache: ContentItem[] | null = null;

/**
 * Constrói o caminho do módulo para um item de conteúdo
 * Tenta várias normalizações do ID para encontrar o arquivo correspondente
 * @param category Categoria do conteúdo (ex: 'magias', 'talentos')
 * @param id Identificador do item
 * @returns Caminho do módulo ou o primeiro caminho possível se não encontrado
 */
function buildModulePath(category: string, id: string): string {
  // Tenta caminhos diretos com diferentes normalizações
  const possiblePaths = [
    `../content/${category}/${id}.md`,
    `../content/${category}/${id.replace(/-/g, ' ')}.md`,
    `../content/${category}/${id.replace(/-/g, '_')}.md`,
  ];

  for (const path of possiblePaths) {
    if (contentModules[path]) return path;
  }

  // Se não encontrado, busca por correspondência aproximada
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
    if (!response.ok) {
      throw new Error(`Falha ao carregar índice: ${response.status} ${response.statusText}`);
    }
    const data = await response.json();

    if (!data.items || !Array.isArray(data.items)) {
      throw new Error('Formato de índice inválido: propriedade "items" ausente ou não é um array');
    }

    indexCache = data.items as ContentItem[];
    return indexCache;
  } catch (error) {
    console.error('Erro ao carregar índice JSON:', error);
    // Notificar usuário sobre o erro
    if (typeof window !== 'undefined') {
      console.warn('O aplicativo continuará com funcionalidade limitada.');
    }
    indexCache = [];
    return indexCache;
  }
}

/**
 * Carrega o conteúdo de um item específico
 * Usa cache para evitar carregamentos repetidos
 * @param category Categoria do conteúdo
 * @param id Identificador do item
 * @returns Conteúdo em formato string ou null se não encontrado
 */
export async function loadContentItem(category: string, id: string): Promise<string | null> {
  const cacheKey = `${category}/${id}`;

  // Verifica cache primeiro
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

    // Limitar tamanho do cache para evitar memory leaks
    if (contentModuleCache.size > MAX_CACHE_SIZE) {
      const firstKey = contentModuleCache.keys().next().value;
      contentModuleCache.delete(firstKey);
    }

    return source;
  } catch (error) {
    console.error(`Erro ao carregar conteúdo ${category}/${id}:`, error);
    return null;
  }
}

/**
 * Limpa todos os caches de conteúdo
 * Útil para forçar recarregamento ou liberar memória
 */
export function clearContentCache(): void {
  indexCache = null;
  contentModuleCache.clear();
}

/**
 * Extrai todas as categorias únicas dos itens
 * @param items Lista de itens de conteúdo
 * @returns Array de categorias ordenadas
 */
export function getCategories(items: ContentItem[]): string[] {
  return Array.from(new Set(items.map(item => item.category))).sort();
}

/**
 * Extrai valores únicos de um campo específico para magias
 * @param items Lista de itens de conteúdo
 * @param field Campo a ser extraído (ex: 'spellSchool', 'spellCastingTime')
 * @returns Array de valores únicos ordenados
 */
export function getUniqueSpellValues(items: ContentItem[], field: keyof ContentItem): string[] {
  const values = items
    .filter(item => item.category === 'magias' && item[field])
    .map(item => String(item[field]))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));

  return values;
}

/**
 * Extrai todos os tipos únicos de talentos
 * @param items Lista de itens de conteúdo
 * @returns Array de tipos de talentos ordenados
 */
export function getUniqueFeatTypes(items: ContentItem[]): string[] {
  const values = items
    .filter(item => item.category === 'talentos' && item.featType)
    .map(item => String(item.featType))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));

  return values;
}
