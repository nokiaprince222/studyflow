import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus } from 'lucide-react';
import { FormEvent, useState } from 'react';
import { createTask, type TaskPriority } from '../api/tasks';

const priorities: Array<{ value: TaskPriority; label: string }> = [
  { value: 'low', label: 'Низкий' },
  { value: 'medium', label: 'Средний' },
  { value: 'high', label: 'Высокий' }
];

export function TaskForm() {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');

  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      setTitle('');
      setDescription('');
      setPriority('medium');
      setDueDate('');
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
      void queryClient.invalidateQueries({ queryKey: ['task-stats'] });
    }
  });

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createMutation.mutate({
      title,
      description,
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null
    });
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <div className="form-grid">
        <label className="field">
          <span>Название</span>
          <input
            required
            minLength={3}
            maxLength={120}
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Например: подготовить доклад"
          />
        </label>

        <label className="field">
          <span>Срок</span>
          <input
            type="datetime-local"
            value={dueDate}
            onChange={(event) => setDueDate(event.target.value)}
          />
        </label>

        <label className="field field-wide">
          <span>Описание</span>
          <textarea
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Кратко: что нужно сделать и где лежат материалы"
          />
        </label>

        <label className="field">
          <span>Приоритет</span>
          <select value={priority} onChange={(event) => setPriority(event.target.value as TaskPriority)}>
            {priorities.map((item) => (
              <option key={item.value} value={item.value}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {createMutation.isError ? <p className="form-error">{createMutation.error.message}</p> : null}

      <button className="primary-button" type="submit" disabled={createMutation.isPending || title.trim().length < 3}>
        <Plus size={18} aria-hidden="true" />
        <span>{createMutation.isPending ? 'Сохраняем' : 'Добавить'}</span>
      </button>
    </form>
  );
}
