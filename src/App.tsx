import { useState, useEffect } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { Header } from './components/Header/Header';
import { Sidebar } from './components/Sidebar/Sidebar';
import { ContentView } from './components/ContentView/ContentView';
import { loadContent, getCategories, getUniqueSpellValues } from './utils/dataLoader';
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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [spellFilters, setSpellFilters] = useState<SpellFilters>({});
  const [availableSpellValues, setAvailableSpellValues] = useState<{
    schools: string[];
    castingTimes: string[];
    durations: string[];
    levels: number[];
  }>({ schools: [], castingTimes: [], durations: [], levels: [] });

  useEffect(() => {
    const items = loadContent();
    setAllItems(items);
    setCategories(getCategories(items));
    // Extrair valores únicos de magias para os filtros
    if (items.length > 0) {
      const magias = items.filter(item => item.category === 'magias');  // <<< CORRIGIDO: spells -> magias
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

  const selectedItem = allItems.find(i => i.id === selectedId) || null;
  const currentCategory = selectedItem?.category || null;
  const itemsInCategory = currentCategory
    ? allItems
        .filter(i => i.category === currentCategory)
        .sort((a, b) => a.title.localeCompare(b.title))
    : [];
  const currentIndex = selectedId 
    ? itemsInCategory.findIndex(i => i.id === selectedId)
    : -1;
  const previousItem = currentIndex > 0 ? itemsInCategory[currentIndex - 1] : null;
  const nextItem = currentIndex >= 0 && currentIndex < itemsInCategory.length - 1 
    ? itemsInCategory[currentIndex + 1] 
    : null;

  const toggleMobileMenu = () => setMobileMenuOpen(!mobileMenuOpen);

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
  const hasMagiasSelected = selectedCategories.includes('magias');  // <<< CORRIGIDO: spells -> magias

  return (
    <div className="app-srd">
      <Header onMenuToggle={mobileMenuOpen ? undefined : toggleMobileMenu} />
      <div className="app-layout">
        <Sidebar
          categories={categories}
          items={allItems}
          selectedId={selectedId}
          onSelect={(id) => {
            setSelectedId(id);
            setMobileMenuOpen(false);
          }}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          activeCategory={currentCategory}
          selectedCategories={selectedCategories}
          onToggleCategory={toggleCategory}
          spellFilters={spellFilters}
          onSpellFilterChange={updateSpellFilter}
          availableSpellValues={availableSpellValues}
          hasMagiasSelected={hasMagiasSelected}  // <<< CORRIGIDO: hasSpellsSelected -> hasMagiasSelected
        />
        <main className="main-content">
          <ContentView
            item={selectedItem}
            previousItem={previousItem}
            nextItem={nextItem}
            onSelect={setSelectedId}
            onBackToCategory={() => setSelectedId(null)}
            currentCategory={currentCategory}
            allItems={allItems}
            searchQuery={searchQuery}
            selectedCategories={selectedCategories}
            spellFilters={spellFilters}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearAllFilters}
          />
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;