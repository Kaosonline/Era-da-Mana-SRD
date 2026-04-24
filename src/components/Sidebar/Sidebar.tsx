import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { ContentItem } from '../../types/content';
import { getCategoryIcon, formatCategoryName } from '../../utils/categoryHelpers';
import { highlightText } from '../../utils/highlightText';
import { useTabs } from '../../contexts/TabsContext';
import './Sidebar.css';

const ITEM_HEIGHT = 32;
const OVERSCAN = 10;

interface VirtualizedSidebarProps { 
  categories: string[];
  items: ContentItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedCategories: string[];
  onToggleCategory: (category: string) => void;
  spellFilters: { level?: string; school?: string; castingTime?: string; duration?: string };
  onSpellFilterChange: (key: keyof SpellFilters, value: string) => void;
  availableSpellValues: {
    levels: number[];
    schools: string[];
    castingTimes: string[];
    durations: string[];
  };
  hasMagiasSelected: boolean;
  featFilters: { type?: string; noPrerequisites?: boolean };
  onFeatFilterChange: (key: keyof FeatFilters, value: string | boolean) => void;
  availableFeatTypes: string[];
  hasTalentosSelected: boolean;
  isOpen: boolean;
  onToggle: () => void;
  onOpenTab: (tab: { id: string; category: string; itemId: string; title: string }) => void;
}

type SpellFilters = { level?: string; school?: string; castingTime?: string; duration?: string };
type FeatFilters = { type?: string; noPrerequisites?: boolean };

