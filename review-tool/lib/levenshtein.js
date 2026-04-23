/**
 * Levenshtein Distance Calculator
 * Calculates the minimum number of single-character edits
 * (insertions, deletions, or substitutions) required to change one word into another.
 */

class Levenshtein {
  /**
   * Calculate Levenshtein distance between two strings
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} - Edit distance
   */
  distance(a, b) {
    const lenA = a.length;
    const lenB = b.length;
    
    if (lenA === 0) return lenB;
    if (lenB === 0) return lenA;
    
    // Use two rows instead of full matrix for memory efficiency
    let prevRow = new Array(lenB + 1);
    let currRow = new Array(lenB + 1);
    
    for (let j = 0; j <= lenB; j++) {
      prevRow[j] = j;
    }
    
    for (let i = 1; i <= lenA; i++) {
      currRow[0] = i;
      
      for (let j = 1; j <= lenB; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        currRow[j] = Math.min(
          currRow[j - 1] + 1,      // insertion
          prevRow[j] + 1,          // deletion
          prevRow[j - 1] + cost    // substitution
        );
      }
      
      // Swap rows
      [prevRow, currRow] = [currRow, prevRow];
    }
    
    return prevRow[lenB];
  }
  
  /**
   * Get dynamic max distance based on word length
   * @param {number} wordLength - Length of the word
   * @returns {number} - Maximum allowed distance
   */
  getMaxDistance(wordLength) {
    if (wordLength <= 3) return 0;
    if (wordLength <= 6) return 1;
    if (wordLength <= 10) return 2;
    return 3;
  }
  
  /**
   * Find fuzzy matches from a list of candidates
   * @param {string} query - Query string
   * @param {string[]} candidates - List of candidate strings
   * @param {number} [maxDistance] - Optional max distance override
   * @returns {Array<{word: string, distance: number, score: number}>}
   */
  fuzzyMatch(query, candidates, maxDistance) {
    const queryLower = query.toLowerCase();
    const threshold = maxDistance !== undefined ? maxDistance : this.getMaxDistance(queryLower.length);
    
    const matches = [];
    
    for (const candidate of candidates) {
      const candLower = candidate.toLowerCase();
      const dist = this.distance(queryLower, candLower);
      
      if (dist <= threshold) {
        // Score: 1.0 = exact match, 0.0 = max distance
        const score = 1 - (dist / Math.max(queryLower.length, candLower.length));
        matches.push({
          word: candidate,
          distance: dist,
          score: Math.max(0, score)
        });
      }
    }
    
    return matches.sort((a, b) => b.score - a.score);
  }
}

module.exports = Levenshtein;
