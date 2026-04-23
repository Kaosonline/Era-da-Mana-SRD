import { useState, useRef, Fragment } from 'react';
import { useTabs } from '../../contexts/TabsContext';
import './TabBar.css';

export function TabBar() {
  const { tabs, activeTab, closeTab, setActiveTab, reorderTabs, showLimitWarning } = useTabs();
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragTabRef = useRef<number | null>(null);

  if (tabs.length === 0) {
    return null;
  }

  const handleDragStart = (index: number) => {
    setDragIndex(index);
    dragTabRef.current = index;
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      setOverIndex(index);
    }
  };

  const handleDragEnd = () => {
    if (dragIndex !== null && overIndex !== null && dragIndex !== overIndex) {
      reorderTabs(dragIndex, overIndex);
    }
    setDragIndex(null);
    setOverIndex(null);
    dragTabRef.current = null;
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex !== null && dragIndex !== index) {
      reorderTabs(dragIndex, index);
    }
    setDragIndex(null);
    setOverIndex(null);
    dragTabRef.current = null;
  };

  return (
    <div className="tab-bar" role="tablist" aria-label="Abas abertas">
      {showLimitWarning && (
        <div className="tab-limit-warning" role="alert">
          <span>Limite de 30 abas atingido. Feche uma aba antes de abrir outra.</span>
        </div>
      )}
      <div className="tab-list">
        {tabs.map((tab, index) => (
          <Fragment key={tab.id}>
            {overIndex === index && dragIndex !== null && dragIndex !== overIndex && (
              <div className="tab-drop-placeholder" />
            )}
            <div
              key={tab.id}
              className={`tab-item ${tab.id === activeTab ? 'active' : ''} ${dragIndex === index ? 'dragging' : ''}`}
              role="tab"
              aria-selected={tab.id === activeTab}
              aria-controls="tab-panel"
              onClick={() => setActiveTab(tab.id)}
              tabIndex={0}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDrop={(e) => handleDrop(e, index)}
              onDragEnd={handleDragEnd}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveTab(tab.id);
                }
              }}
            >
              <span className="tab-title">{tab.title}</span>
              <button
                className="tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                aria-label={`Fechar aba ${tab.title}`}
                tabIndex={-1}
              >
                ×
              </button>
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}
