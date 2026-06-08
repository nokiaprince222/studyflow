import { prisma } from '../prisma.js';

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  overdue: number;
  generatedAt: string;
}

interface StatusCountRow {
  status: string;
  _count: {
    _all: number;
  };
}

export function buildTaskStats(statusCounts: StatusCountRow[], overdue: number, generatedAt = new Date()): TaskStats {
  const byStatus = {
    todo: 0,
    in_progress: 0,
    done: 0
  };

  for (const row of statusCounts) {
    if (row.status === 'todo' || row.status === 'in_progress' || row.status === 'done') {
      byStatus[row.status] = row._count._all;
    }
  }

  return {
    total: byStatus.todo + byStatus.in_progress + byStatus.done,
    todo: byStatus.todo,
    inProgress: byStatus.in_progress,
    done: byStatus.done,
    overdue,
    generatedAt: generatedAt.toISOString()
  };
}

export async function getTaskStats() {
  const now = new Date();
  const [statusCounts, overdue] = await Promise.all([
    prisma.task.groupBy({
      by: ['status'],
      _count: {
        _all: true
      }
    }),
    prisma.task.count({
      where: {
        dueDate: {
          lt: now
        },
        status: {
          not: 'done'
        }
      }
    })
  ]);

  return buildTaskStats(statusCounts, overdue, now);
}

