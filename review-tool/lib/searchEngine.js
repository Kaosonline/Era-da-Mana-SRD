/**
 * SearchEngine - Advanced search with stemming, fuzzy matching, and snippets
 */

const Levenshtein = require('./levenshtein');

class SearchEngine {
  constructor(indexer) {
    this.indexer = indexer;
    this.levenshtein = new Levenshtein();
  }
  
  /**
   * Main search function
   * @param {string} query - Search query
   * @param {string} category - Category to search in
   * @param {Object} options - Search options
   * @returns {Array} - Search results
   */
  search(query, category, options = {}) {
    const {
      limit = 100,
      fuzzy = true,
      snippets = true,
      snippetContext = 200
    } = options;
    
    if (!query || !query.trim()) return [];
    
    // Parse query
    const parsed = this.parseQuery(query);
    
    // Determine search terms
    let searchTerms = [...parsed.include];
    
    // If exact phrase exists, also add its individual words as search terms
    if (parsed.exactPhrase) {
      const phraseWords = parsed.exactPhrase.split(/\s+/).filter(w => w.trim());
      for (const word of phraseWords) {
        if (!searchTerms.includes(word)) {
          searchTerms.push(word);
        }
      }
    }
    
    // If still no terms, nothing to search
    if (searchTerms.length === 0) return [];
    
    // Stem search terms
    const stemmedTerms = searchTerms.map(term => 
      this.indexer.stemmer.stem(term)
    );
    
    const stemmedExclude = parsed.exclude.map(term =>
      this.indexer.stemmer.stem(term)
    );
    
    // Also search by direct ID match (e.g., "power-attack" or "power-attack.md")
    const idResults = this.searchById(searchTerms, category);
    
    // Exact search
    let results = this.exactSearch(stemmedTerms, stemmedExclude, category);
    
    // Merge ID results
    results = this.mergeIdResults(results, idResults);
    
    // Fuzzy search if few results
    if (fuzzy && results.length < 5 && searchTerms.length > 0) {
      const fuzzyResults = this.fuzzySearch(searchTerms, stemmedExclude, category);
      results = this.mergeResults(results, fuzzyResults);
    }
    
    // Apply exact phrase filter if present
    if (parsed.exactPhrase) {
      const phraseLower = parsed.exactPhrase.toLowerCase();
      results = results.filter(r => r.content.includes(phraseLower));
    }
    
    // Extract snippets
    if (snippets) {
      const snippetTerms = searchTerms;
      results = results.map(r => ({
        ...r,
        snippet: this.extractBestSnippet(r, snippetTerms, snippetContext)
      }));
    }
    
    // Sort by relevance (exact matches first, then by relevance score, then alphabetically)
    results.sort((a, b) => {
      // Exact matches always first
      if (a.isExact !== b.isExact) {
        return a.isExact ? -1 : 1;
      }
      // Then by relevance score
      const relDiff = (b.relevance || 0) - (a.relevance || 0);
      if (relDiff !== 0) return relDiff;
      // Finally alphabetically
      return a.id.localeCompare(b.id);
    });
    
    // Limit results
    return results.slice(0, limit);
  }
  
  /**
   * Parse search query
   * Default: exact phrase matching
   * With quotes: "exact phrase" (same as default)
   * With +: word1 +word2 (OR search - any word)
   * With -: word1 -word2 (exclude word2)
   */
  parseQuery(query) {
    const result = {
      exactPhrase: null,
      include: [],
      exclude: []
    };
    
    const queryLower = query.toLowerCase().trim();
    
    // Check for explicit exact phrase with quotes
    const exactMatch = queryLower.match(/"([^"]+)"/);
    if (exactMatch) {
      result.exactPhrase = exactMatch[1];
      // Remove quoted part from query to process exclusions
      let remaining = queryLower.replace(/"[^"]+"/g, '').trim();
      const words = remaining.split(/\s+/).filter(w => w.trim());
      for (const word of words) {
        if (word.startsWith('-')) {
          result.exclude.push(word.slice(1));
        } else if (!word.startsWith('+')) {
          result.include.push(word);
        }
      }
    } else {
      // No quotes: check for OR search (+) or default to exact phrase
      const words = queryLower.split(/\s+/).filter(w => w.trim());
      const hasOrOperator = words.some(w => w.startsWith('+') && w.length > 1);
      
      if (hasOrOperator) {
        // OR search: collect all words
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
        // Default: treat entire query as exact phrase
        const includeWords = [];
        for (const word of words) {
          if (word.startsWith('-')) {
            result.exclude.push(word.slice(1));
          } else {
            includeWords.push(word);
          }
        }
        if (includeWords.length > 0) {
          result.exactPhrase = includeWords.join(' ');
        }
      }
    }
    
