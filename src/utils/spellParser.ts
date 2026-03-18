// Define SpellMetadata here if not exported from '../types/content'
export interface SpellMetadata {
  escola: string;
  classes: { nome: string; nivel: number }[];
  tempoConjuracao?: string;
  duracao?: string;
  alcance?: string;
  area?: string;
  resistencia?: string;
  componentes?: string;
}

export function parseSpellMetadata(markdown: string): SpellMetadata | null {
  const lines = markdown.split('\n');
  const metadata: SpellMetadata = {
    escola: '',
    classes: []
  };

  // Mapeamento de chaves para campos
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
    'alcance': 'alcance',
    'range': 'alcance',
    'alvos': 'area',
    'alvo': 'area',
    'targets': 'area',
    'teste de resistência': 'resistencia',
    'saving throw': 'resistencia',
    'resistência': 'resistencia',
    'componentes': 'componentes',
    'components': 'componentes',
  };

  for (const line of lines) {
    // Regex para encontrar TODOS os pares **chave** valor na linha
    const regex = /\*\*(.*?)\*\*\s*([^*]*)/g;
    let match;
    
    while ((match = regex.exec(line)) !== null) {
      const key = match[1].trim().toLowerCase();
      let value = match[2].trim(); value = value.replace(/;+$/, '').trim();

      // Cortar qualquer outro **...** que venha depois (metadados na mesma linha)
      const nextAsterisk = value.indexOf('**');
      if (nextAsterisk !== -1) {
        value = value.substring(0, nextAsterisk).trim();
      }

      const field = keyMap[key];
      if (!field) continue;

      if (field === 'classes') {
        // Extrair "Arcano 2, Divino 2" → [{nome: "Arcano", nivel: 2}, ...]
        const classesList = value.split(',').map(c => c.trim());
        for (const classe of classesList) {
          const parts = classe.split(/\s+/);
          if (parts.length >= 2) {
            const nome = parts.slice(0, -1).join(' ');
            const nivel = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(nivel)) {
              metadata.classes.push({ nome, nivel });
            }
          }
        }
      } else {
        // @ts-ignore - field é uma chave válida de SpellMetadata
        metadata[field] = value;
      }
    }
  }

  if (!metadata.escola && metadata.classes.length === 0) {
    return null;
  }

  return metadata;
}