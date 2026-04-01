import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFavorites } from '../../contexts/FavoritesContext';
import type { ContentItem } from '../../types/content';
import './FavoritesPanel.css';

interface FavoritesPanelProps {
  allItems: ContentItem[];
  isOpen: boolean;
  onClose: () => void;
}

export function FavoritesPanel({ allItems, isOpen, onClose }: FavoritesPanelProps) {
  const { favorites, removeFavorite } = useFavorites();
  const navigate = useNavigate();
  const [localFavorites, setLocalFavorites] = useState<ContentItem[]>([]);

  useEffect(() => {
    const items = allItems.filter(item => favorites.includes(item.id));
    setLocalFavorites(items.sort((a, b) => a.title.localeCompare(b.title)));
  }, [favorites, allItems]);

  const handleNavigate = useCallback((item: ContentItem) => {
    navigate(`/${item.category}/${item.id}`);
    onClose();
  }, [navigate, onClose]);

  const handleRemove = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    removeFavorite(id);
  }, [removeFavorite]);

  if (!isOpen) return null;

  return (
    <div className="favorites-panel-overlay" onClick={onClose}>
      <div className="favorites-panel" onClick={e => e.stopPropagation()}>
        <div className="favorites-header">
          <h2>⭐ Favoritos</h2>
          <button className="close-btn" onClick={onClose} aria-label="Fechar">✕</button>
        </div>
        
        <div className="favorites-list">
          {localFavorites.length === 0 ? (
            <p className="no-favorites">
              Nenhum favorito ainda.<br />
              Clique na estrela ☆ em qualquer página para salvar.
            </p>
          ) : (
            localFavorites.map(item => (
              <div
                key={item.id}
                className="favorite-item"
                onClick={() => handleNavigate(item)}
                role="button"
                tabIndex={0}
              >
                <div className="favorite-info">
                  <span className="favorite-title">{item.title}</span>
                  <span className="favorite-category">{item.category}</span>
                </div>
                <button
                  className="remove-favorite-btn"
                  onClick={(e) => handleRemove(e, item.id)}
                  aria-label="Remover dos favoritos"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
