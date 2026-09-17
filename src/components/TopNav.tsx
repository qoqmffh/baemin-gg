import { Link, useLocation } from 'react-router-dom';
import './TopNav.css';

const NAV_ITEMS: { label: string; to: string }[] = [
  { label: 'FIND PLAYER', to: '/?search=1' },
  { label: 'MATCH RECORD', to: '/record' },
  { label: 'LEADERBOARD', to: '/rankings' },
  { label: 'CLUB INFO', to: '/club' },
  { label: 'SIGN UP', to: '/signup' },
];

function SearchIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth={2} />
      <line x1={21} y1={21} x2={16.65} y2={16.65} stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function AccountIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={2} />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" stroke="currentColor" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

export default function TopNav() {
  const location = useLocation();

  return (
    <header className="top-nav">
      <Link to="/" className="top-nav__logo">
        배민.GG
      </Link>
      <nav className="top-nav__menu">
        {NAV_ITEMS.map((item) => {
          const path = item.to.split('?')[0];
          const isActive = location.pathname === path;
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`top-nav__link${isActive ? ' top-nav__link--active' : ''}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="top-nav__icons">
        <Link to="/?search=1" className="top-nav__icon-link" aria-label="선수 검색">
          <SearchIcon />
        </Link>
        <Link to="/signup" className="top-nav__icon-link" aria-label="회원가입">
          <AccountIcon />
        </Link>
      </div>
    </header>
  );
}
