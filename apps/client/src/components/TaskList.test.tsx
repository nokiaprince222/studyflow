import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type { PropsWithChildren } from 'react';
import type { Task } from '../api/tasks';
import { TaskList } from './TaskList';

const task: Task = {
  id: 'task_1',
  title: 'Подготовить лабораторную',
  description: 'Собрать первый full-stack инкремент',
  status: 'in_progress',
  priority: 'high',
  dueDate: '2026-06-10T12:00:00.000Z',
  overdueNotifiedAt: null,
  completedAt: null,
  createdAt: '2026-06-04T08:00:00.000Z',
  updatedAt: '2026-06-04T08:00:00.000Z'
};

function Providers({ children }: PropsWithChildren) {
  const client = new QueryClient();
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

describe('TaskList', () => {
  it('renders task title and status', () => {
    render(<TaskList tasks={[task]} />, { wrapper: Providers });

    expect(screen.getByText('Подготовить лабораторную')).toBeInTheDocument();
    expect(screen.getByText('В работе')).toBeInTheDocument();
  });
});

