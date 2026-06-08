import { buildTaskStats } from './taskStats.js';

describe('task stats', () => {
  it('builds counters from grouped rows', () => {
    const stats = buildTaskStats(
      [
        { status: 'todo', _count: { _all: 2 } },
        { status: 'in_progress', _count: { _all: 3 } },
        { status: 'done', _count: { _all: 5 } }
      ],
      1,
      new Date('2026-06-08T10:00:00.000Z')
    );

    expect(stats).toEqual({
      total: 10,
      todo: 2,
      inProgress: 3,
      done: 5,
      overdue: 1,
      generatedAt: '2026-06-08T10:00:00.000Z'
    });
  });
});

