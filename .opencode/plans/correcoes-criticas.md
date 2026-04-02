# Correções Críticas - Era da Mana RPG

## 1. SpellFilter.tsx — Componente quebrado

**Arquivo**: `src/components/SpellFilter/SpellFilter.tsx`

**Problema**: Usa `spell.metadata` que não existe em `ContentItem`. A interface `SpellFilters` importada de `spell.ts` tem campos (`classes`, `escolas`) incompatíveis com os dados reais.

**Correção**: Reescrever o componente para usar os campos reais de `ContentItem`:
- `spellLevel`, `spellSchool`, `spellCastingTime`, `spellDuration`
- Novo estado: `{ levels: number[], schools: string[], castingTimes: string[], durations: string[] }`

**Conteúdo completo do arquivo corrigido**:

```tsx
import React, { useMemo } from 'react';
import type { ContentItem } from '../../types/content';
import './SpellFilter.css';

interface SpellFilterState {
  levels: number[];
  schools: string[];
  castingTimes: string[];
  durations: string[];
}

interface SpellFilterProps {
  spells: ContentItem[];
  filters: SpellFilterState;
  onFiltersChange: (filters: SpellFilterState) => void;
}

export function SpellFilter({ spells, filters, onFiltersChange }: SpellFilterProps) {
  const { allLevels, allSchools, allCastingTimes, allDurations } = useMemo(() => {
    const levels = new Set<number>();
    const schools = new Set<string>();
    const castingTimes = new Set<string>();
    const durations = new Set<string>();

    spells.forEach(spell => {
      if (spell.spellLevel !== undefined) levels.add(spell.spellLevel);
      if (spell.spellSchool) schools.add(spell.spellSchool);
      if (spell.spellCastingTime) castingTimes.add(spell.spellCastingTime);
      if (spell.spellDuration) durations.add(spell.spellDuration);
    });

    return {
      allLevels: Array.from(levels).sort((a, b) => a - b),
      allSchools: Array.from(schools).sort(),
      allCastingTimes: Array.from(castingTimes).sort(),
      allDurations: Array.from(durations).sort(),
    };
  }, [spells]);

  const toggleLevel = (level: number) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter(l => l !== level)
      : [...filters.levels, level];
    onFiltersChange({ ...filters, levels: newLevels });
  };

  const toggleSchool = (school: string) => {
    const newSchools = filters.schools.includes(school)
      ? filters.schools.filter(s => s !== school)
      : [...filters.schools, school];
    onFiltersChange({ ...filters, schools: newSchools });
  };

  const toggleCastingTime = (time: string) => {
    const newTimes = filters.castingTimes.includes(time)
      ? filters.castingTimes.filter(t => t !== time)
      : [...filters.castingTimes, time];
    onFiltersChange({ ...filters, castingTimes: newTimes });
  };

  const toggleDuration = (duration: string) => {
    const newDurations = filters.durations.includes(duration)
      ? filters.durations.filter(d => d !== duration)
      : [...filters.durations, duration];
    onFiltersChange({ ...filters, durations: newDurations });
  };

  const clearFilters = () => {
    onFiltersChange({ levels: [], schools: [], castingTimes: [], durations: [] });
  };

  const activeCount = filters.levels.length + filters.schools.length + filters.castingTimes.length + filters.durations.length;

  return (
    <div className="spell-filter">
      <div className="spell-filter-header">
        <h3>Filtros de Magias</h3>
        {activeCount > 0 && (
          <button className="clear-filters-btn" onClick={clearFilters}>
            Limpar ({activeCount})
          </button>
        )}
      </div>

      <div className="spell-filter-grid">
        <div className="filter-section">
          <h4>Nível</h4>
          <div className="filter-chips">
            {allLevels.map(level => (
              <button
                key={level}
                className={`filter-chip ${filters.levels.includes(level) ? 'active' : ''}`}
                onClick={() => toggleLevel(level)}
              >
                {level === 0 ? 'Truque' : `Nível ${level}`}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4>Escola</h4>
          <div className="filter-chips">
            {allSchools.map(school => (
              <button
                key={school}
                className={`filter-chip ${filters.schools.includes(school) ? 'active' : ''}`}
                onClick={() => toggleSchool(school)}
              >
                {school}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4>Tempo de Conjuração</h4>
          <div className="filter-chips">
            {allCastingTimes.map(time => (
              <button
                key={time}
                className={`filter-chip ${filters.castingTimes.includes(time) ? 'active' : ''}`}
                onClick={() => toggleCastingTime(time)}
              >
                {time}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4>Duração</h4>
          <div className="filter-chips">
            {allDurations.map(duration => (
              <button
                key={duration}
                className={`filter-chip ${filters.durations.includes(duration) ? 'active' : ''}`}
                onClick={() => toggleDuration(duration)}
              >
                {duration}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="active-filters-summary">
          <span>Ativos: </span>
          {filters.levels.map(l => (
            <span key={`level-${l}`} className="active-tag" onClick={() => toggleLevel(l)}>
              {l === 0 ? 'Truque' : `Nvl ${l}`} ✕
            </span>
          ))}
          {filters.schools.map(s => (
            <span key={`school-${s}`} className="active-tag" onClick={() => toggleSchool(s)}>
              {s} ✕
            </span>
          ))}
          {filters.castingTimes.map(t => (
            <span key={`time-${t}`} className="active-tag" onClick={() => toggleCastingTime(t)}>
              {t} ✕
            </span>
          ))}
          {filters.durations.map(d => (
            <span key={`duration-${d}`} className="active-tag" onClick={() => toggleDuration(d)}>
              {d} ✕
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## 2. useTaskManager.ts — Importação inexistente

**Arquivo**: `src/features/tasks/useTaskManager.ts`

**Problema**: Importa `../../utils/persistence` que não existe.

**Correção**: Substituir por `localStorage` diretamente.

**Conteúdo completo do arquivo corrigido**:

```ts
import { useEffect, useState, useCallback } from 'react';
import { Task, TaskFilters } from './types';

