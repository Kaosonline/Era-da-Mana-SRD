import React from 'react';
import { ContentItem } from '../../types/content';
import { parseMarkdown } from '../../utils/markdownParser';
import { highlightText } from '../../utils/highlightText';
import './ContentView.css';

function getCategoryIcon(category: string): string {
  const icons: Record<string, string> = {
    'races': '🧝',
    'classes': '⚔️',
    'spells': '✨',
    'feats': '📜',
    'skills': '🎯',
    'equipment': '🛡️',
    'conditions': '⚠️',
    'rules': '📖',
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
  onSelect: (id: string) => void;
  onBackToCategory: () => void;
  currentCategory?: string | null;
  allItems?: ContentItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  spellFilters: { level?: string; school?: string; castingTime?: string; duration?: string };
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}

function HomePage({ 
  allItems, 
  onSelect, 
  selectedCategories,
  spellFilters,
  searchQuery,
  hasActiveFilters,
  onClearFilters
}: { 
  allItems: ContentItem[], 
  onSelect: (id: string) => void,
  selectedCategories: string[],
  spellFilters: { level?: string; school?: string; castingTime?: string; duration?: string },
  searchQuery: string,
  hasActiveFilters: boolean,
  onClearFilters: () => void
}) {
  const allCategories = Array.from(new Set(allItems.map(item => item.category))).sort();

  // Função para contar itens de uma categoria que atendem a todos os filtros
  const countItemsInCategory = (category: string) => {
    return allItems.filter(item => 
      item.category === category &&
      (selectedCategories.length === 0 || selectedCategories.includes(item.category)) &&
      (searchQuery === '' || 
       item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
       item.content.toLowerCase().includes(searchQuery.toLowerCase())) &&
      (category !== 'spells' || 
        (!spellFilters.level || item.spellLevel?.toString() === spellFilters.level) &&
        (!spellFilters.school || item.spellSchool?.toLowerCase().includes(spellFilters.school.toLowerCase())) &&
        (!spellFilters.castingTime || item.spellCastingTime?.toLowerCase().includes(spellFilters.castingTime.toLowerCase())) &&
        (!spellFilters.duration || item.spellDuration?.toLowerCase().includes(spellFilters.duration.toLowerCase()))
      )
    ).length;
  };

  // Filtrar categorias
  let categories = allCategories;
  if (selectedCategories.length > 0) {
    categories = categories.filter(cat => selectedCategories.includes(cat));
  }

  // Remover categorias com zero itens após filtros
  categories = categories.filter(cat => countItemsInCategory(cat) > 0);

  const getItemsForCategory = (category: string) => 
    allItems.filter(item => item.category === category)
            .sort((a, b) => a.title.localeCompare(b.title));

  const handleCategoryClick = (category: string) => {
    const items = getItemsForCategory(category);
    if (items.length > 0) {
      onSelect(items[0].id);
    }
  };

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
        {categories.map(category => {
          const count = countItemsInCategory(category);
          return (
            <div 
              key={category} 
              className="category-card" 
              onClick={() => handleCategoryClick(category)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => { if (e.key === 'Enter') handleCategoryClick(category); }}
            >
              <div className="category-icon">{getCategoryIcon(category)}</div>
              <h3>{formatCategoryName(category)}</h3>
              <p>{count} {count === 1 ? 'página' : 'páginas'}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ContentView({ 
  item, 
  previousItem, 
  nextItem, 
  onSelect, 
  onBackToCategory, 
  currentCategory,
  allItems = [],
  searchQuery,
  onSearchChange,
  selectedCategories,
  spellFilters,
  hasActiveFilters,
  onClearFilters
}: ContentViewProps) {
  if (!item) {
    return <HomePage 
      allItems={allItems} 
      onSelect={onSelect} 
      selectedCategories={selectedCategories}
      spellFilters={spellFilters}
      searchQuery={searchQuery}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
    />;
  }

  const htmlContent = parseMarkdown(item.content);
  const formattedCategory = currentCategory ? formatCategoryName(currentCategory) : 'Categoria';

  return (
    <div className="content-view">
      <nav className="navigation-bar" aria-label="Navegação de páginas">
        <button
          className="nav-button back-to-category"
          onClick={onBackToCategory}
        >
          ← Voltar para {formattedCategory}
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

      <article className="content-article">
        <h1 className="content-title">{item.title}</h1>
        {item.category === 'spells' && (
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
    </div>
  );
}