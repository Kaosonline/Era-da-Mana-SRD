
import { getItemByTitle, getItemById, searchItems } from './contentIndex';

// Cache para resultados de parsing
const parseCache = new Map<string, string>();

// Funções auxiliares de escape
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function escapeAttr(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function parseMarkdown(markdown: string, category?: string): string {
  const cacheKey = `${category || ''}|||${markdown}`;
  if (parseCache.has(cacheKey)) {
    return parseCache.get(cacheKey)!;
  }
  
  // Pré-processamento 1: normalizar linhas com múltiplos campos **Campo**
  // Converte "**Campo1** valor1; **Campo2** valor2" em linhas separadas
  const step1 = markdown.split('\n').map(line => {
    if (!line.includes('**')) return line;
    const parts = line.split(/(?<=; |  )\*\*/);
    if (parts.length <= 1) return line;
    return parts.map((part, idx) => {
      if (idx === 0) return part;
      return '**' + part;
    }).join('\n');
  }).join('\n');

  // Pré-processamento 2: transformar linhas que são apenas **SEÇÃO** em marcação especial
  const preprocessed = step1.split('\n').map(line => {
    const trimmed = line.trim();
    const match = trimmed.match(/^\*\*([^*]+)\*\*$/);
    if (match) {
      const sectionName = match[1].trim();
      const isDesc = sectionName.toUpperCase() === 'DESCRIÇÃO';
      return `<p class="section-header${isDesc ? ' desc-header' : ''}">${escapeHtml(sectionName)}</p>`;
    }
    return line;
  }).join('\n');
  
  let html = preprocessed;
  const lines = html.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;
  let inTable = false;
  let tableRows: string[] = [];
  let inCodeBlock = false;
  let codeBlockLang = '';
  let codeBlockLines: string[] = [];

  const flushList = (listType?: 'ul' | 'ol') => {
    if (inUl) {
      result.push('</ul>');
      inUl = false;
    }
    if (inOl) {
      result.push('</ol>');
      inOl = false;
    }
    if (listType === 'ul') inUl = true;
    if (listType === 'ol') inOl = true;
  };

  const flushTable = () => {
    if (inTable) {
      if (tableRows.length < 2) {
        tableRows = [];
        inTable = false;
        return;
      }

      const separatorIdx = tableRows.findIndex(row => /^[\s|:-]+$/.test(row) && row.includes('-'));
      let headerRow: string;
      let bodyRows: string[];

      if (separatorIdx !== -1) {
        headerRow = tableRows[0];
        bodyRows = tableRows.slice(separatorIdx + 1);
      } else {
        headerRow = tableRows[0];
        bodyRows = tableRows.slice(1);
      }

      const headers = headerRow.split('|').filter(cell => cell.trim() !== '');

      let thead = '';
      if (headers.length > 0) {
        const headerCells = headers.map(cell => `<th>${processInlineFormatting(cell.trim())}</th>`).join('');
        thead = `<thead><tr>${headerCells}</tr></thead>`;
      }

      const tbodyRows = bodyRows.map(row => {
        const cells = row.split('|').filter(cell => cell.trim() !== '');
        const tds = cells.map(cell => `<td>${processInlineFormatting(cell.trim())}</td>`).join('');
        return `<tr>${tds}</tr>`;
      }).join('\n');

      const tbody = tbodyRows ? `<tbody>${tbodyRows}</tbody>` : '';

      result.push(`<table>${thead}${tbody}</table>`);
      tableRows = [];
      inTable = false;
    }
  };

  const flushCodeBlock = () => {
    if (inCodeBlock) {
      const codeContent = codeBlockLines.join('\n');
      const langAttr = codeBlockLang ? ` class="language-${codeBlockLang}"` : '';
      result.push(`<pre><code${langAttr}>${escapeHtml(codeContent)}</code></pre>`);
      codeBlockLines = [];
      inCodeBlock = false;
      codeBlockLang = '';
    }
  };

  const resolveMdLink = (url: string): string => {
    const cleanUrl = url.replace(/\.md$/, '').replace(/\.mdx$/, '');
    const hashIdx = cleanUrl.indexOf('#');
    const [pathPart, hashPart] = hashIdx !== -1 ? [cleanUrl.slice(0, hashIdx), cleanUrl.slice(hashIdx)] : [cleanUrl, ''];

    if (pathPart.startsWith('/') || pathPart.startsWith('http') || pathPart.startsWith('#')) {
      return url;
    }

    if (pathPart.startsWith('../')) {
      const segments = pathPart.split('/');
      let cat = category || '';
      while (segments[0] === '..') {
        segments.shift();
        const parts = cat.split('/');
        if (parts.length > 1) {
          cat = parts.slice(0, -1).join('/');
        } else {
          cat = '';
        }
      }
      const fileName = segments.join('/').replace(/\.md$/, '').replace(/\.mdx$/, '').toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return `/${cat}/${fileName}${hashPart}`;
    }

    if (pathPart.includes('/')) {
      const slug = pathPart.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
      return `/${slug}${hashPart}`;
    }

    const item = getItemByTitle(pathPart);
    if (item) {
      return `/${item.category}/${item.id}${hashPart}`;
    }
    const byId = getItemById(pathPart);
    if (byId) {
      return `/${byId.category}/${byId.id}${hashPart}`;
    }
    const searchResults = searchItems(pathPart);
    if (searchResults.length > 0) {
      return `/${searchResults[0].category}/${searchResults[0].id}${hashPart}`;
    }
    const cat = category || '';
    const slug = pathPart.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    return `/${cat}/${slug}${hashPart}`;
  };

  const processInlineFormatting = (text: string): string => {
    let processed = escapeHtml(text);
    // Strikethrough
    processed = processed.replace(/~~(.*?)~~/g, '<del>$1</del>');
    // Bold (asterisco e underscore)
    processed = processed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processed = processed.replace(/__(.*?)__/g, '<strong>$1</strong>');
    processed = processed.replace(/_(.*?)_/g, '<em>$1</em>');
    // Código inline
    processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
    // Links - externos abrem em nova aba, internos são resolvidos
    // O texto e URL já foram escapados por escapeHtml, então usamos diretamente
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, displayText, rawUrl) => {
      if (/^(https?:|mailto:|\/\/)/i.test(rawUrl)) {
        return `<a href="${rawUrl}" target="_blank" rel="noopener noreferrer">${displayText}</a>`;
      }
      // Link interno .md -> resolver para rota SPA
      if (/\.mdx?$/i.test(rawUrl) || !rawUrl.includes('.')) {
        const resolved = resolveMdLink(rawUrl);
        return `<a href="${escapeAttr(resolved)}" class="internal-link">${displayText}</a>`;
      }
      return `<a href="${rawUrl}">${displayText}</a>`;
    });
    // Imagens
    processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
      return `<img src="${src}" alt="${alt}" />`;
    });
    // Cross-referências - link direto para rota SPA
    processed = processed.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, display) => {
      const id = target.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-\/]/g, '');
      const linkText = display ? display.trim() : target.trim();
      return `<a href="/${escapeAttr(id)}" class="internal-link">${linkText}</a>`;
    });
    return processed;
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    // Pular linhas que já são HTML de cabeçalho de seção (pré-processadas)
    if (line.startsWith('<p class="section-header')) {
      result.push(line);
      continue;
    }

    if (trimmed.startsWith('# ')) {
      flushList();
      result.push(`<h1>${processInlineFormatting(trimmed.substring(2))}</h1>`);
      continue;
    } else if (trimmed.startsWith('## ')) {
      flushList();
      result.push(`<h2>${processInlineFormatting(trimmed.substring(3))}</h2>`);
      continue;
    } else if (trimmed.startsWith('### ')) {
      flushList();
      result.push(`<h3>${processInlineFormatting(trimmed.substring(4))}</h3>`);
      continue;
    } else if (trimmed.startsWith('#### ')) {
      flushList();
      result.push(`<h4>${processInlineFormatting(trimmed.substring(5))}</h4>`);
      continue;
    }

    if (trimmed.startsWith('> ')) {
      if (!inBlockquote) {
        result.push('<blockquote>');
        inBlockquote = true;
      }
      result.push(`<p>${processInlineFormatting(trimmed.substring(2))}</p>`);
      continue;
    } else if (inBlockquote) {
      result.push('</blockquote>');
      inBlockquote = false;
    }

    if (trimmed.startsWith('- ')) {
      if (!inUl) {
        flushList('ul');
      }
      const content = processInlineFormatting(trimmed.substring(2));
      result.push(`<li>${content}</li>`);
      continue;
    } else if (inUl) {
      flushList();
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inOl) {
        flushList('ol');
      }
      const content = processInlineFormatting(trimmed.replace(/^\d+\.\s+/, ''));
      result.push(`<li>${content}</li>`);
      continue;
    } else if (inOl) {
      flushList();
    }

    // Blocos de código (```)
    if (trimmed.startsWith('```')) {
      if (!inCodeBlock) {
        inCodeBlock = true;
        codeBlockLang = trimmed.substring(3).trim();
        codeBlockLines = [];
      } else {
        flushCodeBlock();
      }
      continue;
    } else if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Detectar tabelas markdown (linhas que começam e terminam com | e têm pelo menos 2 |)
    // Ignora linhas como "|" (apenas um pipe) que não são tabelas válidas
    if (trimmed.startsWith('|') && trimmed.endsWith('|') && trimmed.indexOf('|', 1) > 0) {
      if (!inTable) {
        inTable = true;
        tableRows = [];
      }
      tableRows.push(trimmed);
      continue;
    } else if (inTable) {
      flushTable();
    }

    // Linha horizontal (---, ***, ___)
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmed)) {
      result.push('<hr>');
      continue;
    }

    const processed = processInlineFormatting(line);

    if (trimmed.length > 0) {
      result.push(`<p>${processed}</p>`);
    } else {
      result.push('');
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');
  if (inBlockquote) result.push('</blockquote>');
  if (inTable) flushTable();
  if (inCodeBlock) flushCodeBlock();

  const finalResult = result.join('\n');
  
  // Armazenar no cache (limitar cache a 100 entradas para evitar uso excessivo de memória)
  if (parseCache.size < 100) {
    parseCache.set(cacheKey, finalResult);
  }
  
  return finalResult;
}
