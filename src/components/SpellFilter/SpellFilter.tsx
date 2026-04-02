import { useMemo } from 'react';
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
