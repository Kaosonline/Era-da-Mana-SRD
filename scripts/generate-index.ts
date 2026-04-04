import { readdir, readFile, stat } from 'fs/promises';
import { join, relative, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

interface ContentItem {
  id: string;
  category: string;
  title: string;
  path: string;
}

async function getTitle(content: string): Promise<string> {
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    const match = trimmed.match(/^#{1,6}\s+(.+)$/);
    if (match) {
      return match[1].trim();
    }
  }
  return 'Sem título';
}

async function walkDir(dir: string, basePath: string = dir): Promise<ContentItem[]> {
  let items: ContentItem[] = [];
  
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
        const title = await getTitle(content);
        const category = relative(basePath, dir).split(/[\\/]/)[0];
        const id = basename(entry.name, '.md');
        
        items.push({
          id,
          category: category.toLowerCase(),
          title,
          path: relativePath.replace(/\\/g, '/')
        });
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
    const items = await walkDir(contentDir);
    
    // Agrupar por categoria
    const grouped: Record<string, ContentItem[]> = {};
    for (const item of items) {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    }
    
    // Ordenar categorias e itens
    const categories = Object.keys(grouped).sort();
    for (const category of categories) {
      grouped[category].sort((a, b) => a.title.localeCompare(b.title));
    }
    
    // Gerar arquivo de índice
    const outputFile = join(__dirname, '..', 'src', 'utils', 'contentIndex.ts');
    const content = `// Este arquivo é gerado automaticamente por scripts/generate-index.ts
// Não edite manualmente - suas mudanças serão sobrescritas

export interface ContentIndexItem {
  id: string;
  category: string;
  title: string;
  path: string;
}

export const contentIndex: ContentIndexItem[] = ${JSON.stringify(items, null, 2)};

export const contentIndexByCategory: Record<string, ContentIndexItem[]> = ${JSON.stringify(grouped, null, 2)};

export const categories = ${JSON.stringify(categories, null, 2)};

export function getItemById(id: string): ContentIndexItem | undefined {
  return contentIndex.find(item => item.id === id);
}

export function getItemsByCategory(category: string): ContentIndexItem[] {
  return contentIndexByCategory[category.toLowerCase()] || [];
}
`;
    
    await writeFile(outputFile, content);
    console.log(`✓ Índice gerado com sucesso: ${items.length} itens em ${categories.length} categorias`);
    console.log(`  Arquivo: ${outputFile}`);
    
  } catch (error) {
    console.error('Erro ao gerar índice:', error);
    process.exit(1);
  }
}

// Import para escrever arquivo
import { writeFile } from 'fs/promises';

generateIndex();