export function Sidebar({ 
  categories, 
  items, 
  searchQuery, 
  onSearchChange,
  selectedCategories,
  onToggleCategory,
  spellFilters,
  onSpellFilterChange,
  availableSpellValues,
  hasMagiasSelected,
  featFilters,
  onFeatFilterChange,
  availableFeatTypes,
  hasTalentosSelected,
  isOpen,
  onToggle,
  onOpenTab,
}: VirtualizedSidebarProps) {
  const { category } = useParams<{ category?: string; id?: string }>();
  const { activeTab } = useTabs();
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [expandedEquipGroups, setExpandedEquipGroups] = useState<Record<string, boolean>>({});
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);

  const itemsCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const item of items) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, [items]);

  const hasSpellMetadataAvailable = useMemo(() => {
    if (!hasMagiasSelected) return false;
    return items.some(item => 
      item.category === 'magias' && (
        item.spellLevel !== undefined || 
        item.spellSchool !== undefined || 
        item.spellCastingTime !== undefined || 
        item.spellDuration !== undefined
      )
    );
  }, [items, hasMagiasSelected]);

  const filteredItems = useMemo(() => {
    let result = items;

    if (selectedCategories.length > 0) {
      result = result.filter(item => selectedCategories.includes(item.category));
    }

    if (hasMagiasSelected) {
      if (spellFilters.level) {
        result = result.filter(item => 
          item.category === 'magias' && item.spellLevel?.toString() === spellFilters.level
        );
      }
      if (spellFilters.school) {
        result = result.filter(item => 
          item.category === 'magias' &&
          spellFilters.school &&
          item.spellSchool?.toLowerCase().includes(spellFilters.school.toLowerCase())
        );
      }
      if (spellFilters.castingTime) {
        result = result.filter(item => 
          item.category === 'magias' &&
          spellFilters.castingTime &&
          item.spellCastingTime?.toLowerCase().includes(spellFilters.castingTime.toLowerCase())
        );
      }
      if (spellFilters.duration) {
        result = result.filter(item => 
          item.category === 'magias' &&
          spellFilters.duration &&
          item.spellDuration?.toLowerCase().includes(spellFilters.duration.toLowerCase())
        );
      }
    }

    if (hasTalentosSelected) {
      if (featFilters.type || featFilters.noPrerequisites) {
        result = result.filter(item => {
          if (item.category !== 'talentos') return true;
          if (featFilters.type && item.featType !== featFilters.type) return false;
          if (featFilters.noPrerequisites && item.hasPrerequisites) return false;
          return true;
        });
      }
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(item => 
        (item.title?.toLowerCase().includes(query)) ||
        (item.id?.toLowerCase().includes(query))
      );
    }

    return result;
  }, [items, searchQuery, selectedCategories, spellFilters, hasMagiasSelected, featFilters, hasTalentosSelected]);

  const grouped = useMemo(() => {
    const groups: Array<{ category: string; subcategory?: string; items: ContentItem[] }> = [];
    const byCategory: Record<string, ContentItem[]> = {};
    filteredItems.forEach(item => {
      if (!byCategory[item.category]) byCategory[item.category] = [];
      byCategory[item.category].push(item);
    });

    for (const [cat, catItems] of Object.entries(byCategory)) {
      if (cat === 'equipamentos') {
        const bySub: Record<string, ContentItem[]> = {};
        catItems.forEach(item => {
          const sub = item.subcategory || 'Outros';
          if (!bySub[sub]) bySub[sub] = [];
          bySub[sub].push(item);
        });
        for (const [sub, subItems] of Object.entries(bySub).sort(([a], [b]) => a.localeCompare(b))) {
          groups.push({ category: cat, subcategory: sub, items: subItems.sort((a, b) => a.title.localeCompare(b.title)) });
        }
      } else {
        groups.push({ category: cat, items: catItems.sort((a, b) => a.title.localeCompare(b.title)) });
      }
    }

    return groups.sort((a, b) => {
      if (a.category !== b.category) return a.category.localeCompare(b.category);
      return (a.subcategory || '').localeCompare(b.subcategory || '');
    });
  }, [filteredItems]);

  const layout = useMemo(() => {
    const layoutItems: Array<{ type: 'category' | 'subcategory' | 'item'; category: string; subcategory?: string; item?: ContentItem; index: number }> = [];
    let offset = 0;
    const equipCategoryShown = new Set<string>();

    grouped.forEach(group => {
      if (group.category === 'equipamentos') {
        if (!equipCategoryShown.has(group.category)) {
          layoutItems.push({ type: 'category', category: group.category, index: offset });
          offset++;
          equipCategoryShown.add(group.category);
        }

        const sub = group.subcategory || 'Outros';
        const isExpanded = expandedEquipGroups[sub] === true;
        layoutItems.push({ type: 'subcategory', category: group.category, subcategory: sub, index: offset });
        offset++;

        if (isExpanded) {
          group.items.forEach(item => {
            layoutItems.push({ type: 'item', category: group.category, item, index: offset });
            offset++;
          });
        }
      } else {
        layoutItems.push({ type: 'category', category: group.category, index: offset });
        offset++;

        group.items.forEach(item => {
          layoutItems.push({ type: 'item', category: group.category, item, index: offset });
          offset++;
        });
      }
    });

    return { layoutItems, totalHeight: offset * ITEM_HEIGHT };
  }, [grouped, expandedEquipGroups]);

  const visibleItems = useMemo(() => {
    const startIdx = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
    const endIdx = Math.min(
      layout.layoutItems.length,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + OVERSCAN
    );

    return layout.layoutItems.slice(startIdx, endIdx).map(item => ({
      ...item,
      top: item.index * ITEM_HEIGHT,
    }));
  }, [layout, scrollTop, containerHeight]);

  const handleScroll = useCallback(() => {
    if (scrollContainerRef.current) {
      setScrollTop(scrollContainerRef.current.scrollTop);
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        setContainerHeight(entry.contentRect.height);
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const toggleCategoryFilter = () => {
    setShowCategoryFilter(!showCategoryFilter);
  };

  const closeMobile = () => onToggle();

  const shouldShowItems = searchQuery.trim() || selectedCategories.length > 0;

  const activeFilterCount = selectedCategories.length + 
    (hasMagiasSelected && hasSpellMetadataAvailable ?
      (spellFilters.level ? 1 : 0) + 
      (spellFilters.school ? 1 : 0) + 
      (spellFilters.castingTime ? 1 : 0) + 
      (spellFilters.duration ? 1 : 0) 
      : 0) +
    (hasTalentosSelected ?
      (featFilters.type ? 1 : 0) + 
      (featFilters.noPrerequisites ? 1 : 0)
      : 0);

  return (
    <>
      <button className="mobile-menu-btn" onClick={onToggle} aria-label="Toggle menu">
        ☰
      </button>
      {isOpen && <div className="sidebar-overlay" onClick={onToggle} aria-hidden="true" />}
      {isOpen && (
        <button className="sidebar-close-btn" onClick={onToggle} aria-label="Fechar sidebar" title="Fechar sidebar">
          ▶
        </button>
      )}
      <aside className={`sidebar ${isOpen ? '' : 'closed'}`}>
        <div className="sidebar-controls">
          <div className="search-container">
            <div className="search-wrapper">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar regras..."
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                className="search-input"
              />
              {searchQuery && (
                <button 
                  className="clear-search" 
                  onClick={() => onSearchChange('')}
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
                  const itemCount = itemsCountByCategory[category] || 0;
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

              {hasMagiasSelected && hasSpellMetadataAvailable && (
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

              {hasTalentosSelected && availableFeatTypes.length > 0 && (
                <div className="feat-filters">
                  <h4>Filtros de Talentos</h4>
                  
                  <div className="filter-group">
                    <label>Tipo</label>
                    <select 
                      value={featFilters.type || ''}
                      onChange={(e) => onFeatFilterChange('type', e.target.value)}
                    >
                      <option value="">Todos</option>
                      {availableFeatTypes.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>

                  <div className="filter-group filter-checkbox">
                    <label>
                      <input
                        type="checkbox"
                        checked={!!featFilters.noPrerequisites}
                        onChange={(e) => onFeatFilterChange('noPrerequisites', e.target.checked)}
                      />
                      Sem pré-requisitos
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {shouldShowItems && (
          <nav 
            className="sidebar-nav sidebar-nav-virtualized"
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            <div style={{ height: layout.totalHeight, position: 'relative' }}>
              {visibleItems.map((layoutItem) => {
                if (layoutItem.type === 'category') {
                  const group = grouped.find(g => g.category === layoutItem.category && !g.subcategory);
                  if (!group) {
                    const firstGroup = grouped.find(g => g.category === layoutItem.category);
                    if (!firstGroup) return null;
                  }

                  return (
                    <div 
                      key={`cat-${layoutItem.category}`}
                      className={`nav-category ${category === layoutItem.category ? 'active' : ''}`}
                      style={{
                        position: 'absolute',
                        top: layoutItem.top,
                        left: 0,
                        right: 0,
                        height: ITEM_HEIGHT,
                      }}
                    >
                      <h3 className="nav-category-title">
                        <span className="category-icon">{getCategoryIcon(layoutItem.category)}</span>
                        {formatCategoryName(layoutItem.category)}
                      </h3>
                    </div>
                  );
                }

                if (layoutItem.type === 'subcategory') {
                  const sub = layoutItem.subcategory || '';
                  const isExpanded = expandedEquipGroups[sub] === true;
                  const subItems = grouped.find(g => g.subcategory === sub)?.items || [];
                  return (
                    <div
                      key={`sub-${sub}`}
                      className="nav-subcategory"
                      style={{
                        position: 'absolute',
                        top: layoutItem.top,
                        left: 0,
                        right: 0,
                        height: ITEM_HEIGHT,
                      }}
                    >
                      <button
                        className="nav-subcategory-btn"
                        onClick={() => {
                          setExpandedEquipGroups(prev => ({ ...prev, [sub]: !prev[sub] }));
                        }}
                      >
                        <span className="sub-chevron">{isExpanded ? '▼' : '▶'}</span>
                        <span className="sub-name">{sub}</span>
                        <span className="sub-count">({subItems.length})</span>
                      </button>
                    </div>
                  );
                }

                if (!layoutItem.item) return null;

                const item = layoutItem.item;
                const tabId = item.subcategory
                  ? `${item.category}/${item.subcategory}/${item.id}`
                  : `${item.category}/${item.id}`;
                const isActive = activeTab === tabId;
                return (
                  <div
                    key={`item-${item.id}`}
                    style={{
                      position: 'absolute',
                      top: layoutItem.top,
                      left: 0,
                      right: 0,
                      height: ITEM_HEIGHT,
                    }}
                  >
                    <button
                      className={`nav-item ${isActive ? 'active' : ''}`}
                      onClick={() => {
                        onOpenTab({ id: tabId, category: item.category, itemId: item.id, title: item.title });
                        closeMobile();
                      }}
                      aria-current={isActive ? 'page' : undefined}
                    >
                      {highlightText(item.title, searchQuery)}
                      {item.category === 'magias' && item.spellLevel !== undefined && (
                        <span className="spell-level-indicator"> (Nv.{item.spellLevel})</span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </nav>
        )}
      </aside>
    </>
  );
}
