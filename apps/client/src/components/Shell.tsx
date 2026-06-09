import { BarChart3, ClipboardList, Info, ListChecks, LogIn, LogOut } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider';

const navigation = [
  { to: '/', label: 'Обзор', icon: BarChart3 },
  { to: '/tasks', label: 'Задачи', icon: ClipboardList },
  { to: '/about', label: 'Проект', icon: Info }
];

export function Shell({ children }: PropsWithChildren) {
  const auth = useAuth();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <img src="/pwa.svg" alt="" className="brand-icon" />
          <div>
            <span className="brand-title">StudyFlow</span>
            <span className="brand-subtitle">учебные задачи</span>
          </div>
        </div>

        <nav className="nav-list" aria-label="Основная навигация">
          {navigation.map((item) => {
            const Icon = item.icon;

            return (
              <NavLink key={item.to} to={item.to} className="nav-link">
                <Icon size={18} aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <ListChecks size={18} aria-hidden="true" />
          <span>{auth.enabled ? auth.userName ?? 'OIDC enabled' : 'REST + Prisma + PWA'}</span>
        </div>

        {auth.enabled ? (
          <button
            className="auth-button"
            type="button"
            onClick={() => {
              void (auth.isAuthenticated ? auth.logout() : auth.login());
            }}
            disabled={auth.isLoading}
          >
            {auth.isAuthenticated ? <LogOut size={18} aria-hidden="true" /> : <LogIn size={18} aria-hidden="true" />}
            <span>{auth.isAuthenticated ? 'Logout' : 'Login'}</span>
          </button>
        ) : null}
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}
