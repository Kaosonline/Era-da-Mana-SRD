
// Cache para resultados de parsing
const parseCache = new Map<string, string>();

export function parseMarkdown(markdown: string, category?: string): string {
  const cacheKey = `${category || ''}|||${markdown}`;
  if (parseCache.has(cacheKey)) {
    return parseCache.get(cacheKey)!;
  }
  
  let html = markdown;
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
      const headerRow = tableRows[0] || '';
      const bodyRows = tableRows.slice(2);

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
      const fileName = segments.join('/').replace(/\.md$/, '').replace(/\.mdx$/, '');
      return `/${cat}/${fileName}${hashPart}`;
    }

    if (pathPart.includes('/')) {
      return `/${pathPart}${hashPart}`;
    }

    const cat = category || '';
    return `/${cat}/${pathPart}${hashPart}`;
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
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, text, url) => {
      const safeUrl = escapeAttr(url);
      const safeText = escapeAttr(text);
      if (/^(https?:|mailto:|\/\/)/i.test(url)) {
        return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${safeText}</a>`;
      }
      // Link interno .md -> resolver para rota SPA
      if (/\.mdx?$/i.test(url) || !url.includes('.')) {
        const resolved = resolveMdLink(url);
        return `<a href="${escapeAttr(resolved)}" class="internal-link">${safeText}</a>`;
      }
      return `<a href="${safeUrl}">${safeText}</a>`;
    });
    // Imagens
    processed = processed.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (_match, alt, src) => {
      return `<img src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" />`;
    });
    // Cross-referências - link direto para rota SPA
    processed = processed.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, display) => {
      const id = target.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-\/]/g, '');
      const text = display ? display.trim() : target.trim();
      return `<a href="/${escapeAttr(id)}" class="internal-link">${escapeAttr(text)}</a>`;
    });
    return processed;
  };

  const escapeHtml = (text: string): string => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const escapeAttr = (text: string): string => {
    return text.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  };

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

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

  const finalResult = result.join('\n');
  
  // Armazenar no cache (limitar cache a 100 entradas para evitar uso excessivo de memória)
  if (parseCache.size < 100) {
    parseCache.set(cacheKey, finalResult);
  }
  
  return finalResult;
}
