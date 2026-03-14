import type { SpellMetadata } from '../types/content';

export function parseSpellMetadata(markdown: string): SpellMetadata | null {
  const lines = markdown.split('\n');
  const metadata: SpellMetadata = {
    escola: '',
    classes: []
  };

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Padrão 1: "**Escola** Ilusão (Vislumbre); **Nível** Arcano 2, Divino 2"
    if (trimmed.includes('**Escola') && trimmed.includes('**Nível')) {
      // Extrair escola
      const escolaMatch = trimmed.match(/\*\*Escola\*\*\s*([^;]+);/);
      if (escolaMatch) {
        const escolaText = escolaMatch[1].trim();
        // Separar escola principal e subtipo (entre parênteses)
        const schoolParts = escolaText.match(/([^(]+)\(?([^)]*)\)?/);
        if (schoolParts) {
          metadata.escola = schoolParts[1].trim();
          metadata.escolaSubtipo = schoolParts[2]?.trim() || undefined;
        }
      }

      // Extrair nível
      const nivelMatch = trimmed.match(/\*\*Nível\*\*\s*([^*]+)/);
      if (nivelMatch) {
        const niveisText = nivelMatch[1].trim();
        const classesList = niveisText.split(',').map(c => c.trim());
        
        for (const classe of classesList) {
          const parts = classe.split(/\s+/); // Divide por espaços
          if (parts.length >= 2) {
            const nome = parts.slice(0, -1).join(' '); // Tudo exceto o último (o número)
            const nivel = parseInt(parts[parts.length - 1], 10);
            if (!isNaN(nivel)) {
              metadata.classes.push({ nome, nivel });
            }
          }
        }
      }
    }
    
    // Padrão 2: Linhas separadas
    else if (trimmed.startsWith('**Escola')) {
      const escolaText = trimmed.replace(/\*\*Escola\*\*[:]?/, '').trim();
      const schoolParts = escolaText.match(/([^(]+)\(?([^)]*)\)?/);
      if (schoolParts) {
        metadata.escola = schoolParts[1].trim();
        metadata.escolaSubtipo = schoolParts[2]?.trim() || undefined;
      }
    }
    else if (trimmed.startsWith('**Nível')) {
      const niveisText = trimmed.replace(/\*\*Nível\*\*[:]?/, '').trim();
      const classesList = niveisText.split(',').map(c => c.trim());
      
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
    }
    
    // Outros metadados (opcionais)
    else if (trimmed.startsWith('**Tempo de Conjuração')) {
      metadata.tempoConjuracao = trimmed.replace(/\*\*Tempo de Conjuração\*\*[:]?/, '').trim();
    }
    else if (trimmed.startsWith('**Alcance')) {
      metadata.alcance = trimmed.replace(/\*\*Alcance\*\*[:]?/, '').trim();
    }
    else if (trimmed.startsWith('**Duração')) {
      metadata.duracao = trimmed.replace(/\*\*Duração\*\*[:]?/, '').trim();
    }
    else if (trimmed.startsWith('**Teste de Resistência')) {
      metadata.resistencia = trimmed.replace(/\*\*Teste de Resistência\*\*[:]?/, '').trim();
    }
    else if (trimmed.startsWith('**Componentes')) {
      metadata.componentes = trimmed.replace(/\*\*Componentes\*\*[:]?/, '').trim();
    }
    else if (trimmed.startsWith('**Alvo') || trimmed.startsWith('**Alvos')) {
      // Pode usar como área ou alvos
      if (!metadata.area) {
        metadata.area = trimmed.replace(/\*\*Alvo(?:s)?\*\*[:]?/, '').trim();
      }
    }
  }

  // Se não encontrou nada, retorna null
  if (!metadata.escola && metadata.classes.length === 0) {
    return null;
  }

  return metadata;
}