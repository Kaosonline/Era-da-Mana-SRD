/**
 * PrecisionIndexer - Indexador otimizado com separação por campos
 * Separa: fileName, markdownTitle, content, metadata
 */

const fs = require('fs');
const path = require('path');
const RSLPStemmer = require('./rslpStemmer');

class PrecisionIndexer {
  constructor(contentDir) {
    this.contentDir = contentDir;
    this.stemmer = new RSLPStemmer();
    
    this.index = {
      files: {},
      terms: {
        fileName: {},
        markdownTitle: {},
        content: {},
        metadata: {}
      }
    };
  }

  /**
   * Normaliza texto: lowercase + remove acentos
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Tokeniza texto em palavras
   */
  tokenize(text) {
    return this.normalizeText(text)
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 1);
  }

  /**
   * Extrai o título do markdown (primeiro heading ###, ##, #)
   */
  extractMarkdownTitle(content) {
    const match = content.match(/^#{1,6}\s+(.+)$/m);
    return match ? match[1].trim() : null;
  }

  /**
   * Extrai metadados baseados na categoria
   */
  extractMetadata(category, content) {
    const metadata = {};
    const lines = content.split('\n');

    if (category === 'magias') {
      for (const line of lines) {
        const schoolMatch = line.match(/\*\*Escola\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (schoolMatch) metadata.school = schoolMatch[1].trim();
        
        const levelMatch = line.match(/\*\*Nível\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (levelMatch) metadata.level = levelMatch[1].trim();
        
        const timeMatch = line.match(/\*\*Tempo de Conjuração\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (timeMatch) metadata.castingTime = timeMatch[1].trim();
        
        const durationMatch = line.match(/\*\*Duração\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (durationMatch) metadata.duration = durationMatch[1].trim();
      }
    } else if (category === 'talentos') {
      for (const line of lines) {
        const typeMatch = line.match(/\*\*Tipo do talento\*\*\s*:\s*(.+)$/i);
        if (typeMatch) metadata.type = typeMatch[1].trim();
        
        const prereqMatch = line.match(/\*\*Pré-requisitos\*\*\s*[:.]?\s*(.+)$/i);
        if (prereqMatch) metadata.prerequisites = prereqMatch[1].trim();
      }
    } else if (category === 'equipamentos') {
      for (const line of lines) {
        const costMatch = line.match(/\*\*Custo\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (costMatch) metadata.cost = costMatch[1].trim();
        
        const damageMatch = line.match(/\*\*Dano\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (damageMatch) metadata.damage = damageMatch[1].trim();
        
        const typeMatch = line.match(/\*\*Tipo\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (typeMatch) metadata.type = typeMatch[1].trim();
      }
    }

    return metadata;
  }

  /**
   * Indexa um único arquivo
   */
  indexFile(category, filename, content) {
    const id = filename.replace('.md', '');
    const fileKey = `${category}/${id}`;
    const normalizedContent = this.normalizeText(content);

    // Remove entradas antigas
    this.removeFile(category, id);

    // Extrai campos
    const markdownTitle = this.extractMarkdownTitle(content);
    const metadata = this.extractMetadata(category, content);

    // Cria entrada do arquivo
    const fileEntry = {
      id,
      category,
      filename,
      markdownTitle,
      content: normalizedContent,
      rawContent: content,
      metadata,
      terms: []
    };

    // Indexa fileName (ID)
    this.indexField(fileKey, fileEntry, 'fileName', [id.replace(/-/g, ' ')]);

    // Indexa markdownTitle
    if (markdownTitle) {
      const titleTokens = this.tokenize(markdownTitle);
      this.indexField(fileKey, fileEntry, 'markdownTitle', titleTokens);
    }

    // Indexa content
    const contentTokens = this.tokenize(content);
    this.indexField(fileKey, fileEntry, 'content', contentTokens);

    // Indexa metadata
    const metadataTokens = this.flattenMetadata(metadata);
    this.indexField(fileKey, fileEntry, 'metadata', metadataTokens);

    // Armazena o arquivo
    this.index.files[fileKey] = fileEntry;
  }

  /**
   * Converte metadados em array de tokens
   */
  flattenMetadata(metadata) {
    const tokens = [];
    for (const [key, value] of Object.entries(metadata)) {
      if (value) {
        tokens.push(this.normalizeText(value));
        tokens.push(...this.tokenize(value));
      }
    }
    return tokens;
  }

  /**
   * Indexa um campo específico
   */
  indexField(fileKey, fileEntry, field, tokens) {
    for (const token of tokens) {
      const stemmed = this.stemmer.stem(token);
      
      // Indexa token original
      this.addTerm(fileKey, fileEntry, field, token);
      // Indexa stem
      if (stemmed !== token) {
        this.addTerm(fileKey, fileEntry, field, stemmed);
      }
    }
  }

  /**
   * Adiciona termo ao índice invertido
   */
  addTerm(fileKey, fileEntry, field, term) {
    if (!this.index.terms[field]) {
      this.index.terms[field] = {};
    }
    
    if (!this.index.terms[field][term]) {
      this.index.terms[field][term] = [];
    }
    
    // Evita duplicatas
    const exists = this.index.terms[field][term].some(
      e => e.fileKey === fileKey
    );
    
    if (!exists) {
      this.index.terms[field][term].push({ fileKey });
      if (!fileEntry.terms.includes(term)) {
        fileEntry.terms.push(term);
      }
    }
  }

  /**
   * Remove arquivo do índice
   */
  removeFile(category, id) {
    const fileKey = `${category}/${id}`;
    const fileEntry = this.index.files[fileKey];
    if (!fileEntry) return;

    for (const field of Object.keys(this.index.terms)) {
      for (const term of fileEntry.terms || []) {
        if (this.index.terms[field][term]) {
          this.index.terms[field][term] = this.index.terms[field][term].filter(
            e => e.fileKey !== fileKey
          );
          // Remove termos vazios
          if (this.index.terms[field][term].length === 0) {
            delete this.index.terms[field][term];
          }
        }
      }
    }

    delete this.index.files[fileKey];
  }

  /**
   * Constrói o índice completo
   */
  async buildIndex() {
    console.log('[PrecisionIndexer] Building index...');
    this.index = {
      files: {},
      terms: { fileName: {}, markdownTitle: {}, content: {}, metadata: {} }
    };

    if (!fs.existsSync(this.contentDir)) {
      console.error('[PrecisionIndexer] Content directory not found:', this.contentDir);
      return;
    }

    const categories = fs.readdirSync(this.contentDir)
      .filter(item => {
        const itemPath = path.join(this.contentDir, item);
        return fs.statSync(itemPath).isDirectory();
      });

    let totalFiles = 0;

    for (const category of categories) {
      const categoryDir = path.join(this.contentDir, category);
      const mdFiles = this.getAllMdFiles(categoryDir);

      for (const filePath of mdFiles) {
        const filename = path.basename(filePath);
        const content = fs.readFileSync(filePath, 'utf-8');
        this.indexFile(category, filename, content);
        totalFiles++;
      }
    }

    console.log(`[PrecisionIndexer] Built: ${totalFiles} files`);
    return this.index;
  }

  /**
   * Lista todos os arquivos .md recursivamente
   */
  getAllMdFiles(dir) {
    const files = [];
    if (!fs.existsSync(dir)) return files;
    
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        files.push(...this.getAllMdFiles(fullPath));
      } else if (item.endsWith('.md')) {
        files.push(fullPath);
      }
    }
    return files;
  }

  /**
   * Estatísticas do índice
   */
  getStats() {
    const categories = new Set();
    for (const file of Object.values(this.index.files)) {
      categories.add(file.category);
    }
    return {
      totalFiles: Object.keys(this.index.files).length,
      totalTerms: Object.values(this.index.terms).reduce((sum, field) => 
        sum + Object.keys(field).length, 0),
      categories: Array.from(categories).sort()
    };
  }

  /**
   * Busca arquivo por chave
   */
  getFile(fileKey) {
    return this.index.files[fileKey] || null;
  }
}

module.exports = PrecisionIndexer;