const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

app.use(express.json({ limit: '10mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const CONTENT_DIR = path.join(__dirname, '..', 'src', 'content');
const PROGRESS_FILE = path.join(__dirname, 'review-progress.json');

// Rota: listar todos os arquivos de uma categoria
app.get('/api/list/:category', (req, res) => {
  const category = req.params.category;
  const categoryDir = path.join(CONTENT_DIR, category);

  if (!fs.existsSync(categoryDir)) {
    return res.status(404).json({ error: `Categoria "${category}" não encontrada` });
  }

  try {
    const files = fs.readdirSync(categoryDir)
      .filter(f => f.endsWith('.md'))
      .map(filename => {
        const id = filename.replace('.md', '');
        return { id, filename, category };
      });

    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

// Rota: buscar todos os arquivos em todas as categorias (com snippets para busca)
app.get('/api/search-all', (req, res) => {
  try {
    if (!fs.existsSync(CONTENT_DIR)) {
      return res.status(404).json({ error: 'Diretório de conteúdo não encontrado' });
    }

    const allFiles = [];
    const categories = fs.readdirSync(CONTENT_DIR)
      .filter(item => fs.statSync(path.join(CONTENT_DIR, item)).isDirectory());

    for (const category of categories) {
      const categoryDir = path.join(CONTENT_DIR, category);
      const files = fs.readdirSync(categoryDir)
        .filter(f => f.endsWith('.md'))
        .map(filename => {
          const id = filename.replace('.md', '');
          
          // Ler conteúdo para extrair pontos-chave (primeiros títulos)
          let snippet = '';
          try {
            const content = fs.readFileSync(path.join(categoryDir, filename), 'utf-8');
            const lines = content.split('\n').filter(l => l.trim());
            // Pegar primeiros pontos-chave: títulos (#) e linhas em negrito (**)
            const keyPoints = [];
            for (const line of lines.slice(0, 30)) {
              if (line.startsWith('#')) {
                keyPoints.push(line.replace(/^#+\s*/, '').toLowerCase());
              } else if (line.startsWith('**') && line.includes('**')) {
                const match = line.match(/\*\*(.+?)\*\*/);
                if (match) keyPoints.push(match[1].toLowerCase());
              }
              if (keyPoints.length >= 5) break;
            }
            snippet = keyPoints.join(' ');
          } catch (e) {
            // ignore
          }
          
          return { id, filename, category, snippet };
        });
      allFiles.push(...files);
    }

    res.json(allFiles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Rota: buscar todos os arquivos com conteúdo completo e títulos para busca de links
app.get('/api/search-all-full', (req, res) => {
  try {
    if (!fs.existsSync(CONTENT_DIR)) {
      return res.status(404).json({ error: 'Diretório de conteúdo não encontrado' });
    }

    const allFiles = [];
    const categories = fs.readdirSync(CONTENT_DIR)
      .filter(item => fs.statSync(path.join(CONTENT_DIR, item)).isDirectory());

    for (const category of categories) {
      const categoryDir = path.join(CONTENT_DIR, category);
      const files = fs.readdirSync(categoryDir)
        .filter(f => f.endsWith('.md'))
        .map(filename => {
          const id = filename.replace('.md', '');
          
          let titles = [];
          let content = '';
          
          try {
            const rawContent = fs.readFileSync(path.join(categoryDir, filename), 'utf-8');
            content = rawContent.toLowerCase();
            
            // Extrair todos os títulos (# hasta ######)
            const titleRegex = /^#{1,6}\s+(.+)$/gm;
            let match;
            while ((match = titleRegex.exec(rawContent)) !== null) {
              titles.push(match[1].trim().toLowerCase());
            }
          } catch (e) {
            // ignore
          }
          
          return { id, filename, category, titles, content };
        });
      allFiles.push(...files);
    }

    res.json(allFiles);
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

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n========================================`);
  console.log(`  Ferramenta de Revisão de Traduções`);
  console.log(`  Acesse: http://localhost:${PORT} ou http://<IP_TAILS>:${PORT}`);
  console.log(`  Pressione Ctrl+C para parar`);
  console.log(`========================================\n`);
});