    return result;
  }
  
  /**
   * Exact search using inverted index
   */
  exactSearch(terms, excludeTerms, category) {
    if (terms.length === 0) return [];
    
    const results = new Map();
    
    for (const term of terms) {
      const entries = this.indexer.index.terms[term];
      if (!entries) continue;
      
      for (const entry of entries) {
        // Filter by category
        if (category && entry.category !== category) continue;
        
        const fileKey = `${entry.category}/${entry.id}`;
        const fileEntry = this.indexer.index.files[fileKey];
        if (!fileEntry) continue;
        
        // Check exclusions
        const excluded = excludeTerms.some(excl => {
          const exclEntries = this.indexer.index.terms[excl];
          if (!exclEntries) return false;
          return exclEntries.some(e => 
            e.id === entry.id && e.category === entry.category
          );
        });
        
        if (excluded) continue;
        
        // Calculate relevance score
        let relevance = entry.positions.length;
        
        // Boost if term matches ID
        if (entry.id && entry.id.toLowerCase().includes(term)) {
          relevance += 10;
        }
        
        // Boost if term matches title
        if (fileEntry.metadata && fileEntry.metadata.title) {
          if (fileEntry.metadata.title.toLowerCase().includes(term)) {
            relevance += 5;
          }
        }
        
        // Boost if term matches prerequisites
        if (fileEntry.metadata && fileEntry.metadata.prerequisites) {
          if (fileEntry.metadata.prerequisites.toLowerCase().includes(term)) {
            relevance += 3;
          }
        }
        
        // Add or update result
        if (!results.has(fileKey)) {
          results.set(fileKey, {
            id: entry.id,
            category: entry.category,
            metadata: fileEntry.metadata,
            content: fileEntry.content,
            matchCount: 0,
            relevance: 0
          });
        }
        
        results.get(fileKey).matchCount += entry.positions.length;
        results.get(fileKey).relevance += relevance;
      }
    }
    
    return Array.from(results.values());
  }
  
  /**
   * Fuzzy search using Levenshtein distance
   */
  fuzzySearch(terms, excludeTerms, category) {
    const allTerms = Object.keys(this.indexer.index.terms);
    const fuzzyMatches = new Map();
    
    for (const queryTerm of terms) {
      const stemmedQuery = this.indexer.stemmer.stem(queryTerm);
      
      // Find similar terms in index
      const matches = this.levenshtein.fuzzyMatch(stemmedQuery, allTerms);
      
      for (const match of matches) {
        const entries = this.indexer.index.terms[match.word];
        if (!entries) continue;
        
        for (const entry of entries) {
          if (category && entry.category !== category) continue;
          
          const fileKey = `${entry.category}/${entry.id}`;
          const fileEntry = this.indexer.index.files[fileKey];
          if (!fileEntry) continue;
          
          // Check exclusions
          const excluded = excludeTerms.some(excl => {
            const exclEntries = this.indexer.index.terms[excl];
            if (!exclEntries) return false;
            return exclEntries.some(e => 
              e.id === entry.id && e.category === entry.category
            );
          });
          
          if (excluded) continue;
          
          // Calculate relevance
          let relevance = match.score;
          
          // Boost if fuzzy matches ID
          if (entry.id && entry.id.toLowerCase().includes(queryTerm)) {
            relevance += 10;
          }
          
          // Boost if matches title
          if (fileEntry.metadata && fileEntry.metadata.title) {
            if (fileEntry.metadata.title.toLowerCase().includes(queryTerm)) {
              relevance += 5;
            }
          }
          
          // Boost if matches prerequisites
          if (fileEntry.metadata && fileEntry.metadata.prerequisites) {
            if (fileEntry.metadata.prerequisites.toLowerCase().includes(queryTerm)) {
              relevance += 3;
            }
          }
          
          if (!fuzzyMatches.has(fileKey)) {
            fuzzyMatches.set(fileKey, {
              id: entry.id,
              category: entry.category,
              metadata: fileEntry.metadata,
              content: fileEntry.content,
              matchCount: 0,
              fuzzyScore: 0,
              relevance: 0
            });
          }
          
          const result = fuzzyMatches.get(fileKey);
          result.matchCount += entry.positions.length;
          result.fuzzyScore += match.score;
          result.relevance += relevance;
        }
      }
    }
    
    return Array.from(fuzzyMatches.values());
  }
  
  /**
   * Merge exact and fuzzy results
   */
  mergeResults(exact, fuzzy) {
    const merged = new Map();
    
    for (const result of exact) {
      merged.set(`${result.category}/${result.id}`, {
        ...result,
        isExact: true
      });
    }
    
    for (const result of fuzzy) {
      const key = `${result.category}/${result.id}`;
      if (!merged.has(key)) {
        merged.set(key, {
          ...result,
          isExact: false
        });
      }
    }
    
    return Array.from(merged.values());
  }
  
  /**
   * Extract best snippet (paragraph with most matches)
   */
  extractBestSnippet(fileEntry, terms, contextSize = 200) {
    if (!fileEntry.content) return '';
    
    const content = fileEntry.content;
    const lowerTerms = terms.map(t => t.toLowerCase());
    
    // Split into paragraphs/sections
    const paragraphs = content.split(/\n\n+/);
    
    let bestParagraph = '';
    let maxMatches = 0;
    
    for (const paragraph of paragraphs) {
      let matchCount = 0;
      for (const term of lowerTerms) {
        const regex = new RegExp(term, 'gi');
        const matches = paragraph.match(regex);
        if (matches) matchCount += matches.length;
      }
      
      if (matchCount > maxMatches) {
        maxMatches = matchCount;
        bestParagraph = paragraph;
      }
    }
    
    // If no paragraph found, use first occurrence in content
    if (!bestParagraph) {
      for (const term of lowerTerms) {
        const idx = content.indexOf(term);
        if (idx !== -1) {
          const start = Math.max(0, idx - contextSize / 2);
          const end = Math.min(content.length, idx + term.length + contextSize / 2);
          bestParagraph = content.slice(start, end);
          break;
        }
      }
    }
    
    // Truncate with context
    if (bestParagraph.length > contextSize) {
      // Find first term occurrence
      let firstIdx = bestParagraph.length;
      for (const term of lowerTerms) {
        const idx = bestParagraph.indexOf(term);
        if (idx !== -1 && idx < firstIdx) {
          firstIdx = idx;
        }
      }
      
      const start = Math.max(0, firstIdx - contextSize / 3);
      const end = Math.min(bestParagraph.length, firstIdx + contextSize * 2 / 3);
      
      let snippet = bestParagraph.slice(start, end).trim();
      
      // Add ellipsis
      if (start > 0) snippet = '...' + snippet;
      if (end < bestParagraph.length) snippet = snippet + '...';
      
      return snippet;
    }
    
    return bestParagraph.trim();
  }

  /**
   * Search files by direct ID match (e.g., "power-attack")
   */
  searchById(terms, category) {
    const results = [];
    const normalizedTerms = terms.map(t => t.toLowerCase().replace(/\.md$/, ''));
    
    for (const [fileKey, fileEntry] of Object.entries(this.indexer.index.files)) {
      // Filter by category if specified
      if (category && fileEntry.category !== category) continue;
      
      const idLower = fileEntry.id.toLowerCase();
      
      for (const term of normalizedTerms) {
        // Exact match
        if (idLower === term) {
          results.push({
            id: fileEntry.id,
            category: fileEntry.category,
            metadata: fileEntry.metadata,
            content: fileEntry.content,
            matchCount: 100, // High match count for exact ID match
            relevance: 100,
            idMatch: true
          });
          break;
        }
        
        // Partial match (contains term)
        if (idLower.includes(term) || term.includes(idLower)) {
          results.push({
            id: fileEntry.id,
            category: fileEntry.category,
            metadata: fileEntry.metadata,
            content: fileEntry.content,
            matchCount: 50,
            relevance: 50,
            idMatch: true
          });
          break;
        }
      }
    }
    
    return results;
  }

  /**
   * Merge ID results with other search results
   */
  mergeIdResults(existing, idResults) {
    const merged = new Map();
    
    // Add existing results
    for (const result of existing) {
      merged.set(`${result.category}/${result.id}`, result);
    }
    
    // Add ID results (only if not already present, or boost if present)
    for (const idResult of idResults) {
      const key = `${idResult.category}/${idResult.id}`;
      if (merged.has(key)) {
        // Boost existing result
        const existing = merged.get(key);
        existing.relevance = (existing.relevance || 0) + idResult.relevance;
        existing.matchCount = Math.max(existing.matchCount, idResult.matchCount);
      } else {
        merged.set(key, idResult);
      }
    }
    
    return Array.from(merged.values());
  }
}

module.exports = SearchEngine;
