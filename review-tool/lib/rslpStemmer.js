/**
 * RSLPStemmer - Portuguese Stemmer
 * Based on the algorithm by Moreira & Lopes (2003)
 * Implements suffix removal rules for Brazilian Portuguese
 */

class RSLPStemmer {
  constructor() {
    // Rules organized by category and specificity
    // Each rule: { suffix, minRootLength, category }
    this.rules = [
      // === NOUNS ===
      // -ção, -ções
      { suffix: 'ções', minRoot: 4, category: 'noun' },
      { suffix: 'ção', minRoot: 4, category: 'noun' },
      
      // -mente (adverbs)
      { suffix: 'mente', minRoot: 4, category: 'adverb' },
      
      // -idade, -idades
      { suffix: 'idades', minRoot: 4, category: 'noun' },
      { suffix: 'idade', minRoot: 4, category: 'noun' },
      
      // -mento, -mentos
      { suffix: 'mentos', minRoot: 4, category: 'noun' },
      { suffix: 'mento', minRoot: 4, category: 'noun' },
      
      // -amento, -amentos
      { suffix: 'amentos', minRoot: 5, category: 'noun' },
      { suffix: 'amento', minRoot: 5, category: 'noun' },
      
      // -imento, -imentos
      { suffix: 'imentos', minRoot: 5, category: 'noun' },
      { suffix: 'imento', minRoot: 5, category: 'noun' },
      
      // -dor, -dora, -dores, -doras
      { suffix: 'doras', minRoot: 4, category: 'noun' },
      { suffix: 'dores', minRoot: 4, category: 'noun' },
      { suffix: 'dora', minRoot: 4, category: 'noun' },
      { suffix: 'dor', minRoot: 4, category: 'noun' },
      
      // -ista, -istas
      { suffix: 'istas', minRoot: 4, category: 'noun' },
      { suffix: 'ista', minRoot: 4, category: 'noun' },
      
      // -ismo, -ismos
      { suffix: 'ismos', minRoot: 4, category: 'noun' },
      { suffix: 'ismo', minRoot: 4, category: 'noun' },
      
      // -eza, -ezas
      { suffix: 'ezas', minRoot: 4, category: 'noun' },
      { suffix: 'eza', minRoot: 4, category: 'noun' },
      
      // -ança, -anças
      { suffix: 'anças', minRoot: 4, category: 'noun' },
      { suffix: 'ança', minRoot: 4, category: 'noun' },
      
      // -ência, -ências
      { suffix: 'ências', minRoot: 5, category: 'noun' },
      { suffix: 'ência', minRoot: 5, category: 'noun' },
      
      // -ário, -ários
      { suffix: 'ários', minRoot: 4, category: 'noun' },
      { suffix: 'ário', minRoot: 4, category: 'noun' },
      
      // -ório, -órios
      { suffix: 'órios', minRoot: 4, category: 'noun' },
      { suffix: 'ório', minRoot: 4, category: 'noun' },
      
      // === ADJECTIVES ===
      // -oso, -osa, -osos, -osas
      { suffix: 'osas', minRoot: 4, category: 'adj' },
      { suffix: 'osos', minRoot: 4, category: 'adj' },
      { suffix: 'osa', minRoot: 4, category: 'adj' },
      { suffix: 'oso', minRoot: 4, category: 'adj' },
      
      // -ável, -áveis
      { suffix: 'áveis', minRoot: 4, category: 'adj' },
      { suffix: 'ável', minRoot: 4, category: 'adj' },
      
      // -ível, -íveis
      { suffix: 'íveis', minRoot: 4, category: 'adj' },
      { suffix: 'ível', minRoot: 4, category: 'adj' },
      
      // -al, -ais
      { suffix: 'ais', minRoot: 4, category: 'adj' },
      { suffix: 'al', minRoot: 4, category: 'adj' },
      
      // === VERBS ===
      // -ar, -er, -ir (infinitive)
      { suffix: 'arem', minRoot: 4, category: 'verb' },
      { suffix: 'erem', minRoot: 4, category: 'verb' },
      { suffix: 'irem', minRoot: 4, category: 'verb' },
      
      { suffix: 'armos', minRoot: 4, category: 'verb' },
      { suffix: 'ermos', minRoot: 4, category: 'verb' },
      { suffix: 'irmos', minRoot: 4, category: 'verb' },
      
      { suffix: 'ando', minRoot: 4, category: 'verb' },
      { suffix: 'endo', minRoot: 4, category: 'verb' },
      { suffix: 'indo', minRoot: 4, category: 'verb' },
      
      { suffix: 'arão', minRoot: 4, category: 'verb' },
      { suffix: 'erão', minRoot: 4, category: 'verb' },
      { suffix: 'irão', minRoot: 4, category: 'verb' },
      
      { suffix: 'aria', minRoot: 4, category: 'verb' },
      { suffix: 'eria', minRoot: 4, category: 'verb' },
      { suffix: 'iria', minRoot: 4, category: 'verb' },
      
      { suffix: 'asse', minRoot: 4, category: 'verb' },
      { suffix: 'esse', minRoot: 4, category: 'verb' },
      { suffix: 'isse', minRoot: 4, category: 'verb' },
      
      { suffix: 'aste', minRoot: 4, category: 'verb' },
      { suffix: 'este', minRoot: 4, category: 'verb' },
      { suffix: 'iste', minRoot: 4, category: 'verb' },
      
      { suffix: 'ava', minRoot: 4, category: 'verb' },
      { suffix: 'ia', minRoot: 4, category: 'verb' },
      
      { suffix: 'ava', minRoot: 4, category: 'verb' },
      { suffix: 'iam', minRoot: 4, category: 'verb' },
      { suffix: 'avam', minRoot: 4, category: 'verb' },
      
      { suffix: 'ar', minRoot: 4, category: 'verb' },
      { suffix: 'er', minRoot: 4, category: 'verb' },
      { suffix: 'ir', minRoot: 4, category: 'verb' },
      
      { suffix: 'ou', minRoot: 4, category: 'verb' },
      { suffix: 'eu', minRoot: 4, category: 'verb' },
      { suffix: 'iu', minRoot: 4, category: 'verb' },
      
      { suffix: 'am', minRoot: 4, category: 'verb' },
      { suffix: 'em', minRoot: 4, category: 'verb' },
      
      // === PLURALS ===
      { suffix: 's', minRoot: 4, category: 'plural' },
    ];
    
    // Sort rules by suffix length (longer first) for greedy matching
    this.rules.sort((a, b) => b.suffix.length - a.suffix.length);
  }
  
  /**
   * Stem a Portuguese word
   * @param {string} word - Word to stem
   * @returns {string} - Stemmed word
   */
  stem(word) {
    if (!word || word.length < 4) return word.toLowerCase();
    
    const lowerWord = word.toLowerCase();
    
    // Try each rule
    for (const rule of this.rules) {
      if (lowerWord.endsWith(rule.suffix)) {
        const root = lowerWord.slice(0, -rule.suffix.length);
        
        // Check minimum root length
        if (root.length >= rule.minRoot) {
          return root;
        }
      }
    }
    
    return lowerWord;
  }
  
  /**
   * Stem multiple words
   * @param {string[]} words - Array of words
   * @returns {string[]} - Array of stemmed words
   */
  stemAll(words) {
    return words.map(w => this.stem(w));
  }
}

module.exports = RSLPStemmer;
