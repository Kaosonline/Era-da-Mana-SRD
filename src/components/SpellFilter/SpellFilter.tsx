import React, { useMemo } from 'react';
import type { ContentItem } from '../types/content';
import type { SpellFilters } from '../types/spell';
import './SpellFilter.css';

interface SpellFilterProps {
  spells: ContentItem[];
  filters: SpellFilters;
  onFiltersChange: (filters: SpellFilters) => void;
}

export function SpellFilter({ spells, filters, onFiltersChange }: SpellFilterProps) {
  const { allClasses, allLevels, allEscolas } = useMemo(() => {
    const classes = new Set<string>();
    const levels = new Set<number>();
    const escolas = new Set<string>();

    spells.forEach(spell => {
      if (spell.metadata) {
        const meta = spell.metadata as any;
        meta.classes?.forEach((c: any) => {
          classes.add(c.nome);
          levels.add(c.nivel);
        });
        if (meta.escola) {
          escolas.add(meta.escola);
        }
      }
    });

    return {
      allClasses: Array.from(classes).sort(),
      allLevels: Array.from(levels).sort((a, b) => a - b),
      allEscolas: Array.from(escolas).sort()
    };
  }, [spells]);

  const toggleClass = (className: string) => {
    const newClasses = filters.classes.includes(className)
      ? filters.classes.filter(c => c !== className)
      : [...filters.classes, className];
    onFiltersChange({ ...filters, classes: newClasses });
  };

  const toggleLevel = (level: number) => {
    const newLevels = filters.levels.includes(level)
      ? filters.levels.filter(l => l !== level)
      : [...filters.levels, level];
    onFiltersChange({ ...filters, levels: newLevels });
  };

  const toggleEscola = (escola: string) => {
    const newEscolas = filters.escolas.includes(escola)
      ? filters.escolas.filter(e => e !== escola)
      : [...filters.escolas, escola];
    onFiltersChange({ ...filters, escolas: newEscolas });
  };

  const clearFilters = () => {
    onFiltersChange({ classes: [], levels: [], escolas: [] });
  };

  const activeCount = filters.classes.length + filters.levels.length + filters.escolas.length;

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
          <h4>Classe</h4>
          <div className="filter-chips">
            {allClasses.map(cls => (
              <button
                key={cls}
                className={`filter-chip ${filters.classes.includes(cls) ? 'active' : ''}`}
                onClick={() => toggleClass(cls)}
              >
                {cls}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4>Nível</h4>
          <div className="filter-chips">
            {allLevels.map(level => (
              <button
                key={level}
                className={`filter-chip ${filters.levels.includes(level) ? 'active' : ''}`}
                onClick={() => toggleLevel(level)}
              >
                Nível {level}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-section">
          <h4>Escola</h4>
          <div className="filter-chips">
            {allEscolas.map(escola => (
              <button
                key={escola}
                className={`filter-chip ${filters.escolas.includes(escola) ? 'active' : ''}`}
                onClick={() => toggleEscola(escola)}
              >
                {escola}
              </button>
            ))}
          </div>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="active-filters-summary">
          <span>Ativos: </span>
          {filters.classes.map(c => (
            <span key={`class-${c}`} className="active-tag" onClick={() => toggleClass(c)}>
              {c} ✕
            </span>
          ))}
          {filters.levels.map(l => (
            <span key={`level-${l}`} className="active-tag" onClick={() => toggleLevel(l)}>
              Nvl {l} ✕
            </span>
          ))}
          {filters.escolas.map(e => (
            <span key={`escola-${e}`} className="active-tag" onClick={() => toggleEscola(e)}>
              {e} ✕
            </span>
          ))}
        </div>
      )}
    </div>
  );
}