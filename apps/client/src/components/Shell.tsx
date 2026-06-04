import { BarChart3, ClipboardList, Info, ListChecks } from 'lucide-react';
import type { PropsWithChildren } from 'react';
import { NavLink } from 'react-router-dom';

const navigation = [
  { to: '/', label: 'Обзор', icon: BarChart3 },
  { to: '/tasks', label: 'Задачи', icon: ClipboardList },
  { to: '/about', label: 'Проект', icon: Info }
];

export function Shell({ children }: PropsWithChildren) {
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
          <span>REST + Prisma + PWA</span>
        </div>
      </aside>

      <main className="main-content">{children}</main>
    </div>
  );
}

