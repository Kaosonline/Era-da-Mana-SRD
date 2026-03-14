
import { useTheme } from '../../contexts/ThemeContext';
import './Header.css';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export function Header({ onMenuToggle }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <header className="header">
      <div className="header-left">
        {onMenuToggle && (
          <button className="header-menu-btn" onClick={onMenuToggle} aria-label="Open menu">
            ☰
          </button>
        )}
        <h1 className="header-title">Era da Mana RPG</h1>
      </div>
      <div className="header-right">
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
