import type { ContentItem } from '../types/content';

const modules = import.meta.glob('../content/**/*.md', {
  query: '?raw',
  import: 'default',
  eager: true
});

function getCategory(path: string): string {
  const parts = path.split('/');
  const contentIdx = parts.findIndex(p => p === 'content');
  if (contentIdx !== -1 && parts.length > contentIdx + 1) {
    return parts[contentIdx + 1];
  }
  return 'General';
}

function getTitle(markdown: string): string {
  const lines = markdown.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) {
      return trimmed.substring(2);
    }
  }
  return 'Artigo sem título';
}

function getId(path: string): string {
  const clean = path.replace(/^\.\.\/content\//, '').replace(/\.md$/, '');
  return clean;
}

// Parser FLEXÍVEL que funciona com múltiplos formatos
function parseSpellMetadata(content: string): Partial<ContentItem> {
  const metadata: Partial<ContentItem> = {};
  const lines = content.split('\n');
  
  // Padrões comuns (case-insensitive)
  const patterns = [
    // Nível/Level
    { keys: ['nível', 'nivel', 'level'], field: 'spellLevel' as keyof ContentItem },
    // Escola/School
    { keys: ['escola', 'school'], field: 'spellSchool' as keyof ContentItem },
    // Tempo de Conjuração/Casting Time
    { keys: ['tempo de conjuração', 'casting time', 'tempo'], field: 'spellCastingTime' as keyof ContentItem },
    // Duração/Duration
    { keys: ['duração', 'duration'], field: 'spellDuration' as keyof ContentItem },
    // Alcance/Range
    { keys: ['alcance', 'range'], field: 'spellRange' as keyof ContentItem },
    // Componentes/Components
    { keys: ['componentes', 'components'], field: 'spellComponents' as keyof ContentItem },
    // Teste de Resistência/Saving Throw
    { keys: ['teste de resistência', 'saving throw', 'resistência'], field: 'spellSavingThrow' as keyof ContentItem },
  ];
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Pular linhas vazias ou que não têm ':'
    if (!trimmed.includes(':')) continue;
    
    // Remover formatação markdown (**, *, __, etc)
    let cleanLine = trimmed
      .replace(/\*\*/g, '')
      .replace(/\*/g, '')
      .replace(/__/g, '')
      .replace(/_/g, '');

    
    // Separar chave e valor
    const colonIndex = cleanLine.indexOf(':');
    if (colonIndex === -1) continue;
    
    const key = cleanLine.substring(0, colonIndex).trim().toLowerCase();
    const value = cleanLine.substring(colonIndex + 1).trim();
    
    // Se a chave está vazia ou muito longa, pular
    if (!key || key.length > 50) continue;
    
    // Verificar se corresponde a algum padrão
    for (const pattern of patterns) {
      if (pattern.keys.some(patternKey => key.includes(patternKey))) {
        if (pattern.field === 'spellLevel') {
          const level = parseInt(value, 10);
          if (!isNaN(level) && level >= 0 && level <= 9) {
            metadata[pattern.field] = level;
          }
        } else {
          metadata[pattern.field] = value;
        }
        break; // Achou, para de verificar
      }
    }
  }
  
  return metadata;
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
    
    // Se for magia, extrair metadados (mesmo que não tenha)
    if (category === 'spells') {
      const spellMetadata = parseSpellMetadata(source);
      item = { ...item, ...spellMetadata };
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

// Extrai valores únicos de um campo de spells (apenas definidos)
export function getUniqueSpellValues(items: ContentItem[], field: keyof ContentItem): string[] {
  const values = items
    .filter(item => item.category === 'spells' && item[field])
    .map(item => String(item[field]))
    .filter((value, index, arr) => arr.indexOf(value) === index)
    .sort((a, b) => a.localeCompare(b));
  
  return values;
}