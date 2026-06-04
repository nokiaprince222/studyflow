import { createTaskSchema, updateTaskSchema } from './task.js';

describe('task schemas', () => {
  it('normalizes create payload defaults', () => {
    const payload = createTaskSchema.parse({
      title: 'Подготовить отчет'
    });

    expect(payload.status).toBe('todo');
    expect(payload.priority).toBe('medium');
    expect(payload.description).toBe('');
    expect(payload.dueDate).toBeNull();
  });

  it('rejects empty update payload', () => {
    expect(() => updateTaskSchema.parse({})).toThrow();
  });
});

