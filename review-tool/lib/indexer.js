/**
 * Indexer - Builds and maintains inverted index for search
 * Uses chokidar for file watching and automatic re-indexing
 */

const fs = require('fs');
const path = require('path');
const RSLPStemmer = require('./rslpStemmer');

class Indexer {
  constructor(contentDir) {
    this.contentDir = contentDir;
    this.stemmer = new RSLPStemmer();
    
    // Inverted index: term -> [{ id, category, field, positions, metadata }]
    this.index = {
      terms: {},
      files: {}
    };
    
    this.watcher = null;
  }
  
  /**
   * Recursively get all .md files in a directory
   */
  getAllMdFiles(dir) {
    const files = [];
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
   * Build complete index from all files
   */
  async buildIndex() {
    console.log('[Indexer] Building index...');
    this.index = { terms: {}, files: {} };
    
    if (!fs.existsSync(this.contentDir)) {
      console.error('[Indexer] Content directory not found:', this.contentDir);
      return;
    }
    
    const categories = fs.readdirSync(this.contentDir)
      .filter(item => fs.statSync(path.join(this.contentDir, item)).isDirectory());
    
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
    
    console.log(`[Indexer] Index built: ${totalFiles} files, ${Object.keys(this.index.terms).length} terms`);
  }
  
  /**
   * Index a single file
   */
  indexFile(category, filename, content) {
    const id = filename.replace('.md', '');
    const fileKey = `${category}/${id}`;
    
    // Remove old index entries if file was re-indexed
    if (this.index.files[fileKey]) {
      this.removeFileFromIndex(fileKey);
    }
    
    // Extract metadata based on category
    const metadata = this.extractMetadata(category, content);
    
    // Tokenize content
    const tokens = this.tokenize(content);
    
    // Build term frequency map
    const termPositions = {};
    
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const stemmed = this.stemmer.stem(token);
      
      if (!termPositions[stemmed]) {
        termPositions[stemmed] = [];
      }
      termPositions[stemmed].push(i);
    }
    
    // Add to inverted index
    const fileEntry = {
      id,
      category,
      metadata,
      content: content.toLowerCase(),
      terms: []
    };
    
    for (const [term, positions] of Object.entries(termPositions)) {
      if (!this.index.terms[term]) {
        this.index.terms[term] = [];
      }
      
      this.index.terms[term].push({
        id,
        category,
        field: 'content',
        positions
      });
      
      fileEntry.terms.push(term);
    }
    
    // Also index ID parts (for "power-attack" → "power", "attack")
    const idParts = id.split(/[-_]/).filter(p => p.length > 0);
    for (const part of idParts) {
      // Add both stemmed and raw term
      const stemmed = this.stemmer.stem(part);
      const rawLower = part.toLowerCase();
      
      for (const term of [stemmed, rawLower]) {
        if (!this.index.terms[term]) {
          this.index.terms[term] = [];
        }
        this.index.terms[term].push({
          id,
          category,
          field: 'id',
          positions: [0]
        });
        if (!fileEntry.terms.includes(term)) {
          fileEntry.terms.push(term);
        }
      }
    }
    
    // Also index the full ID with hyphens preserved (for "power-attack")
    const idLower = id.toLowerCase();
    if (!this.index.terms[idLower]) {
      this.index.terms[idLower] = [];
    }
    this.index.terms[idLower].push({
      id,
      category,
      field: 'id_full',
      positions: [0]
    });
    if (!fileEntry.terms.includes(idLower)) {
      fileEntry.terms.push(idLower);
    }
    
    // Also index title if exists
    if (metadata.title) {
      const titleTokens = metadata.title.toLowerCase()
        .replace(/[^\w\sà-ú]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
      
      for (const token of titleTokens) {
        const stemmed = this.stemmer.stem(token);
        if (!this.index.terms[stemmed]) {
          this.index.terms[stemmed] = [];
        }
        this.index.terms[stemmed].push({
          id,
          category,
          field: 'title',
          positions: [0]
        });
        if (!fileEntry.terms.includes(stemmed)) {
          fileEntry.terms.push(stemmed);
        }
      }
    }
    
    // Also index prerequisites if exists
    if (metadata.prerequisites) {
      const prereqTokens = metadata.prerequisites.toLowerCase()
        .replace(/[^\w\sà-ú]/g, ' ')
        .split(/\s+/)
        .filter(w => w.length > 0);
      
      for (const token of prereqTokens) {
        const stemmed = this.stemmer.stem(token);
        if (!this.index.terms[stemmed]) {
          this.index.terms[stemmed] = [];
        }
        this.index.terms[stemmed].push({
          id,
          category,
          field: 'prerequisites',
          positions: [0]
        });
        if (!fileEntry.terms.includes(stemmed)) {
          fileEntry.terms.push(stemmed);
        }
      }
    }
    
    this.index.files[fileKey] = fileEntry;
  }
  
  /**
   * Remove file from index
   */
  removeFile(category, filename) {
    const id = filename.replace('.md', '');
    const fileKey = `${category}/${id}`;
    this.removeFileFromIndex(fileKey);
  }
  
  /**
   * Internal: remove file entries from inverted index
   */
  removeFileFromIndex(fileKey) {
    const fileEntry = this.index.files[fileKey];
    if (!fileEntry) return;
    
    // Remove from terms
    for (const term of fileEntry.terms) {
      if (this.index.terms[term]) {
        this.index.terms[term] = this.index.terms[term].filter(
          entry => !(entry.id === fileEntry.id && entry.category === fileEntry.category)
        );
        
        // Clean up empty terms
        if (this.index.terms[term].length === 0) {
          delete this.index.terms[term];
        }
      }
    }
    
    // Remove file entry
    delete this.index.files[fileKey];
  }
  
  /**
   * Extract metadata from content based on category
   */
  extractMetadata(category, content) {
    const metadata = {};
    const lines = content.split('\n');
    
    // Extract title (first heading ###)
    const titleMatch = content.match(/^#{1,6}\s+(.+)$/m);
    if (titleMatch) {
      metadata.title = titleMatch[1].trim();
    }
    
    if (category === 'magias') {
      // Extract spell metadata
      for (const line of lines) {
        // Escola
        const schoolMatch = line.match(/\*\*Escola\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (schoolMatch) metadata.school = schoolMatch[1].trim();
        
        // Nível
        const levelMatch = line.match(/\*\*Nível\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (levelMatch) metadata.level = levelMatch[1].trim();
        
        // Tempo de Conjuração
        const castingMatch = line.match(/\*\*Tempo de Conjuração\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (castingMatch) metadata.castingTime = castingMatch[1].trim();
        
        // Componentes
        const compMatch = line.match(/\*\*Componentes\*\*\s*(.+?)(?:;|\*\*|$)/i);
        if (compMatch) metadata.components = compMatch[1].trim();
      }
    } else if (category === 'talentos') {
      // Extract feat metadata
      for (const line of lines) {
        const typeMatch = line.match(/\*\*Tipo do talento\*\*:\s*(.+)$/i);
        if (typeMatch) metadata.type = typeMatch[1].trim();
        
        const prereqMatch = line.match(/\*\*Pré-requisitos\*\*\s*[:.]?\s*(.+)$/i);
        if (prereqMatch) metadata.prerequisites = prereqMatch[1].trim();
      }
    }
    
    return metadata;
  }
  
  /**
   * Tokenize content into words
   */
  tokenize(content) {
    return content
      .toLowerCase()
      .replace(/[^\w\sà-ú]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 0);
  }
  
  /**
   * Start file watcher for automatic re-indexing
   */
  startWatcher() {
    try {
      const chokidar = require('chokidar');
      
      this.watcher = chokidar.watch(this.contentDir, {
        ignored: /(^|[\/\\])\../,
        persistent: true,
        ignoreInitial: true,
        awaitWriteFinish: {
          stabilityThreshold: 300,
          pollInterval: 100
        }
      });
      
      this.watcher
        .on('add', (filePath) => {
          if (!filePath.endsWith('.md')) return;
          const content = fs.readFileSync(filePath, 'utf-8');
          const relativePath = path.relative(this.contentDir, filePath);
          const parts = relativePath.split(path.sep);
          const category = parts[0];
          const filename = parts[1];
          
          console.log(`[Indexer] File added: ${relativePath}`);
          this.indexFile(category, filename, content);
        })
        .on('change', (filePath) => {
          if (!filePath.endsWith('.md')) return;
          const content = fs.readFileSync(filePath, 'utf-8');
          const relativePath = path.relative(this.contentDir, filePath);
          const parts = relativePath.split(path.sep);
          const category = parts[0];
          const filename = parts[1];
          
          console.log(`[Indexer] File changed: ${relativePath}`);
          this.indexFile(category, filename, content);
        })
        .on('unlink', (filePath) => {
          if (!filePath.endsWith('.md')) return;
          const relativePath = path.relative(this.contentDir, filePath);
          const parts = relativePath.split(path.sep);
          const category = parts[0];
          const filename = parts[1];
          
          console.log(`[Indexer] File deleted: ${relativePath}`);
          this.removeFile(category, filename);
        })
        .on('error', (error) => {
          console.error('[Indexer] Watcher error:', error);
        });
      
      console.log('[Indexer] File watcher started');
    } catch (err) {
      console.error('[Indexer] Failed to start watcher:', err.message);
      console.error('[Indexer] Install chokidar: npm install chokidar');
    }
  }
  
  /**
   * Stop file watcher
   */
  stopWatcher() {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
      console.log('[Indexer] File watcher stopped');
    }
  }
  
  /**
   * Get index statistics
   */
  getStats() {
    const categories = new Set();
    for (const file of Object.values(this.index.files)) {
      categories.add(file.category);
    }
    
    return {
      totalFiles: Object.keys(this.index.files).length,
      totalTerms: Object.keys(this.index.terms).length,
      categories: Array.from(categories).sort()
    };
  }
  
  /**
   * Get file entry by key
   */
  getFile(fileKey) {
    return this.index.files[fileKey] || null;
  }
  
  /**
   * Get all files in category
   */
  getFilesByCategory(category) {
    return Object.values(this.index.files)
      .filter(f => f.category === category);
  }
}

module.exports = Indexer;
