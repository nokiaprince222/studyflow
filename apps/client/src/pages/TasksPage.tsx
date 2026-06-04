import { useQuery } from '@tanstack/react-query';
import { Search } from 'lucide-react';
import { getTasks, type TaskStatus } from '../api/tasks';
import { TaskForm } from '../components/TaskForm';
import { TaskList } from '../components/TaskList';
import { useTaskFilters, type StatusFilter } from '../store/taskFilters';

const statusOptions: Array<{ value: StatusFilter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'todo', label: 'К выполнению' },
  { value: 'in_progress', label: 'В работе' },
  { value: 'done', label: 'Готово' }
];

export function TasksPage() {
  const { search, status, setSearch, setStatus } = useTaskFilters();
  const queryStatus = status === 'all' ? undefined : (status as TaskStatus);

  const { data: tasks = [], isLoading, isError, error } = useQuery({
    queryKey: ['tasks', queryStatus ?? 'all', search],
    queryFn: () => getTasks({ status: queryStatus, q: search || undefined })
  });

  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Список работ</p>
          <h1>Задачи</h1>
        </div>
      </div>

      <TaskForm />

      <div className="toolbar">
        <label className="search-field">
          <Search size={18} aria-hidden="true" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Поиск по названию или описанию"
          />
        </label>

        <div className="segmented-control" role="tablist" aria-label="Фильтр по статусу">
          {statusOptions.map((item) => (
            <button
              key={item.value}
              type="button"
              className={status === item.value ? 'active' : ''}
              onClick={() => setStatus(item.value)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {isError ? <p className="form-error">{error.message}</p> : null}
      <TaskList tasks={tasks} isLoading={isLoading} />
    </section>
  );
}

