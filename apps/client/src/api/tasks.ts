export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type TaskPriority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  overdueNotifiedAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
}

export interface UpdateTaskPayload extends Partial<CreateTaskPayload> {}

export interface TaskFilters {
  status?: TaskStatus;
  q?: string;
}

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  generatedAt: string;
  cache: {
    backend: 'disabled' | 'redis' | 'unavailable';
    hit: boolean;
    ttlSeconds: number;
  };
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000/api';

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    const message = payload?.error?.message ?? 'Ошибка запроса к серверу';
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function getTasks(filters: TaskFilters = {}) {
  const params = new URLSearchParams();

  if (filters.status) {
    params.set('status', filters.status);
  }

  if (filters.q) {
    params.set('q', filters.q);
  }

  const query = params.toString();
  return request<Task[]>(`/tasks${query ? `?${query}` : ''}`);
}

export function getTaskStats() {
  return request<TaskStats>('/tasks/stats');
}

export function createTask(payload: CreateTaskPayload) {
  return request<Task>('/tasks', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export function updateTask(id: string, payload: UpdateTaskPayload) {
  return request<Task>(`/tasks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload)
  });
}

export function deleteTask(id: string) {
  return request<{ ok: true }>(`/tasks/${id}`, {
    method: 'DELETE'
  });
}
