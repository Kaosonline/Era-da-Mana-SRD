import { useState, useEffect, useMemo } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { FavoritesProvider } from './contexts/FavoritesContext';
import { TabsProvider, useTabs } from './contexts/TabsContext';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ContentView, CategoryListView } from './components/ContentView/ContentView';
import { TabBar } from './components/TabBar/TabBar';
import { FavoritesPanel } from './components/FavoritesPanel/FavoritesPanel';
import { loadContentIndex, getCategories, getUniqueSpellValues, getUniqueFeatTypes } from './utils/dataLoader';
import { ErrorBoundary } from './components/ErrorBoundary';
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
  const { openTab } = useTabs();
  const [allItems, setAllItems] = useState<ContentItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [spellFilters, setSpellFilters] = useState<SpellFilters>({});
  const [featFilters, setFeatFilters] = useState<{ type?: string; noPrerequisites?: boolean }>({});
  const [favoritesOpen, setFavoritesOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 769px)');
    setSidebarOpen(mq.matches);
    const handler = (e: MediaQueryListEvent) => setSidebarOpen(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const items = await loadContentIndex();
        setAllItems(items);
        setCategories(getCategories(items));
      } catch (err) {
        console.error('Erro ao carregar conteúdo:', err);
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category) 
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const updateSpellFilter = (key: keyof SpellFilters, value: string) => {
    // Validação básica para evitar valores inválidos
    const validatedValue = value.trim();
    setSpellFilters(prev => ({ ...prev, [key]: validatedValue || undefined }));
  };

  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSpellFilters({});
    setFeatFilters({});
    setSearchQuery('');
  };

  const hasActiveFilters = useMemo(() =>
    !!searchQuery ||
    selectedCategories.length > 0 ||
    Object.values(spellFilters).some(v => v) ||
    Object.values(featFilters).some(v => v),
    [searchQuery, selectedCategories, spellFilters, featFilters]
  );

  const hasMagiasSelected = useMemo(() =>
    selectedCategories.includes('magias'),
    [selectedCategories]
  );

  const hasTalentosSelected = useMemo(() =>
    selectedCategories.includes('talentos'),
    [selectedCategories]
  );

  const magias = useMemo(() =>
    allItems.filter(item => item.category === 'magias'),
    [allItems]
  );

  const availableSpellValues = useMemo(() => ({
    schools: getUniqueSpellValues(magias, 'spellSchool'),
    castingTimes: getUniqueSpellValues(magias, 'spellCastingTime'),
    durations: getUniqueSpellValues(magias, 'spellDuration'),
    levels: Array.from(
      new Set(
        magias
          .map(spell => spell.spellLevel)
          .filter((level): level is number => level !== undefined)
      )
    ).sort((a, b) => a - b),
  }), [magias]);

  const availableFeatTypes = useMemo(() =>
    getUniqueFeatTypes(allItems),
    [allItems]
  );

  if (loading) {
    return (
      <div className="app-srd" aria-busy="true" aria-live="polite">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
          <p role="status">Carregando conteúdo...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="app-srd" role="alert" aria-live="assertive">
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'red' }}>
          <p>Erro: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app-srd">
      <Header 
        onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
        onFavoritesToggle={() => setFavoritesOpen(true)}
        sidebarOpen={sidebarOpen}
      />
      <div className={`app-layout ${sidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
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
        featFilters={featFilters}
        onFeatFilterChange={(key, value) => {
          const validatedValue = typeof value === 'boolean' ? value : (value?.trim() || undefined);
          setFeatFilters(prev => ({ ...prev, [key]: validatedValue }));
        }}
        availableFeatTypes={availableFeatTypes}
        hasTalentosSelected={hasTalentosSelected}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onOpenTab={openTab}
      />
        <main className="main-content">
          <TabBar />
          <Routes>
            <Route path="/" element={
              <ContentView
                item={null}
                allItems={allItems}
                searchQuery={searchQuery}
                selectedCategories={selectedCategories}
                spellFilters={spellFilters}
                featFilters={featFilters}
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
                featFilters={featFilters}
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
                featFilters={featFilters}
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
  searchQuery: _searchQuery,
  selectedCategories: _selectedCategories,
  spellFilters: _spellFilters,
  featFilters: _featFilters,
  hasActiveFilters: _hasActiveFilters,
  onClearFilters: _onClearFilters
}: {
  allItems: ContentItem[];
  searchQuery: string;
  selectedCategories: string[];
  spellFilters: SpellFilters;
  featFilters?: { type?: string; noPrerequisites?: boolean };
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  const { category } = useParams();
  
  const itemsInCategory = allItems
    .filter(i => i.category === category)
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));

  if (itemsInCategory.length === 0) {
    return <Navigate to="/" replace />;
  }

  return (
    <CategoryListView
      category={category || ''}
      items={itemsInCategory}
    />
  );
}

function ContentRoute({ 
  allItems, 
  searchQuery: _searchQuery2,
  selectedCategories: _selectedCategories2,
  spellFilters: _spellFilters2,
  featFilters: _featFilters2,
  hasActiveFilters: _hasActiveFilters2,
  onClearFilters: _onClearFilters2
}: {
  allItems: ContentItem[];
  searchQuery: string;
  selectedCategories: string[];
  spellFilters: SpellFilters;
  featFilters?: { type?: string; noPrerequisites?: boolean };
  hasActiveFilters: boolean;
  onClearFilters: () => void;
}) {
  const { category, id } = useParams();
  const navigate = useNavigate();
  const { setActiveTab, updateActiveTab } = useTabs();
  
  const normalizeId = (s: string) => s.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
  
  const item = allItems.find(i => 
    i.category === category && normalizeId(i.id) === normalizeId(id || '')
  ) || null;
  
  if (!item) {
    return <Navigate to="/" replace />;
  }

  const tabId = `${item.category}/${item.id}`;

  useEffect(() => {
    setActiveTab(tabId);
  }, [tabId]);

  const itemsInCategory = allItems
    .filter(i => i.category === item.category)
    .sort((a, b) => (a.title || '').localeCompare(b.title || ''));
  
  const currentIndex = itemsInCategory.findIndex(i => i.id === item.id);
  const previousItem = currentIndex > 0 ? itemsInCategory[currentIndex - 1] : null;
  const nextItem = currentIndex < itemsInCategory.length - 1 ? itemsInCategory[currentIndex + 1] : null;

  const handleSelect = (newId: string) => {
    const normalized = normalizeId(newId);
    const targetItem = allItems.find(i => i.category === item.category && normalizeId(i.id) === normalized);
    if (targetItem) {
      updateActiveTab({ id: `${targetItem.category}/${targetItem.id}`, category: targetItem.category, itemId: targetItem.id, title: targetItem.title });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  return (
    <ContentView
      item={item}
      previousItem={previousItem}
      nextItem={nextItem}
      onSelect={handleSelect}
      onBackToCategory={handleBack}
      currentCategory={item.category}
      allItems={allItems}
      searchQuery={_searchQuery2}
      selectedCategories={_selectedCategories2}
      spellFilters={_spellFilters2}
      featFilters={_featFilters2}
      hasActiveFilters={_hasActiveFilters2}
      onClearFilters={_onClearFilters2}
    />
  );
}

function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <FavoritesProvider>
          <ErrorBoundary>
            <TabsProvider>
              <AppContent />
            </TabsProvider>
          </ErrorBoundary>
        </FavoritesProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
