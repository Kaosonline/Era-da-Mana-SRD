import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ContentItem } from '../../types/content';
import { useFavorites } from '../../contexts/FavoritesContext';
import { parseMarkdown } from '../../utils/markdownParser';
import { loadContentItem } from '../../utils/dataLoader';
import { getCategoryIcon, formatCategoryName } from '../../utils/categoryHelpers';
import './ContentView.css';

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
  featFilters?: { type?: string; noPrerequisites?: boolean };
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function HomePage({
  allItems,
  selectedCategories,
  spellFilters,
  featFilters,
  searchQuery,
  hasActiveFilters,
  onClearFilters
}: {
  allItems: ContentItem[],
  selectedCategories: string[],
  spellFilters: { level?: string; school?: string; castingTime?: string; duration?: string },
  featFilters?: { type?: string; noPrerequisites?: boolean },
  searchQuery: string,
  hasActiveFilters: boolean,
  onClearFilters: () => void
}) {
  const allCategories = useMemo(() =>
    Array.from(new Set(allItems.map(item => item.category))).sort(),
    [allItems]
  );

  const lowerSearchQuery = useMemo(() => searchQuery.toLowerCase(), [searchQuery]);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const hasSelectedCategories = selectedCategories.length > 0;

    for (const category of allCategories) {
      counts[category] = allItems.filter(item => {
        // Filtro por categoria
        if (item.category !== category) return false;
        if (hasSelectedCategories && !selectedCategories.includes(category)) return false;

        // Filtro por busca
        const matchesSearch = searchQuery === '' ||
          item.title?.toLowerCase().includes(lowerSearchQuery) ||
          item.id?.toLowerCase().includes(lowerSearchQuery);
        if (!matchesSearch) return false;

        // Filtros específicos para magias
        if (category === 'magias') {
          return (
            !spellFilters.level || item.spellLevel?.toString() === spellFilters.level
          ) && (
            !spellFilters.school || item.spellSchool?.toLowerCase().includes(spellFilters.school.toLowerCase())
          ) && (
            !spellFilters.castingTime || item.spellCastingTime?.toLowerCase().includes(spellFilters.castingTime.toLowerCase())
          ) && (
            !spellFilters.duration || item.spellDuration?.toLowerCase().includes(spellFilters.duration.toLowerCase())
          );
        }

        // Filtros específicos para talentos
        if (category === 'talentos') {
          return (
            !featFilters?.type || item.featType === featFilters.type
          ) && (
            !featFilters?.noPrerequisites || !item.hasPrerequisites
          );
        }

        return true;
      }).length;
    }
    return counts;
  }, [allItems, allCategories, selectedCategories, spellFilters, featFilters, lowerSearchQuery]);

  const countItemsInCategory = (category: string) => {
    return categoryCounts[category] ?? 0;
  };

  const visibleCategories = useMemo(() => {
    const cats = selectedCategories.length > 0
      ? allCategories.filter(cat => selectedCategories.includes(cat))
      : allCategories;
    return cats.filter(cat => categoryCounts[cat] > 0);
  }, [allCategories, selectedCategories, categoryCounts]);

  const itemsByCategory = useMemo(() => {
    const map: Record<string, ContentItem[]> = {};
    for (const cat of visibleCategories) {
      map[cat] = allItems
        .filter(item => item.category === cat)
        .sort((a, b) => a.title.localeCompare(b.title));
    }
    return map;
  }, [allItems, visibleCategories]);

  return (
    <div className="home-page">
      <div className="hero" role="banner">
        <h1>Era da Mana RPG</h1>
        <p className="subtitle">Compêndio de Regras</p>
        <p className="description">
          Navegue por todas as regras do sistema: raças, classes, magias, talentos e muito mais.
          Tudo organizado em um formato fácil de consultar.
        </p>
      </div>

      {hasActiveFilters && (
        <div className="active-filters-bar" role="status" aria-live="polite">
          <div className="active-filters-info">
            <span>Filtros ativos</span>
            <button
              className="clear-all-filters"
              onClick={onClearFilters}
              aria-label="Limpar todos os filtros ativos"
            >
              Limpar todos
            </button>
          </div>
        </div>
      )}

      <div className="category-grid" role="grid" aria-label="Categorias de conteúdo">
        {visibleCategories.map(category => {
          const count = countItemsInCategory(category);
          const firstItem = itemsByCategory[category]?.[0];
          return (
            <Link
              key={category}
              to={`/${category}/${firstItem?.id || ''}`}
              className="category-card"
              aria-label={`${formatCategoryName(category)}, ${count} ${count === 1 ? 'página' : 'páginas'}`}
            >
              <div className="category-icon" aria-hidden="true">{getCategoryIcon(category)}</div>
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
    <div className="content-skeleton" role="status" aria-live="polite">
      <div className="skeleton-line skeleton-title" aria-hidden="true" />
      <div className="skeleton-line skeleton-meta" aria-hidden="true" />
      <div className="skeleton-line skeleton-paragraph" aria-hidden="true" />
      <div className="skeleton-line skeleton-paragraph" aria-hidden="true" />
      <div className="skeleton-line skeleton-paragraph" aria-hidden="true" />
      <div className="skeleton-line skeleton-paragraph short" aria-hidden="true" />
      <span className="sr-only">Carregando conteúdo...</span>
    </div>
  );
}

function ContentArticle({ item }: { item: ContentItem }) {
  const [content, setContent] = useState<string>(item.content || '');
  const [loadingContent, setLoadingContent] = useState(!item.content);
  const { isFavorite, toggleFavorite } = useFavorites();
  const navigate = useNavigate();
  const contentBodyRef = useRef<HTMLDivElement>(null);

  const favorite = useMemo(() => isFavorite(item.id), [item.id, isFavorite]);

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

  const handleInternalLinkClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    const link = target.closest('a.internal-link');
    if (!link) return;

    const href = link.getAttribute('href');
    if (!href || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('//')) return;

    e.preventDefault();
    e.stopPropagation();

    const path = href.split('#')[0];
    const parts = path.split('/').filter(Boolean);

    if (parts.length === 2) {
      navigate(`/${parts[0]}/${parts[1]}`);
    } else if (parts.length === 1) {
      navigate(`/${parts[0]}`);
    }
  }, [navigate]);

  useEffect(() => {
    const el = contentBodyRef.current;
    if (!el) return;
    el.addEventListener('click', handleInternalLinkClick);
    return () => {
      el.removeEventListener('click', handleInternalLinkClick);
    };
  }, [handleInternalLinkClick]);

  const htmlContent = useMemo(() => {
    if (!content) return '';

    try {
      const contentWithoutTitle = content.replace(/^#{1,6}\s+.+$/m, '').trimStart();
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
      <header className="content-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
        <h1 className="content-title" style={{ marginRight: '8px' }}>{item.title}</h1>
        <button
          className="favorite-btn"
          onClick={() => toggleFavorite(item.id)}
          aria-label={favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
          title="Favoritos"
          aria-pressed={favorite}
        >
          <span aria-hidden="true">{favorite ? '★' : '☆'}</span>
        </button>
      </header>
      {item.category === 'magias' && (
        <div className="spell-metadata" role="region" aria-label="Metadados da magia">
          {item.spellSchool && (
            <span className="metadata-item" aria-label={`Escola: ${item.spellSchool}`}>
              {item.spellSchool}
            </span>
          )}
          {item.spellClasses && item.spellClasses.length > 0 && (
            <span className="metadata-item" aria-label={`Níveis: ${item.spellClasses.map(c => `${c.className} ${c.level}`).join(', ')}`}>
              Nível: {item.spellClasses.map(c => `${c.className} ${c.level}`).join(', ')}
            </span>
          )}
          {item.spellCastingTime && (
            <span className="metadata-item" aria-label={`Tempo de conjuração: ${item.spellCastingTime}`}>
              {item.spellCastingTime}
            </span>
          )}
          {item.spellDuration && (
            <span className="metadata-item" aria-label={`Duração: ${item.spellDuration}`}>
              {item.spellDuration}
            </span>
          )}
        </div>
      )}
      {item.category === 'talentos' && (
        <div className="feat-metadata" role="region" aria-label="Metadados do talento">
          {item.featType && (
            <span className="metadata-item" aria-label={`Tipo: ${item.featType}`}>
              Tipo: {item.featType}
            </span>
          )}
          {item.hasPrerequisites === true ? (
            <span className="metadata-item metadata-prerequisites" aria-label="Este talento possui pré-requisitos">
              Pré-requisitos: Sim
            </span>
          ) : item.hasPrerequisites === false ? (
            <span className="metadata-item metadata-no-prerequisites" aria-label="Este talento não possui pré-requisitos">
              Sem pré-requisitos
            </span>
          ) : null}
        </div>
      )}
      <div
        className="content-body"
        ref={contentBodyRef}
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        role="article"
        aria-label={`Conteúdo de ${item.title}`}
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
  featFilters,
  hasActiveFilters,
  onClearFilters
}: ContentViewProps) {
  if (!item) {
    return <HomePage
      allItems={allItems}
      selectedCategories={selectedCategories}
      spellFilters={spellFilters}
      featFilters={featFilters}
      searchQuery={searchQuery}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
    />;
  }

  return (
    <div className="content-view">
      <nav className="navigation-bar" aria-label="Navegação de páginas" role="navigation">
        <button
          className="nav-button back-to-category"
          onClick={onBackToCategory}
          aria-label="Voltar para a página inicial"
          title="Voltar para início"
        >
          ← Início
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="nav-button"
            onClick={() => previousItem && onSelect(previousItem.id)}
            disabled={!previousItem}
            aria-label={previousItem ? `Página anterior: ${previousItem.title}` : 'Não há página anterior'}
            aria-disabled={!previousItem}
            tabIndex={previousItem ? 0 : -1}
            title={previousItem ? previousItem.title : undefined}
          >
            ◄ Anterior
          </button>
          <button
            className="nav-button"
            onClick={() => nextItem && onSelect(nextItem.id)}
            disabled={!nextItem}
            aria-label={nextItem ? `Próxima página: ${nextItem.title}` : 'Não há próxima página'}
            aria-disabled={!nextItem}
            tabIndex={nextItem ? 0 : -1}
            title={nextItem ? nextItem.title : undefined}
          >
            Próxima ►
          </button>
        </div>
      </nav>

      <main>
        <ContentArticle item={item} />
      </main>
    </div>
  );
}
