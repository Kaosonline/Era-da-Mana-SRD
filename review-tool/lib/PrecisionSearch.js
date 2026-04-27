/**
 * PrecisionSearch - Motor de busca com filtros de escopo e relevância
 * Escopos: fileName, markdownTitle, content, metadata, all
 */

class PrecisionSearch {
  constructor(indexer) {
    this.indexer = indexer;
    this.levenshtein = new (require('./levenshtein'))();
  }

  /**
   * Busca principal
   * @param {string} query - Query de busca
   * @param {Object} options - Opções de busca
   * @returns {Array} - Resultados ordenados por relevância
   */
  search(query, options = {}) {
    const {
      category = null,
      searchScope = 'all', // fileName | markdownTitle | content | metadata | all
      exactPhrase = false,
      fuzzy = false,
      limit = 50,
      minScore = 1
    } = options;

    if (!query || !query.trim()) return [];

    // Processa query
    const parsed = this.parseQuery(query);
    const searchTerms = parsed.include;
    const excludeTerms = parsed.exclude;

    // Se não tem termos de busca nem frase exata, retorna vazio
    if (searchTerms.length === 0 && !parsed.exactPhrase) return [];

    // Determina campos para buscar
    const fields = this.getFieldsForScope(searchScope);
    if (fields.length === 0) return [];

    // Busca por termos
    const results = this.searchTerms(searchTerms, excludeTerms, fields, category, parsed.exactPhrase, fuzzy);

    // Aplica boost de relevância
    this.applyRelevanceBoost(results, searchTerms);

    // Filtra por score mínimo
    const filtered = results.filter(r => r.score >= minScore);

    // Ordena por relevância
    filtered.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return a.id.localeCompare(b.id);
    });

    return filtered.slice(0, limit);
  }

  /**
   * Processa query e extrai termos
   * Suporta: "frase exata", +termo (OR), -termo (NOT)
   */
  parseQuery(query) {
    const result = {
      exactPhrase: null,
      include: [],
      exclude: []
    };

    const queryLower = query.toLowerCase().trim();

    // Verifica frase exata com aspas
    const exactMatch = queryLower.match(/"([^"]+)"/);
    if (exactMatch) {
      result.exactPhrase = exactMatch[1];
      const remaining = queryLower.replace(/"[^"]+"/g, '').trim();
      const words = remaining.split(/\s+/).filter(w => w.trim());
      
      for (const word of words) {
        if (word.startsWith('-')) {
          result.exclude.push(word.slice(1));
        } else if (!word.startsWith('+')) {
          result.include.push(word);
        }
      }
    } else {
      // Sem aspas: verifica operadores
      const words = queryLower.split(/\s+/).filter(w => w.trim());
      const hasOrOperator = words.some(w => w.startsWith('+') && w.length > 1);
      const hasExclude = words.some(w => w.startsWith('-') && w.length > 1);

      if (hasOrOperator || hasExclude) {
        // Com operadores: processa cada termo individualmente
        for (const word of words) {
          if (word.startsWith('-')) {
            result.exclude.push(word.slice(1));
          } else if (word.startsWith('+')) {
            result.include.push(word.slice(1));
          } else {
            result.include.push(word);
          }
        }
      } else {
        // Sem operadores e sem aspas: busca por TERMOS INDIVIDUAIS
        // Divide em palavras e adiciona cada uma como termo de busca
        for (const word of words) {
          if (word.startsWith('-')) {
            result.exclude.push(word.slice(1));
          } else {
            result.include.push(word);
          }
        }
        // NÃO define como frase exata se não tiver aspas
      }
    }

    return result;
  }

  /**
   * Retorna campos para o escopo especificado
   */
  getFieldsForScope(searchScope) {
    const scopeMap = {
      fileName: ['fileName'],
      markdownTitle: ['markdownTitle'],
      content: ['content'],
      metadata: ['metadata'],
      all: ['fileName', 'markdownTitle', 'content', 'metadata']
    };
    return scopeMap[searchScope] || scopeMap.all;
  }

  /**
   * Busca por termos nos campos especificados
   */
  searchTerms(searchTerms, excludeTerms, fields, category, exactPhrase, fuzzy) {
    const results = new Map();

    // Se há frase exata, faz busca especial no conteúdo
    // Usa APENAS os campos especificados pelo usuário, não todos
    if (exactPhrase) {
      const exactResults = this.searchExactPhrase(exactPhrase, fields, category);
      for (const result of exactResults) {
        results.set(`${result.category}/${result.id}`, result);
      }
    }

    // Se não há termos para buscar além da frase exata, retorna apenas resultados exatos
    if (searchTerms.length === 0 || exactPhrase) {
      return Array.from(results.values());
    }

    // Busca por termos normais
    for (const term of searchTerms) {
      // Normaliza termo
      const normalizedTerm = this.normalizeText(term);

      for (const field of fields) {
        const fieldTerms = this.indexer.index.terms[field];
        if (!fieldTerms) continue;

        // Busca direta
        const entries = this.findEntries(fieldTerms, normalizedTerm, exactPhrase);
        
        for (const entry of entries) {
          const fileEntry = this.indexer.index.files[entry.fileKey];
          if (!fileEntry) continue;

          // Filtro de categoria
          if (category && fileEntry.category !== category) continue;

          // Verifica exclusões
          const isExcluded = this.checkExclusions(fileEntry, excludeTerms, fields);
          if (isExcluded) continue;

          // Não processa se já tem resultado exato
          const key = entry.fileKey;
          if (results.has(key) && exactPhrase) continue;

          // Calcula score
          const score = this.calculateScore(fileEntry, field, normalizedTerm, term);

          // Adiciona/atualiza resultado
          if (!results.has(key)) {
            results.set(key, {
              id: fileEntry.id,
              category: fileEntry.category,
              filename: fileEntry.filename,
              markdownTitle: fileEntry.markdownTitle,
              rawContent: fileEntry.rawContent,
              content: fileEntry.content,
              metadata: fileEntry.metadata,
              score: 0,
              matchFields: new Set(),
              matches: []
            });
          }

          const result = results.get(key);
          result.score += score;
          result.matchFields.add(field);
          result.matches.push({ field, term, score });
        }

        // Fuzzy search se habilitado
        if (fuzzy && !exactPhrase) {
          const fuzzyEntries = this.fuzzyFind(fieldTerms, normalizedTerm);
          for (const entry of fuzzyEntries) {
            const fileEntry = this.indexer.index.files[entry.fileKey];
            if (!fileEntry) continue;
            if (category && fileEntry.category !== category) continue;
            
            const isExcluded = this.checkExclusions(fileEntry, excludeTerms, fields);
            if (isExcluded) continue;

            const fuzzyScore = entry.score * 0.5; // Reduz score para matches fuzzy
            
            const key = entry.fileKey;
            if (!results.has(key)) {
              results.set(key, {
                id: fileEntry.id,
                category: fileEntry.category,
                filename: fileEntry.filename,
                markdownTitle: fileEntry.markdownTitle,
                rawContent: fileEntry.rawContent,
                content: fileEntry.content,
                metadata: fileEntry.metadata,
                score: 0,
                matchFields: new Set(),
                matches: [],
                fuzzy: true
              });
            }

            const result = results.get(key);
            result.score += fuzzyScore;
            result.matchFields.add(field);
          }
        }
      }
    }

    // Converte Set para Array
    for (const result of results.values()) {
      result.matchFields = Array.from(result.matchFields);
    }

    return Array.from(results.values());
  }

  /**
   * Busca frase exata no conteúdo
   */
  searchExactPhrase(phrase, fields, category) {
    const results = [];
    const normalizedPhrase = this.normalizeText(phrase);

    for (const [fileKey, fileEntry] of Object.entries(this.indexer.index.files)) {
      // Filtro de categoria
      if (category && fileEntry.category !== category) continue;

      // Busca em todos os campos permitidos (texto original normalizado)
      let found = false;
      for (const field of fields) {
        let text = '';
        
        switch (field) {
          case 'fileName':
            text = fileEntry.id;
            break;
          case 'markdownTitle':
            text = fileEntry.markdownTitle || '';
            break;
          case 'content':
            text = fileEntry.content || '';
            break;
          case 'metadata':
            text = this.flattenMetadataText(fileEntry.metadata);
            break;
        }
        
        if (text) {
          const normalizedText = this.normalizeText(text);
          if (normalizedText.includes(normalizedPhrase)) {
            found = true;
            break;
          }
        }
      }

      if (found) {
        results.push({
          id: fileEntry.id,
          category: fileEntry.category,
          filename: fileEntry.filename,
          markdownTitle: fileEntry.markdownTitle,
          rawContent: fileEntry.rawContent,
          content: fileEntry.content,
          metadata: fileEntry.metadata,
          score: 100,
          matchFields: ['exactPhrase'],
          matches: [],
          exactMatch: true
        });
      }
    }

    return results;
  }

  /**
   * Normaliza texto
   */
  normalizeText(text) {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  }

  /**
   * Stemmiza termo
   */
  stemTerm(term) {
    return this.indexer.stemmer.stem(this.normalizeText(term));
  }

  /**
   * Encontra entradas no índice para um termo
   */
  findEntries(fieldTerms, normalizedTerm, exactPhrase) {
    const entries = [];
    const stemmedTerm = this.stemTerm(normalizedTerm);

    // Para fileName, faz busca especial
    if (fieldTerms === this.indexer.index.terms.fileName) {
      // Procura no ID completo primeiro
      const allEntries = Object.values(fieldTerms).flat();
      for (const entry of allEntries) {
        const fileEntry = this.indexer.index.files[entry.fileKey];
        if (!fileEntry) continue;
        
        const idNorm = fileEntry.id.toLowerCase().replace(/-/g, ' ');
        if (idNorm.includes(normalizedTerm) || normalizedTerm.replace(/-/g, ' ').includes(idNorm)) {
          entries.push(entry);
        }
      }
      return entries;
    }

    // Procura termo exato e stem
    const searchTerms = exactPhrase ? [normalizedTerm] : [normalizedTerm, stemmedTerm];

    for (const term of searchTerms) {
      if (fieldTerms[term]) {
        for (const entry of fieldTerms[term]) {
          entries.push(entry);
        }
      }
    }

    // Se não achou e não é frase exata, tenta matches parciais
    if (entries.length === 0 && !exactPhrase) {
      for (const [term, termEntries] of Object.entries(fieldTerms)) {
        if (term.includes(normalizedTerm) || normalizedTerm.includes(term)) {
          for (const entry of termEntries) {
            entries.push(entry);
          }
        }
      }
    }

    return entries;
  }

  /**
   * Busca fuzzy
   */
  fuzzyFind(fieldTerms, normalizedTerm) {
    const results = [];
    const stemmedTerm = this.stemTerm(normalizedTerm);
    const candidates = Object.keys(fieldTerms);

    const matches = this.levenshtein.fuzzyMatch(stemmedTerm, candidates, 2);
    
    for (const match of matches) {
      const entries = fieldTerms[match.word];
      if (entries) {
        for (const entry of entries) {
          results.push({
            fileKey: entry.fileKey,
            score: match.score
          });
        }
      }
    }

    return results;
  }

  /**
   * Verifica se arquivo deve ser excluído
   * Usa apenas os campos que estão sendo pesquisados, não todos
   */
  checkExclusions(fileEntry, excludeTerms, searchFields) {
    if (excludeTerms.length === 0 || !searchFields || searchFields.length === 0) return false;

    // Usa APENAS os campos que estão sendo pesquisados
    const fieldsToCheck = searchFields;

    for (const term of excludeTerms) {
      const normalized = this.normalizeText(term);
      const stemmed = this.stemTerm(normalized);

      for (const field of fieldsToCheck) {
        const fieldTerms = this.indexer.index.terms[field];
        if (!fieldTerms) continue;

        if (fieldTerms[normalized] || fieldTerms[stemmed]) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Calcula score baseado no campo
   */
  calculateScore(fileEntry, field, normalizedTerm, originalTerm) {
    let baseScore = 10;

    // Boost por campo
    const fieldBoost = {
      fileName: 30,
      markdownTitle: 50,
      metadata: 20,
      content: 5
    };

    baseScore += fieldBoost[field] || 0;

    // Boost se termo match exacto no campo
    const searchText = this.getFieldText(fileEntry, field);
    if (searchText && searchText.includes(normalizedTerm)) {
      baseScore += 20;
    }

    // Boost se match no ID (fileName)
    if (field === 'fileName') {
      if (fileEntry.id.includes(originalTerm.replace(/\s+/g, '-'))) {
        baseScore += 20;
      }
    }

    // Boost se match no título
    if (field === 'markdownTitle' && fileEntry.markdownTitle) {
      const titleNorm = this.normalizeText(fileEntry.markdownTitle);
      if (titleNorm.includes(normalizedTerm)) {
        baseScore += 30;
      }
    }

    return baseScore;
  }

  /**
   * Retorna texto de um campo
   */
  getFieldText(fileEntry, field) {
    switch (field) {
      case 'fileName': return fileEntry.id;
      case 'markdownTitle': return fileEntry.markdownTitle || '';
      case 'content': return fileEntry.content || '';
      case 'metadata': return this.flattenMetadataText(fileEntry.metadata);
      default: return '';
    }
  }

  /**
   * Converte metadata para texto
   */
  flattenMetadataText(metadata) {
    if (!metadata) return '';
    return Object.values(metadata).join(' ').toLowerCase();
  }

  /**
   * Aplica boost de relevância adicional
   */
  applyRelevanceBoost(results, searchTerms) {
    for (const result of results) {
      // Boost para arquivos com mais campos correspondentes
      result.score += result.matchFields.length * 5;

      // Boost para matches no título
      if (result.matchFields.includes('markdownTitle')) {
        result.score += 20;
      }

      // Boost para match exato no ID
      if (result.matchFields.includes('fileName')) {
        const idNorm = result.id.toLowerCase();
        const allTerms = searchTerms.join(' ').toLowerCase();
        if (idNorm.includes(allTerms.replace(/\s+/g, '-'))) {
          result.score += 30;
        }
      }
    }
  }

  /**
   * Gera snippet para resultado
   */
  generateSnippet(result, query, maxLength = 200) {
    const terms = this.parseQuery(query).include.map(t => this.normalizeText(t));
    if (terms.length === 0) {
      return result.markdownTitle || result.id;
    }

    const content = result.rawContent || result.content;
    if (!content) return result.markdownTitle || result.id;

    // Quebra em parágrafos
    const paragraphs = content.split(/\n\n+/);
    
    let bestParagraph = '';
    let maxMatches = 0;

    for (const paragraph of paragraphs) {
      let matchCount = 0;
      for (const term of terms) {
        const regex = new RegExp(term, 'gi');
        const matches = paragraph.match(regex);
        if (matches) matchCount += matches.length;
      }

      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestParagraph = paragraph;
      }
    }

    // Se não achou parágrafo, pega primeira ocorrência
    if (!bestParagraph) {
      const firstTerm = terms[0];
      const idx = content.indexOf(firstTerm);
      if (idx !== -1) {
        const start = Math.max(0, idx - maxLength / 2);
        const end = Math.min(content.length, idx + maxLength / 2);
        bestParagraph = content.slice(start, end);
      }
    }

    // Limita tamanho
    if (bestParagraph.length > maxLength) {
      const firstIdx = terms.reduce((min, term) => {
        const idx = bestParagraph.indexOf(term);
        return idx !== -1 && (min === -1 || idx < min) ? idx : min;
      }, -1);

      const start = Math.max(0, firstIdx - maxLength / 3);
      const end = Math.min(bestParagraph.length, firstIdx + maxLength * 2 / 3);
      bestParagraph = bestParagraph.slice(start, end);
    }

    // Adiciona reticências
    let snippet = bestParagraph.trim();
    const contentStart = content.indexOf(snippet);
    if (contentStart > 20) snippet = '...' + snippet;
    if (contentStart + snippet.length < content.length - 20) {
      snippet = snippet + '...';
    }

    return snippet;
  }
}

module.exports = PrecisionSearch;