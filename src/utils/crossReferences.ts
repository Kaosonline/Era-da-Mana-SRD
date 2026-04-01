import type { ContentItem } from '../types/content';

export function resolveCrossRef(linkText: string, allItems: ContentItem[]): ContentItem | null {
  const normalized = linkText.trim().toLowerCase();
  
  for (const item of allItems) {
    if (item.id.toLowerCase() === normalized) {
      return item;
    }
    if (item.title.toLowerCase() === normalized) {
      return item;
    }
    const slugified = normalized.replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    if (item.id.toLowerCase().includes(slugified)) {
      return item;
    }
  }
  
  return null;
}

export function parseCrossRefs(content: string): string {
  return content.replace(/\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g, (_match, target, display) => {
    const id = target.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^\w-\/]/g, '');
    const text = display ? display.trim() : target.trim();
    return `<a href="#" class="cross-ref" data-target="${id}">${text}</a>`;
  });
}
