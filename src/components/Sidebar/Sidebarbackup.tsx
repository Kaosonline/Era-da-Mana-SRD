import { useState, useEffect, useMemo } from 'react';
import { ContentItem } from '../../types/content';
import { highlightText } from '../../utils/highlightText';
import './Sidebar.css';

const CATEGORY_ICONS: Record<string, string> = {
  'races': '🧝',
  'classes': '⚔️',
  'spells': '✨',
  'feats': '📜',
  'skills': '🎯',
  'equipment': '🛡️',
  'conditions': '⚠️',
  'rules': '📖',
};

function getCategoryIcon(category: string): string {
  return CATEGORY_ICONS[category.toLowerCase()] || '📚';
}

function formatCategoryName(category: string): string {
  return category.charAt(0).toUpperCase() + category.slice(1).replace(/-/g, ' ');
}

interface SidebarProps {
  categories: string[];
  items: ContentItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  activeCategory?: string | null;
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  spellFilters: { level?: string; school?: string; castingTime?: string; duration?: string };
  onSpellFilterChange: (key: keyof SpellFilters, value: string) => void;
  availableSpellValues: {
    levels: number [];
    schools: string[];
    castingTimes: string[];
    durations: string[];
  };
}

type SpellFilters = { level?: string; school?: string; castingTime?: string; duration?: string };

