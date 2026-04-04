import { readdir, readFile } from 'fs/promises';
import { join, relative, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import { writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ContentIndexItem {
  id: string;
  category: string;
  title: string;
  path: string;
  spellLevel?: number;
  spellSchool?: string;
  spellCastingTime?: string;
  spellDuration?: string;
  spellClasses?: Array<{ className: string; level: number }>;
}

interface SpellMetadata {
  escola: string;
  classes: { nome: string; nivel: number }[];
  tempoConjuracao?: string;
  duracao?: string;
}

function parseSpellMetadata(markdown: string): SpellMetadata | null {
  const lines = markdown.split('\n');
  const metadata: SpellMetadata = { escola: '', classes: [] };

  const keyMap: Record<string, keyof SpellMetadata> = {
    'escola': 'escola',
    'nivel': 'classes',
    'nível': 'classes',
    'level': 'classes',
    'tempo de conjuração': 'tempoConjuracao',
    'casting time': 'tempoConjuracao',
    'tempo': 'tempoConjuracao',
    'duração': 'duracao',
    'duration': 'duracao',
  };

  for (const line of lines) {
    const regex = /\*\*(.*?)\*\*\s*([^*]*)/g;
    let match;
    while ((match = regex.exec(line)) !== null) {
      const key = match[1].trim().toLowerCase();
      let value = match[2].trim();
      value = value.replace(/;+$/, '').trim();
      const nextAsterisk = value.indexOf('**');
      if (nextAsterisk !== -1) {
        value = value.substring(0, nextAsterisk).trim();
      }
      const field = keyMap[key];
      if (!field) continue;
      if (field === 'classes') {
        value.split(',').map(c => c.trim()).forEach(classe => {
          const parts = classe.split(/\s+/);
          if (parts.length >= 2) {
            const nome = parts.slice(0, -1).join(' ');
            const nivel = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(nivel)) {
              metadata.classes.push({ nome, nivel });
            }
          }
        });
      } else {
        // @ts-ignore
        metadata[field] = value;
      }
    }
  }

  if (!metadata.escola && metadata.classes.length === 0) return null;
  return metadata;
}

function getTitle(content: string): string {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (match) return match[1].trim();
  }
  return 'Sem título';
}

async function walkDir(dir: string, basePath: string = dir): Promise<Array<{ id: string; category: string; title: string; path: string; content: string }>> {
  let items: Array<{ id: string; category: string; title: string; path: string; content: string }> = [];

  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const relativePath = relative(basePath, fullPath);
      if (entry.isDirectory()) {
        const subItems = await walkDir(fullPath, basePath);
        items = [...items, ...subItems];
      } else if (entry.isFile() && extname(entry.name) === '.md') {
        const content = await readFile(fullPath, 'utf-8');
        const title = getTitle(content);
        const category = relative(basePath, dir).split(/[\\/]/)[0];
        const id = basename(entry.name, '.md');
        items.push({ id, category: category.toLowerCase(), title, path: relativePath.replace(/\\/g, '/'), content });
      }
    }
  } catch (error) {
    console.error(`Erro ao ler diretório ${dir}:`, error);
  }

  return items;
}

async function generateIndex() {
  try {
    console.log('Gerando índice de conteúdo...');

    const contentDir = join(__dirname, '..', 'src', 'content');
    const rawItems = await walkDir(contentDir);

    const grouped: Record<string, typeof rawItems> = {};
    for (const item of rawItems) {
      if (!grouped[item.category]) grouped[item.category] = [];
      grouped[item.category].push(item);
    }

    const categories = Object.keys(grouped).sort();
    for (const category of categories) {
      grouped[category].sort((a, b) => a.title.localeCompare(b.title));
    }

    const indexItems: ContentIndexItem[] = rawItems.map(item => {
      const base: ContentIndexItem = {
        id: item.id,
        category: item.category,
        title: item.title,
        path: item.path,
      };

      if (item.category === 'magias') {
        const spellMeta = parseSpellMetadata(item.content);
        if (spellMeta) {
          if (spellMeta.escola) base.spellSchool = spellMeta.escola;
          if (spellMeta.classes.length > 0) {
            base.spellClasses = spellMeta.classes.map(c => ({ className: c.nome, level: c.nivel }));
            const levels = spellMeta.classes.map(c => c.nivel);
            base.spellLevel = Math.min(...levels);
          }
          if (spellMeta.tempoConjuracao) base.spellCastingTime = spellMeta.tempoConjuracao;
          if (spellMeta.duracao) base.spellDuration = spellMeta.duracao;
        }
      }

      return base;
    });

    const tsOutputFile = join(__dirname, '..', 'src', 'utils', 'contentIndex.ts');
    const tsContent = `// Este arquivo é gerado automaticamente por scripts/generate-index.ts
// Não edite manualmente - suas mudanças serão sobrescritas

export interface ContentIndexItem {
  id: string;
  category: string;
  title: string;
  path: string;
  spellLevel?: number;
  spellSchool?: string;
  spellCastingTime?: string;
  spellDuration?: string;
  spellClasses?: Array<{ className: string; level: number }>;
}

export const contentIndex: ContentIndexItem[] = ${JSON.stringify(indexItems, null, 2)};

export const contentIndexByCategory: Record<string, ContentIndexItem[]> = ${JSON.stringify(
      categories.reduce((acc, cat) => {
        acc[cat] = indexItems.filter(i => i.category === cat);
        return acc;
      }, {} as Record<string, ContentIndexItem[]>),
      null, 2
    )};

export const categories = ${JSON.stringify(categories, null, 2)};

export function getItemById(id: string): ContentIndexItem | undefined {
  return contentIndex.find(item => item.id === id);
}

export function getItemsByCategory(category: string): ContentIndexItem[] {
  return contentIndexByCategory[category.toLowerCase()] || [];
}
`;

    await writeFile(tsOutputFile, tsContent);
    console.log(`✓ Índice TypeScript gerado: ${indexItems.length} itens em ${categories.length} categorias`);

    const jsonOutputFile = join(__dirname, '..', 'public', 'content-index.json');
    const jsonContent = JSON.stringify({ items: indexItems });
    await writeFile(jsonOutputFile, jsonContent);
    console.log(`✓ Índice JSON gerado: ${jsonContent.length} bytes`);

  } catch (error) {
    console.error('Erro ao gerar índice:', error);
    process.exit(1);
  }
}

generateIndex();
