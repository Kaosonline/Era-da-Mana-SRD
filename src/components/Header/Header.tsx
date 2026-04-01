import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

interface HeaderProps {
  onMenuToggle?: () => void;
  onFavoritesToggle?: () => void;
  sidebarOpen?: boolean;
}

export function Header({ onMenuToggle, onFavoritesToggle, sidebarOpen }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-left">
        {onMenuToggle && (
          <button className="header-menu-btn" onClick={onMenuToggle} aria-label="Toggle menu" title={sidebarOpen ? 'Fechar sidebar' : 'Abrir sidebar'}>
            {sidebarOpen ? '◀' : '☰'}
          </button>
        )}
        <h1 className="header-title">Era da Mana RPG</h1>
      </div>
      <div className="header-right">
        {onFavoritesToggle && (
          <button
            className="favorites-toggle"
            onClick={onFavoritesToggle}
            aria-label="Ver favoritos"
            title="Favoritos"
          >
            ⭐
          </button>
        )}
        <button
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} theme`}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
}
