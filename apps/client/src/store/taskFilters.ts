import { create } from 'zustand';
import type { TaskStatus } from '../api/tasks';

export type StatusFilter = 'all' | TaskStatus;

interface TaskFilterState {
  search: string;
  status: StatusFilter;
  setSearch: (value: string) => void;
  setStatus: (value: StatusFilter) => void;
}

export const useTaskFilters = create<TaskFilterState>((set) => ({
  search: '',
  status: 'all',
  setSearch: (search) => set({ search }),
  setStatus: (status) => set({ status })
}));

