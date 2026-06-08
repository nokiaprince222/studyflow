import { useQuery } from '@tanstack/react-query';
import { ArrowRight, CheckCircle2, Clock4, ListTodo } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getTaskStats } from '../api/tasks';

export function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['task-stats'],
    queryFn: getTaskStats
  });

  const total = stats?.total ?? 0;
  const inProgress = stats?.inProgress ?? 0;
  const done = stats?.done ?? 0;
  const overdue = stats?.overdue ?? 0;

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Учебная нагрузка</p>
          <h1>Обзор задач</h1>
        </div>
        <Link className="secondary-button" to="/tasks">
          <span>Открыть задачи</span>
          <ArrowRight size={18} aria-hidden="true" />
        </Link>
      </div>

      <div className="stats-grid" aria-busy={isLoading}>
        <div className="stat-tile">
          <ListTodo size={22} aria-hidden="true" />
          <span>Всего</span>
          <strong>{total}</strong>
        </div>
        <div className="stat-tile">
          <Clock4 size={22} aria-hidden="true" />
          <span>В работе</span>
          <strong>{inProgress}</strong>
        </div>
        <div className="stat-tile">
          <CheckCircle2 size={22} aria-hidden="true" />
          <span>Готово</span>
          <strong>{done}</strong>
        </div>
        <div className="stat-tile alert">
          <Clock4 size={22} aria-hidden="true" />
          <span>Просрочено</span>
          <strong>{overdue}</strong>
        </div>
      </div>

      <div className="work-band">
        <div>
          <p className="eyebrow">Сегодня</p>
          <h2>Сначала закрываем ближайшие дедлайны</h2>
        </div>
        <p>
          Данные на этой странице приходят с backend API и автоматически обновляются через TanStack Query после
          изменений задач.
        </p>
      </div>
    </section>
  );
}
