import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ContentItem } from '../../types/content';
import { useFavorites } from '../../contexts/FavoritesContext';
import { parseMarkdown } from '../../utils/markdownParser';
import { loadContentItem } from '../../utils/dataLoader';
import './ContentView.css';

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'raças': '🧝',
    'classes': '⚔️',
    'magias': '✨',
    'talentos': '📜',
    'perícias': '🎯',
    'equipamentos': '🛡️',
    'condições': '⚠️',
    'regras': '📖',
  };
  return icons[category.toLowerCase()] || '📚';
}

function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
}

interface ContentViewProps {
  item: ContentItem | null;
  previousItem?: ContentItem | null;
  nextItem?: ContentItem | null;
  onSelect?: (id: string) => void;
  onBackToCategory?: () => void;
  currentCategory?: string | null;
  allItems?: ContentItem[];
  searchQuery: string;
  selectedCategories: string[];
  spellFilters: { level?: string; school?: string; castingTime?: string; duration?: string };
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function HomePage({ 
  allItems, 
  selectedCategories,
  spellFilters,
  searchQuery,
  hasActiveFilters,
  onClearFilters
}: { 
  allItems: ContentItem[], 
  selectedCategories: string[],
  spellFilters: { level?: string; school?: string; castingTime?: string; duration?: string },
  searchQuery: string,
  hasActiveFilters: boolean,
  onClearFilters: () => void
}) {
  const allCategories = useMemo(() => Array.from(new Set(allItems.map(item => item.category))).sort(), [allItems]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const category of allCategories) {
      counts[category] = allItems.filter(item => 
        item.category === category &&
        (selectedCategories.length === 0 || selectedCategories.includes(item.category)) &&
        (searchQuery === '' || 
         item.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
         item.id?.toLowerCase().includes(searchQuery.toLowerCase())) &&
        (category !== 'magias' || 
          (!spellFilters.level || item.spellLevel?.toString() === spellFilters.level) &&
          (!spellFilters.school || item.spellSchool?.toLowerCase().includes(spellFilters.school.toLowerCase())) &&
          (!spellFilters.castingTime || item.spellCastingTime?.toLowerCase().includes(spellFilters.castingTime.toLowerCase())) &&
          (!spellFilters.duration || item.spellDuration?.toLowerCase().includes(spellFilters.duration.toLowerCase()))
        )
      ).length;
    }
    return counts;
  }, [allItems, allCategories, selectedCategories, spellFilters, searchQuery]);

  const countItemsInCategory = (category: string) => {
    return categoryCounts[category] ?? 0;
  };

  const visibleCategories = useMemo(() => {
    let cats = selectedCategories.length > 0 
      ? allCategories.filter(cat => selectedCategories.includes(cat))
      : allCategories;
    return cats.filter(cat => countItemsInCategory(cat) > 0);
  }, [allCategories, selectedCategories, categoryCounts]);

  const itemsByCategory = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    for (const cat of allCategories) {
      map[cat] = allItems
        .filter(item => item.category === cat)
        .sort((a, b) => a.title.localeCompare(b.title));
    }
    return map;
  }, [allItems, allCategories]);

  return (
    <div className="home-page">
      <div className="hero">
        <h1>Era da Mana RPG</h1>
        <p className="subtitle">Compêndio de Regras</p>
        <p className="description">
          Navegue por todas as regras do sistema: raças, classes, magias, talentos e muito mais.
          Tudo organizado em um formato fácil de consultar.
        </p>
      </div>

      {hasActiveFilters && (
        <div className="active-filters-bar">
          <div className="active-filters-info">
            <span>Filtros ativos</span>
            <button className="clear-all-filters" onClick={onClearFilters}>
              Limpar todos
            </button>
          </div>
        </div>
      )}

      <div className="category-grid">
        {visibleCategories.map(category => {
          const count = countItemsInCategory(category);
          const firstItem = itemsByCategory[category]?.[0];
          return (
            <Link
              key={category}
              to={`/${category}/${firstItem?.id || ''}`}
              className="category-card"
            >
              <div className="category-icon">{getCategoryIcon(category)}</div>
              <h3>{formatCategoryName(category)}</h3>
              <p>{count} {count === 1 ? 'página' : 'páginas'}</p>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function ContentSkeleton() {
  return (
    <div className="content-skeleton">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-meta" />
      <div className="skeleton-line skeleton-paragraph" />
      <div className="skeleton-line skeleton-paragraph" />
      <div className="skeleton-line skeleton-paragraph" />
      <div className="skeleton-line skeleton-paragraph short" />
    </div>
  );
}

function ContentArticle({ item }: { item: ContentItem }) {
  const [content, setContent] = useState<string>(item.content || '');
  const [loadingContent, setLoadingContent] = useState(!item.content);
  const { isFavorite, toggleFavorite } = useFavorites();
  const favorite = isFavorite(item.id);

  useEffect(() => {
    if (item.content) {
      setContent(item.content);
      setLoadingContent(false);
      return;
    }

    let cancelled = false;

    const fetchContent = async () => {
      setLoadingContent(true);
      const rawContent = await loadContentItem(item.category, item.id);
      if (!cancelled && rawContent) {
        setContent(rawContent);
        setLoadingContent(false);
      }
    };

    fetchContent();

    return () => {
      cancelled = true;
    };
  }, [item.id, item.category, item.content]);

  const htmlContent = useMemo(() => {
    if (!content) return '';
    const contentWithoutTitle = content.replace(/^#{1,6}\s+.+$/m, '').trimStart();
    try {
      return parseMarkdown(contentWithoutTitle, item.category);
    } catch (error) {
      console.error('Erro ao parsear markdown:', error);
      return `<p style="color: red; padding: 1rem; background: #fee; border: 1px solid #fcc;">Erro ao renderizar conteúdo.</p>`;
    }
  }, [content, item.category]);

  if (loadingContent) {
    return (
      <article className="content-article">
        <div className="content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <h1 className="content-title" style={{ marginRight: '8px' }}>{item.title}</h1>
        </div>
        <ContentSkeleton />
      </article>
    );
  }

  return (
    <article className="content-article">
      <div className="content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <h1 className="content-title" style={{ marginRight: '8px' }}>{item.title}</h1>
        <button
          className="favorite-btn"
          onClick={() => toggleFavorite(item.id)}
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          title="Favoritos"
        >
          {favorite ? '★' : '☆'}
        </button>
      </div>
      {item.category === 'magias' && (
        <div className="spell-metadata">
          {item.spellSchool && (
            <span className="metadata-item">{item.spellSchool}</span>
          )}
          {item.spellClasses && item.spellClasses.length > 0 && (
            <span className="metadata-item">
              Nível: {item.spellClasses.map(c => `${c.className} ${c.level}`).join(', ')}
            </span>
          )}
          {item.spellCastingTime && (
            <span className="metadata-item">{item.spellCastingTime}</span>
          )}
          {item.spellDuration && (
            <span className="metadata-item">{item.spellDuration}</span>
          )}
        </div>
      )}
      <div
        className="content-body"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
      />
    </article>
  );
}

export function ContentView({ 
  item, 
  previousItem, 
  nextItem, 
  onSelect = () => {}, 
  onBackToCategory = () => {}, 
  currentCategory: _currentCategory,
  allItems = [],
  searchQuery,
  selectedCategories,
  spellFilters,
  hasActiveFilters,
  onClearFilters
}: ContentViewProps) {
  if (!item) {
    return <HomePage 
      allItems={allItems} 
      selectedCategories={selectedCategories}
      spellFilters={spellFilters}
      searchQuery={searchQuery}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
    />;
  }

  return (
    <div className="content-view">
      <nav className="navigation-bar" aria-label="Navegação de páginas">
        <button
          className="nav-button back-to-category"
          onClick={onBackToCategory}
        >
          ← Início
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="nav-button"
            onClick={() => previousItem && onSelect(previousItem.id)}
            disabled={!previousItem}
            aria-label="Página anterior"
          >
            ◄ Anterior
          </button>
          <button
            className="nav-button"
            onClick={() => nextItem && onSelect(nextItem.id)}
            disabled={!nextItem}
            aria-label="Próxima página"
          >
            Próxima ►
          </button>
        </div>
      </nav>

      <ContentArticle item={item} />
    </div>
  );
}
