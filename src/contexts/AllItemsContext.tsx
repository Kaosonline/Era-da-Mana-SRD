import { createContext, useContext, ReactNode } from 'react';
import type { ContentItem } from '../types/content';

const AllItemsContext = createContext<ContentItem[]>([]);

interface AllItemsProviderProps {
  children: ReactNode;
  items: ContentItem[];
}

export function AllItemsProvider({ children, items }: AllItemsProviderProps) {
  return (
    <AllItemsContext.Provider value={items}>
      {children}
    </AllItemsContext.Provider>
  );
}

export function useAllItems(): ContentItem[] {
  return useContext(AllItemsContext);
}
