import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, Circle, Clock3, Loader2, RotateCcw, Trash2 } from 'lucide-react';
import { deleteTask, updateTask, type Task, type TaskStatus } from '../api/tasks';

interface TaskListProps {
  tasks: Task[];
  isLoading?: boolean;
}

const statusLabels: Record<TaskStatus, string> = {
  todo: 'К выполнению',
  in_progress: 'В работе',
  done: 'Готово'
};

const priorityLabels = {
  low: 'Низкий',
  medium: 'Средний',
  high: 'Высокий'
};

const nextStatus: Record<TaskStatus, TaskStatus> = {
  todo: 'in_progress',
  in_progress: 'done',
  done: 'todo'
};

function formatDate(value: string | null) {
  if (!value) {
    return 'Без срока';
  }

  return new Intl.DateTimeFormat('ru-RU', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(value));
}

function isOverdue(task: Task) {
  return Boolean(task.dueDate && task.status !== 'done' && new Date(task.dueDate) < new Date());
}

export function TaskList({ tasks, isLoading = false }: TaskListProps) {
  const queryClient = useQueryClient();

  const changeStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) => updateTask(id, { status }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: deleteTask,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    }
  });

  if (isLoading) {
    return (
      <div className="empty-state">
        <Loader2 className="spin" size={24} aria-hidden="true" />
        <span>Задачи загружаются</span>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="empty-state">
        <Circle size={24} aria-hidden="true" />
        <span>Список пока пуст</span>
      </div>
    );
  }

  return (
    <div className="task-list">
      {tasks.map((task) => {
        const overdue = isOverdue(task);
        const status = nextStatus[task.status];
        const StatusIcon = task.status === 'done' ? RotateCcw : Check;

        return (
          <article key={task.id} className="task-card">
            <div className="task-main">
              <div className="task-title-row">
                <h2>{task.title}</h2>
                <span className={`status-badge status-${task.status}`}>{statusLabels[task.status]}</span>
              </div>

              {task.description ? <p>{task.description}</p> : null}

              <div className="task-meta">
                <span className={`priority priority-${task.priority}`}>{priorityLabels[task.priority]}</span>
                <span className={overdue ? 'due-date overdue' : 'due-date'}>
                  <Clock3 size={15} aria-hidden="true" />
                  {formatDate(task.dueDate)}
                </span>
              </div>
            </div>

            <div className="task-actions">
              <button
                type="button"
                className="icon-button"
                title="Сменить статус"
                aria-label="Сменить статус"
                onClick={() => changeStatusMutation.mutate({ id: task.id, status })}
              >
                <StatusIcon size={18} aria-hidden="true" />
              </button>
              <button
                type="button"
                className="icon-button danger"
                title="Удалить задачу"
                aria-label="Удалить задачу"
                onClick={() => deleteMutation.mutate(task.id)}
              >
                <Trash2 size={18} aria-hidden="true" />
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}

