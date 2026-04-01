import { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ContentView } from './components/ContentView/ContentView';
import { FavoritesPanel } from './components/FavoritesPanel/FavoritesPanel';
import { loadContent, getCategories, getUniqueSpellValues } from './utils/dataLoader';
import { resolveCrossRef } from './utils/crossReferences';
import type { ContentItem } from './types/content';
import './styles/variables.css';
import './styles/global.css';

interface SpellFilters {
  level?: string;
  school?: string;
  castingTime?: string;
  duration?: string;
}

function AppContent() {
  const [allItems, setAllItems] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [spellFilters, setSpellFilters] = useState<SpellFilters>({});
  const [availableSpellValues, setAvailableSpellValues] = useState<{
    schools: string[];
    castingTimes: string[];
    durations: string[];
    levels: number[];
  }>({ schools: [], castingTimes: [], durations: [], levels: [] });
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const items = loadContent();
    setAllItems(items);
    setCategories(getCategories(items));
    if (items.length > 0) {
      const magias = items.filter(item => item.category === 'magias');
      const levels = Array.from(
        new Set(
          magias
            .map(spell => spell.spellLevel)
            .filter((level): level is number => level !== undefined)
        )
      ).sort((a, b) => a - b);

      setAvailableSpellValues({
        schools: getUniqueSpellValues(magias, 'spellSchool'),
        castingTimes: getUniqueSpellValues(magias, 'spellCastingTime'),
        durations: getUniqueSpellValues(magias, 'spellDuration'),
        levels,
      });
    }
  }, []);

  const handleCrossRefClick = useCallback((e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('cross-ref')) {
      e.preventDefault();
      const refTarget = target.getAttribute('data-target');
      if (refTarget) {
        const resolved = resolveCrossRef(refTarget, allItems);
        if (resolved) {
          window.location.hash = `/${resolved.category}/${resolved.id}`;
        }
      }
    }
  }, [allItems]);

  useEffect(() => {
    document.addEventListener('click', handleCrossRefClick);
    return () => document.removeEventListener('click', handleCrossRefClick);
  }, [handleCrossRefClick]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const updateSpellFilter = (key: keyof SpellFilters, value: string) => {
    setSpellFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSpellFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = !!searchQuery || selectedCategories.length > 0 || Object.values(spellFilters).some(v => v);
  const hasMagiasSelected = selectedCategories.includes('magias');

  return (
    <div className="app-srd">
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onFavoritesToggle={() => setFavoritesOpen(true)}
        sidebarOpen={sidebarOpen}
      />
      <div className="app-layout">
        <Sidebar
          categories={categories}
          items={allItems}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          spellFilters={spellFilters}
          onSpellFilterChange={updateSpellFilter}
          availableSpellValues={availableSpellValues}
          hasMagiasSelected={hasMagiasSelected}
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
        />
        <main className="main-content">
          <Routes>
            <Route path="/" element={
              <ContentView
                item={null}
                allItems={allItems}
                searchQuery={searchQuery}
                selectedCategories={selectedCategories}
                spellFilters={spellFilters}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearAllFilters}
              />
            } />
            <Route path="/:category" element={
              <CategoryRoute 
                allItems={allItems} 
                searchQuery={searchQuery}
                selectedCategories={selectedCategories}
                spellFilters={spellFilters}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearAllFilters}
              />
            } />
            <Route path="/:category/:id" element={
              <ContentRoute 
                allItems={allItems} 
                searchQuery={searchQuery}
                selectedCategories={selectedCategories}
                spellFilters={spellFilters}
                hasActiveFilters={hasActiveFilters}
                onClearFilters={clearAllFilters}
              />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
      <FavoritesPanel 
        allItems={allItems}
        isOpen={favoritesOpen}
        onClose={() => setFavoritesOpen(false)}
      />
    </div>
  );
}

function CategoryRoute({ 
  allItems, 
  searchQuery,
  selectedCategories,
  spellFilters,
  hasActiveFilters,
  onClearFilters
}: {
  allItems: ContentItem[];
  searchQuery: string;
  selectedCategories: string[];
  spellFilters: SpellFilters;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  const { category } = useParams();
  const navigate = useNavigate();
  
  const itemsInCategory = allItems
    .filter(i => i.category === category)
    .sort((a, b) => a.title.localeCompare(b.title));

  if (itemsInCategory.length === 0) {
    return <Navigate to="/" replace />;
  }

  return (
    <ContentView
      item={itemsInCategory[0]}
      previousItem={null}
      nextItem={itemsInCategory.length > 1 ? itemsInCategory[1] : null}
      onSelect={(id) => navigate(`/${category}/${id}`)}
      onBackToCategory={() => navigate('/')}
      currentCategory={category || ''}
      allItems={allItems}
      searchQuery={searchQuery}
      selectedCategories={selectedCategories}
      spellFilters={spellFilters}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
    />
  );
}

function ContentRoute({ 
  allItems, 
  searchQuery,
  selectedCategories,
  spellFilters,
  hasActiveFilters,
  onClearFilters
}: {
  allItems: ContentItem[];
  searchQuery: string;
  selectedCategories: string[];
  spellFilters: SpellFilters;
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  const { category, id } = useParams();
  const navigate = useNavigate();
  
  const item = allItems.find(i => i.id === id && i.category === category) || null;
  
  if (!item) {
    return <Navigate to="/" replace />;
  }

  const itemsInCategory = allItems
    .filter(i => i.category === item.category)
    .sort((a, b) => a.title.localeCompare(b.title));
  
  const currentIndex = itemsInCategory.findIndex(i => i.id === item.id);
  const previousItem = currentIndex > 0 ? itemsInCategory[currentIndex - 1] : null;
  const nextItem = currentIndex < itemsInCategory.length - 1 ? itemsInCategory[currentIndex + 1] : null;

  return (
    <ContentView
      item={item}
      previousItem={previousItem}
      nextItem={nextItem}
      onSelect={(newId) => navigate(`/${item.category}/${newId}`)}
      onBackToCategory={() => navigate('/')}
      currentCategory={item.category}
      allItems={allItems}
      searchQuery={searchQuery}
      selectedCategories={selectedCategories}
      spellFilters={spellFilters}
      hasActiveFilters={hasActiveFilters}
      onClearFilters={onClearFilters}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <FavoritesProvider>
          <AppContent />
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
