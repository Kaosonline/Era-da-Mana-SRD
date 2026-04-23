import { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

export interface Tab {
  id: string;
  category: string;
  itemId: string;
  title: string;
}

interface TabsContextValue {
  tabs: Tab[];
  activeTab: string | null;
  openTab: (tab: Tab) => void;
  closeTab: (tabId: string) => void;
  setActiveTab: (tabId: string) => void;
  updateActiveTab: (tab: Tab) => void;
  reorderTabs: (fromIndex: number, toIndex: number) => void;
  showLimitWarning: boolean;
}

const TabsContext = createContext<TabsContextValue | null>(null);

const STORAGE_KEY = 'era-da-mana-tabs';
const MAX_TABS = 30;

function loadTabsFromStorage(): { tabs: Tab[]; activeTab: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.tabs && Array.isArray(parsed.tabs)) {
        return {
          tabs: parsed.tabs.slice(0, MAX_TABS),
          activeTab: parsed.activeTab || null,
        };
      }
    }
  } catch {
    // ignore
  }
  return { tabs: [], activeTab: null };
}

function saveTabsToStorage(tabs: Tab[], activeTab: string | null) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ tabs, activeTab }));
  } catch {
    // ignore
  }
}

export function TabsProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const stored = loadTabsFromStorage();
  const [tabs, setTabs] = useState<Tab[]>(stored.tabs);
  const [activeTab, setActiveTabState] = useState<string | null>(stored.activeTab);
  const [showLimitWarning, setShowLimitWarning] = useState(false);
  const navigatingRef = useRef(false);
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    saveTabsToStorage(tabs, activeTab);
  }, [tabs, activeTab]);

  const triggerLimitWarning = useCallback(() => {
    setShowLimitWarning(true);
    if (warningTimeoutRef.current) clearTimeout(warningTimeoutRef.current);
    warningTimeoutRef.current = setTimeout(() => setShowLimitWarning(false), 3000);
  }, []);

  const openTab = useCallback((tab: Tab) => {
    if (navigatingRef.current) return;

    const exists = tabs.find(t => t.id === tab.id);
    if (exists) {
      setActiveTabState(tab.id);
      navigatingRef.current = true;
      navigate(`/${tab.category}/${tab.itemId}`);
      setTimeout(() => { navigatingRef.current = false; }, 100);
      return;
    }

    if (tabs.length >= MAX_TABS) {
      triggerLimitWarning();
      return;
    }

    const activeIndex = tabs.findIndex(t => t.id === activeTab);
    const insertIndex = activeIndex >= 0 ? activeIndex + 1 : tabs.length;

    setTabs(prev => {
      const newTabs = [...prev];
      newTabs.splice(insertIndex, 0, tab);
      return newTabs;
    });
    setActiveTabState(tab.id);
    navigatingRef.current = true;
    navigate(`/${tab.category}/${tab.itemId}`);
    setTimeout(() => { navigatingRef.current = false; }, 100);
  }, [navigate, tabs, activeTab, triggerLimitWarning]);

  const closeTab = useCallback((tabId: string) => {
    if (navigatingRef.current) return;

    const idx = tabs.findIndex(t => t.id === tabId);
    const newTabs = tabs.filter(t => t.id !== tabId);

    if (tabId === activeTab && newTabs.length > 0) {
      const newActive = newTabs[Math.max(0, idx - 1)];
      setTabs(newTabs);
      setActiveTabState(newActive.id);
      navigatingRef.current = true;
      navigate(`/${newActive.category}/${newActive.itemId}`, { replace: true });
      setTimeout(() => { navigatingRef.current = false; }, 100);
    } else if (tabId === activeTab && newTabs.length === 0) {
      setTabs(newTabs);
      setActiveTabState(null);
      navigatingRef.current = true;
      navigate('/', { replace: true });
      setTimeout(() => { navigatingRef.current = false; }, 100);
    } else {
      setTabs(newTabs);
    }
  }, [tabs, activeTab, navigate]);

  const setActiveTab = useCallback((tabId: string) => {
    if (tabId === activeTab || navigatingRef.current) return;

    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setActiveTabState(tabId);
      navigatingRef.current = true;
      navigate(`/${tab.category}/${tab.itemId}`, { replace: true });
      setTimeout(() => { navigatingRef.current = false; }, 100);
    }
  }, [tabs, activeTab, navigate]);

  const updateActiveTab = useCallback((tab: Tab) => {
    if (navigatingRef.current) return;

    if (!activeTab) {
      if (tabs.length >= MAX_TABS) {
        triggerLimitWarning();
        return;
      }
      setTabs(prev => [...prev, tab]);
      setActiveTabState(tab.id);
      navigatingRef.current = true;
      navigate(`/${tab.category}/${tab.itemId}`, { replace: true });
      setTimeout(() => { navigatingRef.current = false; }, 100);
      return;
    }

    setTabs(prev => prev.map(t => t.id === activeTab ? tab : t));
    setActiveTabState(tab.id);
    navigatingRef.current = true;
    navigate(`/${tab.category}/${tab.itemId}`, { replace: true });
    setTimeout(() => { navigatingRef.current = false; }, 100);
  }, [activeTab, navigate, tabs, triggerLimitWarning]);

  const reorderTabs = useCallback((fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex) return;

    setTabs(prev => {
      const newTabs = [...prev];
      const [moved] = newTabs.splice(fromIndex, 1);
      newTabs.splice(toIndex, 0, moved);
      return newTabs;
    });
  }, []);

  return (
    <TabsContext.Provider value={{ tabs, activeTab, openTab, closeTab, setActiveTab, updateActiveTab, reorderTabs, showLimitWarning }}>
      {children}
    </TabsContext.Provider>
  );
}

export function useTabs() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error('useTabs must be used within TabsProvider');
  }
  return context;
}