export function Sidebar({ 
  categories, 
  items, 
  selectedId, 
  onSelect, 
  searchQuery, 
  onSearchChange,
  activeCategory = null,
  selectedCategories,
  onToggleCategory,
  spellFilters,
  onSpellFilterChange,
  availableSpellValues,
}: SidebarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [suggestions, setSuggestions] = useState<ContentItem[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const toggleMobile = () => setMobileOpen(!mobileOpen);

  const hasSpellsSelected = selectedCategories.includes('spells');

  // Verifica se HÁ SPELLS COM METADADOS disponíveis para filtrar
  const hasSpellMetadataAvailable = useMemo(() => {
    if (!hasSpellsSelected) return false;
    // Verifica se há pelo menos uma spell com algum metadado
    return items.some(item => 
      item.category === 'spells' && 
      (item.spellLevel !== undefined || 
       item.spellSchool !== undefined || 
       item.spellCastingTime !== undefined || 
       item.spellDuration !== undefined)
    );
  }, [items, hasSpellsSelected]);

  // Filtrar itens
  const filteredItems = useMemo(() => {
    let result = items;

    // Filtro de categorias
    if (selectedCategories.length > 0) {
      result = result.filter(item => selectedCategories.includes(item.category));
    }

    // Filtro de spells (apenas se a categoria spells foi selecionada)
    if (hasSpellsSelected) {
      if (spellFilters.level) {
        result = result.filter(item => 
          item.category === 'spells' && item.spellLevel?.toString() === spellFilters.level
        );
      }
      if (spellFilters.school) {
        result = result.filter(item => 
          item.category === 'spells' && 
          spellFilters.school &&
          item.spellSchool?.toLowerCase().includes(spellFilters.school.toLowerCase())
        );
      }
      if (spellFilters.castingTime) {
        result = result.filter(item => 
          item.category === 'spells' && 
          spellFilters.castingTime &&
          item.spellCastingTime?.toLowerCase().includes(spellFilters.castingTime.toLowerCase())
        );
      }
      if (spellFilters.duration) {
        result = result.filter(item => 
          item.category === 'spells' && 
          spellFilters.duration &&
          item.spellDuration?.toLowerCase().includes(spellFilters.duration.toLowerCase())
        );
      }
    }

    // Filtro de busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.content.toLowerCase().includes(query)
      );
    }

    return result;
  }, [items, searchQuery, selectedCategories, spellFilters, hasSpellsSelected]);

  // Agrupar itens filtrados por categoria
  const grouped = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    filteredItems.forEach(item => {
      if (!groups[item.category]) {
        groups[item.category] = [];
      }
      groups[item.category].push(item);
    });
    return Object.entries(groups)
      .sort(([catA], [catB]) => catA.localeCompare(catB))
      .map(([category, categoryItems]) => ({
        category,
        items: categoryItems.sort((a, b) => a.title.localeCompare(b.title))
      }));
  }, [filteredItems]);

  // Autocomplete
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const filtered = filteredItems.slice(0, 6);
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, filteredItems]);

  const handleSuggestionClick = (id: string) => {
    onSelect(id);
    onSearchChange('');
    setShowSuggestions(false);
    setShowCategoryFilter(false);
  };

  const toggleCategoryFilter = () => {
    setShowCategoryFilter(!showCategoryFilter);
  };

  const closeMobile = () => setMobileOpen(false);

  const shouldShowItems = searchQuery.trim() || selectedCategories.length > 0;

  // Contador de filtros ativos
  const activeFilterCount = selectedCategories.length + 
    (hasSpellsSelected && hasSpellMetadataAvailable ? 
      (spellFilters.level ? 1 : 0) + 
      (spellFilters.school ? 1 : 0) + 
      (spellFilters.castingTime ? 1 : 0) + 
      (spellFilters.duration ? 1 : 0) 
      : 0);

  return (
    <>
      <button className="mobile-menu-btn" onClick={toggleMobile} aria-label="Toggle menu">
        ☰
      </button>
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
        <div className="sidebar-controls">
          <div className="search-container">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar regras..."
                value={searchQuery}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowSuggestions(e.target.value.trim().length > 0);
                }}
                onFocus={() => { if (searchQuery.trim()) setShowSuggestions(true); }}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="clear-search" 
                  onClick={() => {
                    onSearchChange('');
                    setShowSuggestions(false);
                  }}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>

            <button 
              className={`filter-toggle ${showCategoryFilter ? 'active' : ''}`}
              onClick={toggleCategoryFilter}
              aria-label="Filtrar por categorias"
              title="Filtrar por categorias"
            >
              <span className="filter-icon">⚙️</span>
              {activeFilterCount > 0 && (
                <span className="filter-count">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {showCategoryFilter && (
            <div className="sidebar-filter-dropdown">
              <div className="filter-header">
                <span>Filtrar por categorias</span>
                {selectedCategories.length > 0 && (
                  <button 
                    className="clear-filter-btn" 
                    onClick={() => {
                      categories.forEach(cat => {
                        if (selectedCategories.includes(cat)) {
                          onToggleCategory(cat);
                        }
                      });
                    }}
                  >
                    Limpar ({selectedCategories.length})
                  </button>
                )}
              </div>
              <div className="filter-options">
                {categories.map(category => {
                  const icon = getCategoryIcon(category);
                  const name = formatCategoryName(category);
                  const itemCount = items.filter(item => item.category === category).length;
                  return (
                    <label key={category} className="filter-option">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(category)}
                        onChange={() => onToggleCategory(category)}
                      />
                      <span className="option-label">
                        {icon} {name} ({itemCount})
                      </span>
                    </label>
                  );
                })}
              </div>

              {/* Filtros específicos de magias - só mostra se spells estiver selecionado E houver metadados */}
                            {/* Filtros específicos de magias - só mostra se spells estiver selecionado E houver metadados */}
              {hasSpellsSelected && hasSpellMetadataAvailable && (
                <div className="spell-filters">
                  <h4>Filtros de Magias</h4>
                  
                  <div className="filter-group">
                    <label>Nível</label>
                    <select 
                      value={spellFilters.level || ''}
                      onChange={(e) => onSpellFilterChange('level', e.target.value)}
                    >
                      <option value="">Todos</option>
                      {availableSpellValues.levels && availableSpellValues.levels.length > 0 ? 
                        availableSpellValues.levels.map(level => (
                          <option key={level} value={level.toString()}>
                            {level === 0 ? 'Truque (Nível 0)' : `Nível ${level}`}
                          </option>
                        )) :
                        [0,1,2,3,4,5,6,7,8,9].map(n => (
                          <option key={n} value={n.toString()}>
                            {n === 0 ? 'Truque (Nível 0)' : `Nível ${n}`}
                          </option>
                        ))
                      }
                    </select>
                  </div>

                  {availableSpellValues.schools.length > 0 && (
                    <div className="filter-group">
                      <label>Escola</label>
                      <select 
                        value={spellFilters.school || ''}
                        onChange={(e) => onSpellFilterChange('school', e.target.value)}
                      >
                        <option value="">Todas</option>
                        {availableSpellValues.schools.map(school => (
                          <option key={school} value={school}>{school}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {availableSpellValues.castingTimes.length > 0 && (
                    <div className="filter-group">
                      <label>Tempo de Conjuração</label>
                      <select 
                        value={spellFilters.castingTime || ''}
                        onChange={(e) => onSpellFilterChange('castingTime', e.target.value)}
                      >
                        <option value="">Todos</option>
                        {availableSpellValues.castingTimes.map(time => (
                          <option key={time} value={time}>{time}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {availableSpellValues.durations.length > 0 && (
                    <div className="filter-group">
                      <label>Duração</label>
                      <select 
                        value={spellFilters.duration || ''}
                        onChange={(e) => onSpellFilterChange('duration', e.target.value)}
                      >
                        <option value="">Todas</option>
                        {availableSpellValues.durations.map(duration => (
                          <option key={duration} value={duration}>{duration}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {showSuggestions && suggestions.length > 0 && (
            <ul className="suggestions-dropdown">
              {suggestions.map(item => (
                <li 
                  key={item.id} 
                  className="suggestion-item"
                  onClick={() => handleSuggestionClick(item.id)}
                  onMouseDown={(e) => e.preventDefault()}
                >
                  <div className="suggestion-title">
                    {highlightText(item.title, searchQuery)}
                  </div>
                  <div className="suggestion-meta">
                    {getCategoryIcon(item.category)} {formatCategoryName(item.category)}
                    {item.category === 'spells' && item.spellLevel !== undefined && (
                      <span> • Nv. {item.spellLevel}</span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {shouldShowItems && (
          <nav className="sidebar-nav">
            {grouped.map(group => (
              <div 
                key={group.category} 
                className={`nav-category ${activeCategory === group.category ? 'active' : ''}`}
              >
                <h3 className="nav-category-title">
                  <span className="category-icon">{getCategoryIcon(group.category)}</span>
                  {formatCategoryName(group.category)}
                </h3>
                <ul className="nav-list">
                  {group.items.map(item => (
                    <li key={item.id}>
                      <button
                        className={`nav-item ${selectedId === item.id ? 'active' : ''}`}
                        onClick={() => {
                          onSelect(item.id);
                          closeMobile();
                        }}
                      >
                        {highlightText(item.title, searchQuery)}
                        {item.category === 'spells' && item.spellLevel !== undefined && (
                          <span className="spell-level-indicator"> (Nv.{item.spellLevel})</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
            {grouped.length === 0 && (
              <p className="no-results">Nenhum resultado encontrado</p>
            )}
          </nav>
        )}
      </aside>
    </>
  );
}