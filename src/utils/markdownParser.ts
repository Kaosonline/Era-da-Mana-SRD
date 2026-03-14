
export function parseMarkdown(markdown: string): string {
  let html = markdown;
  const lines = html.split('\n');
  const result: string[] = [];
  let inUl = false;
  let inOl = false;
  let inBlockquote = false;

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

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const trimmed = line.trim();

    if (trimmed.startsWith('# ')) {
      flushList();
      result.push(`<h1>${trimmed.substring(2)}</h1>`);
      continue;
    } else if (trimmed.startsWith('## ')) {
      flushList();
      result.push(`<h2>${trimmed.substring(3)}</h2>`);
      continue;
    } else if (trimmed.startsWith('### ')) {
      flushList();
      result.push(`<h3>${trimmed.substring(4)}</h3>`);
      continue;
    } else if (trimmed.startsWith('#### ')) {
      flushList();
      result.push(`<h4>${trimmed.substring(5)}</h4>`);
      continue;
    }

    if (trimmed.startsWith('> ')) {
      if (!inBlockquote) {
        result.push('<blockquote>');
        inBlockquote = true;
      }
      result.push(`<p>${trimmed.substring(2)}</p>`);
      continue;
    } else if (inBlockquote) {
      result.push('</blockquote>');
      inBlockquote = false;
    }

    if (trimmed.startsWith('- ')) {
      if (!inUl) {
        flushList('ul');
      }
      const content = trimmed.substring(2);
      result.push(`<li>${content}</li>`);
      continue;
    } else if (inUl) {
      flushList();
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      if (!inOl) {
        flushList('ol');
      }
      const content = trimmed.replace(/^\d+\.\s+/, '');
      result.push(`<li>${content}</li>`);
      continue;
    } else if (inOl) {
      flushList();
    }

    let processed = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    processed = processed.replace(/\*(.*?)\*/g, '<em>$1</em>');
    processed = processed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    if (trimmed.length > 0) {
      result.push(`<p>${processed}</p>`);
    } else {
      result.push('');
    }
  }

  if (inUl) result.push('</ul>');
  if (inOl) result.push('</ol>');
  if (inBlockquote) result.push('</blockquote>');

  return result.join('\n');
}