const STORAGE_KEY = 'task-manager-tasks';

export function useTaskManager() {
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const [filters, setFilters] = useState<TaskFilters>({
    status: 'all',
    priority: 'all',
    search: '',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // Storage full or unavailable
    }
  }, [tasks]);

  const addTask = useCallback((task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
    };
    setTasks(prev => [...prev, newTask]);
  }, []);

  const updateTask = useCallback((id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => {
    setTasks(prev => prev.map(task =>
      task.id === id
        ? { ...task, ...updates, updatedAt: new Date().toISOString() }
        : task
    ));
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks(prev => prev.filter(task => task.id !== id));
  }, []);

  const filteredTasks = tasks.filter(task => {
    if (filters.status !== 'all' && task.status !== filters.status) return false;
    if (filters.priority !== 'all' && task.priority !== filters.priority) return false;
    if (filters.search && !task.title.toLowerCase().includes(filters.search.toLowerCase()) &&
        !task.description?.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    doing: tasks.filter(t => t.status === 'doing').length,
    done: tasks.filter(t => t.status === 'done').length,
  };

  return {
    tasks: filteredTasks,
    allTasks: tasks,
    loading,
    filters,
    setFilters,
    addTask,
    updateTask,
    deleteTask,
    stats,
  };
}
```

---

## 3. Sidebar.tsx — Categorias em inglês vs português

**Arquivo**: `src/components/Sidebar/Sidebar.tsx`

**Problema**: `CATEGORY_ICONS` usa chaves em inglês mas as pastas reais estão em português.

**Correção**: Substituir o objeto `CATEGORY_ICONS` (linhas 7-16):

```ts
// ANTES (linhas 7-16):
const CATEGORY_ICONS: Record<string, string> = {
  'races': '🧝',
  'classes': '⚔️',
  'magias': '✨',
  'feats': '📜',
  'skills': '🎯',
  'equipment': '🛡️',
  'conditions': '⚠️',
  'rules': '📖',
};

// DEPOIS:
const CATEGORY_ICONS: Record<string, string> = {
  'raças': '🧝',
  'classes': '⚔️',
  'magias': '✨',
  'talentos': '📜',
  'perícias': '🎯',
  'equipamentos': '🛡️',
  'condições': '⚠️',
  'regras': '📖',
};
```

---

## 4. SpellFilters duplicado

**Arquivo**: `src/types/spell.ts`

**Problema**: Interface `SpellFilters` duplicada com estrutura diferente em `spell.ts` e `content.ts`.

**Correção**: Remover `SpellFilters` de `spell.ts`. O arquivo `spell.ts` deve conter apenas:

```ts
export interface SpellClass {
  nome: string;
  nivel: number;
}

export interface SpellMetadata {
  escola: string;
  escolaSubtipo?: string;
  classes: SpellClass[];
  tempoConjuracao?: string;
  alcance?: string;
  duracao?: string;
  resistencia?: string;
  componentes?: string;
  area?: string;
}
```

---

## 5. highlightText.tsx — Regex injection

**Arquivo**: `src/utils/highlightText.tsx`

**Problema**: `new RegExp(\`(${highlight})\`, 'gi')` quebra com caracteres especiais.

**Correção**: Adicionar escape de regex:

```tsx
import React from 'react';

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function highlightText(text: string, highlight: string): React.ReactNode {
  if (!highlight.trim()) return text;
  const escaped = escapeRegExp(highlight);
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));
  return (
    <>
      {parts.map((part, i) => 
        part.toLowerCase() === highlight.toLowerCase() 
          ? <mark key={i} className="search-highlight">{part}</mark> 
          : part
      )}
    </>
  );
}
```

---

## 6. App.tsx — CrossRef com window.location.hash

**Arquivo**: `src/App.tsx`

**Problema**: Usa `window.location.hash` + evento global de click em vez de `useNavigate`.

**Correção**: Substituir o `handleCrossRefClick` e o `useEffect` associado (linhas 60-77):

```ts
// ANTES (linhas 60-77):
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

// DEPOIS:
const navigate = useNavigate();
const handleCrossRefClick = useCallback((e: MouseEvent) => {
  const target = e.target as HTMLElement;
  if (target.classList.contains('cross-ref')) {
    e.preventDefault();
    const refTarget = target.getAttribute('data-target');
    if (refTarget) {
      const resolved = resolveCrossRef(refTarget, allItems);
      if (resolved) {
        navigate(`/${resolved.category}/${resolved.id}`);
      }
    }
  }
}, [allItems, navigate]);

useEffect(() => {
  document.addEventListener('click', handleCrossRefClick);
  return () => document.removeEventListener('click', handleCrossRefClick);
}, [handleCrossRefClick]);
```

E adicionar `useNavigate` ao import do `react-router-dom` (já está importado, mas precisa ser usado dentro de `AppContent`).

---

## 7. Arquivos mortos para remover

- `src/components/Sidebar/Sidebarbackup.tsx` — backup não usado
- `src/features/tasks/` — módulo sem UI que o referencia (useTaskManager.ts e types.ts)
- `src/types/spell.ts` — tipos duplicados (manter apenas SpellClass e SpellMetadata, remover SpellFilters)

---

## Resumo das mudanças

| # | Arquivo | Tipo | Prioridade |
|---|---------|------|------------|
| 1 | `SpellFilter.tsx` | Reescrever | Alta |
| 2 | `useTaskManager.ts` | Corrigir import | Alta |
| 3 | `Sidebar.tsx` | Corrigir chaves | Alta |
| 4 | `spell.ts` | Remover duplicata | Alta |
| 5 | `highlightText.tsx` | Adicionar escape | Alta |
| 6 | `App.tsx` | Usar useNavigate | Alta |
| 7 | `Sidebarbackup.tsx`, `features/tasks/` | Deletar | Média |
