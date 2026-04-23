const express = require('express');
const fs = require('fs');
const path = require('path');
const Indexer = require('./lib/indexer');
const SearchEngine = require('./lib/searchEngine');

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content');
const PROGRESS_FILE = path.join(__dirname, 'review-progress.json');
const GLOBAL_CSS_PATH = path.join(__dirname, '..', 'src', 'styles', 'global.css');
const VARIABLES_CSS_PATH = path.join(__dirname, '..', 'src', 'styles', 'variables.css');

// Initialize search engine
const indexer = new Indexer(CONTENT_DIR);
const searchEngine = new SearchEngine(indexer);

// Build index on startup
(async () => {
  await indexer.buildIndex();
  indexer.startWatcher();
})();

// Rota: listar todos os arquivos de uma categoria
app.get('/api/list/:category', (req, res) => {
  const category = req.params.category;
  const files = indexer.getFilesByCategory(category);
  
  if (!files || files.length === 0) {
    // Fallback to filesystem if index not ready
    const categoryDir = path.join(CONTENT_DIR, category);
    if (!fs.existsSync(categoryDir)) {
      return res.status(404).json({ error: `Categoria "${category}" não encontrada` });
    }
    
    const fallbackFiles = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.md'))
      .map(filename => ({
        id: filename.replace('.md', ''),
        filename,
        category
      }));
    
    return res.json(fallbackFiles);
  }
  
  res.json(files.map(f => ({
    id: f.id,
    filename: `${f.id}.md`,
    category: f.category
  })));
});

// Rota: buscar arquivos com motor avançado
app.get('/api/search/:category', (req, res) => {
  const { category } = req.params;
  const { q } = req.query;
  
  if (!q || !q.trim()) {
    return res.json([]);
  }

  try {
    const results = searchEngine.search(q, category, {
      limit: 100,
      fuzzy: true,
      snippets: true,
      snippetContext: 200
    });
    
    res.json(results);
  } catch (err) {
    console.error('[Search] Error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Rota: estatísticas do índice (debug)
app.get('/api/index-stats', (req, res) => {
  res.json(indexer.getStats());
});

// Rota: ler conteúdo de um arquivo
app.get('/api/read/:category/:id', (req, res) => {
  const { category, id } = req.params;
  const filePath = path.join(CONTENT_DIR, category, `${id}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Arquivo "${id}.md" não encontrado` });
  }

  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ id, category, content, filename: `${id}.md` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: salvar conteúdo em um arquivo
app.post('/api/save/:category/:id', (req, res) => {
  const { category, id } = req.params;
  const { content } = req.body;
  const filePath = path.join(CONTENT_DIR, category, `${id}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Arquivo "${id}.md" não encontrado` });
  }

  try {
    fs.writeFileSync(filePath, content, 'utf-8');
    // Index will be updated automatically by watcher
    res.json({ success: true, message: 'Arquivo salvo com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: deletar um arquivo
app.delete('/api/delete/:category/:id', (req, res) => {
  const { category, id } = req.params;
  const filePath = path.join(CONTENT_DIR, category, `${id}.md`);

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: `Arquivo "${id}.md" não encontrado` });
  }

  try {
    fs.unlinkSync(filePath);
    // Index will be updated automatically by watcher
    res.json({ success: true, message: 'Arquivo deletado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: listar todas as categorias disponíveis
app.get('/api/categories', (req, res) => {
  try {
    if (!fs.existsSync(CONTENT_DIR)) {
      return res.status(404).json({ error: 'Diretório de conteúdo não encontrado' });
    }

    const categories = fs.readdirSync(CONTENT_DIR)
      .filter(item => fs.statSync(path.join(CONTENT_DIR, item)).isDirectory());

    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: buscar todos os arquivos em todas as categorias (para link modal)
app.get('/api/search-all', (req, res) => {
  try {
    const files = indexer.getFilesByCategory('*'); // All files
    const allFiles = [];
    
    // Group by category
    const byCategory = {};
    for (const file of Object.values(indexer.index.files)) {
      if (!byCategory[file.category]) byCategory[file.category] = [];
      byCategory[file.category].push(file);
    }
    
    for (const [category, catFiles] of Object.entries(byCategory)) {
      for (const file of catFiles) {
        allFiles.push({
          id: file.id,
          filename: `${file.id}.md`,
          category: file.category,
          snippet: ''
        });
      }
    }

    res.json(allFiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: buscar todos os arquivos com conteúdo completo (para link modal)
app.get('/api/search-all-full', (req, res) => {
  try {
    const allFiles = [];
    
    for (const [fileKey, file] of Object.entries(indexer.index.files)) {
      const titles = [];
      const titleRegex = /^#{1,6}\s+(.+)$/gm;
      let match;
      while ((match = titleRegex.exec(file.content)) !== null) {
        titles.push(match[1].trim().toLowerCase());
      }
      
      allFiles.push({
        id: file.id,
        filename: `${file.id}.md`,
        category: file.category,
        titles,
        content: file.content
      });
    }

    res.json(allFiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: servir CSS do projeto principal
app.get('/global.css', (req, res) => {
  try {
    if (fs.existsSync(GLOBAL_CSS_PATH)) {
      const css = fs.readFileSync(GLOBAL_CSS_PATH, 'utf-8');
      res.type('text/css').send(css);
    } else {
      res.status(404).send('CSS não encontrado');
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/variables.css', (req, res) => {
  try {
    if (fs.existsSync(VARIABLES_CSS_PATH)) {
      const css = fs.readFileSync(VARIABLES_CSS_PATH, 'utf-8');
      res.type('text/css').send(css);
    } else {
      res.status(404).send('CSS não encontrado');
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: exportar progresso (aprovações)
app.get('/api/export-progress', (req, res) => {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      const data = JSON.parse(fs.readFileSync(PROGRESS_FILE, 'utf-8'));
      res.json(data);
    } else {
      res.json({ status: {}, lastCategory: '' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: importar progresso (aprovações)
app.post('/api/import-progress', (req, res) => {
  const { status, lastCategory } = req.body;
  try {
    fs.writeFileSync(PROGRESS_FILE, JSON.stringify({ status, lastCategory }, null, 2), 'utf-8');
    res.json({ success: true, message: 'Progresso importado com sucesso' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[Server] Shutting down...');
  indexer.stopWatcher();
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  Ferramenta de Revisão de Traduções`);
  console.log(`  Acesse: http://localhost:${PORT}`);
  console.log(`  Pressione Ctrl+C para parar`);
  console.log(`========================================\n`);
});
