import type { ContentItem } from '../types/content';
import { parseSpellMetadata } from './spellParser';

const modules = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
}) as Record<string, string>;

function getCategory(path: string): string {
  const parts = path.split('/');
  const contentIdx = parts.findIndex(p => p === 'content');
  if (contentIdx !== -1 && parts.length > contentIdx + 1) {
    return parts[contentIdx + 1].toLowerCase();
  }
  return 'General';
}

function getTitle(markdown: string): string {
  const lines = markdown.split('\n');
  
  // Procurar pela primeira linha que seja um cabeçalho (1 a 6 '#')
  for (const line of lines) {
    const trimmed = line.trim();
    // Regex: começa com 1-6 '#', seguido de espaço, e captura o resto
    const headerMatch = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (headerMatch) {
      return headerMatch[1].trim();
    }
  }
  
  return 'Artigo sem título';
}

function getId(path: string): string {
  const clean = path.replace(/^\.\.\/content\//, '').replace(/\.md$/, '');
  return clean;
}

export function loadContent(): ContentItem[] {
  const items: ContentItem[] = [];

  for (const [path, source] of Object.entries(modules)) {
    const category = getCategory(path);
    const title = getTitle(source);
    const id = getId(path);
    
    let item: ContentItem = {
      id,
      category,
      title,
      content: source,
    };
    
    if (category === 'spells') {
      const spellMetadata = parseSpellMetadata(source);
      if (spellMetadata) {
        const mapped: Partial<ContentItem> = {};
        
        if (spellMetadata.escola) {
          mapped.spellSchool = spellMetadata.escola;
        }
        
        if (spellMetadata.classes && spellMetadata.classes.length > 0) {
          // Mapear { nome, nivel } → { className, level }
          mapped.spellClasses = spellMetadata.classes.map((c: { nome: string; nivel: number }) => ({
            className: c.nome,
            level: c.nivel
          }));
          // Para compatibilidade com filtros existentes, use o menor nível
          const levels = spellMetadata.classes.map(c => c.nivel);
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
    
    items.push(item);
  }

  return items.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category);
    }
    return a.title.localeCompare(b.title);
  });
}

export function getCategories(items: ContentItem[]): string[] {
  return Array.from(new Set(items.map(item => item.category))).sort();
}

export function getUniqueSpellValues(items: ContentItem[], field: keyof ContentItem): string[] {
  const values = items
    .filter(item => item.category === 'spells' && item[field])
    .map(item => String(item[field]))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));
  
  return values;
}