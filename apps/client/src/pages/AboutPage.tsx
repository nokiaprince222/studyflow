import { Database, Gauge, Route, Server } from 'lucide-react';

const stack = [
  { icon: Route, label: 'Роутинг', value: 'React Router' },
  { icon: Server, label: 'API', value: 'Fastify REST' },
  { icon: Database, label: 'Хранилище', value: 'SQLite + Prisma' },
  { icon: Gauge, label: 'Метрики', value: 'Prometheus' }
];

export function AboutPage() {
  return (
    <section className="page-section">
      <div className="page-header">
        <div>
          <p className="eyebrow">Учебный проект</p>
          <h1>StudyFlow</h1>
        </div>
      </div>

      <div className="stack-grid">
        {stack.map((item) => {
          const Icon = item.icon;

          return (
            <div key={item.label} className="stack-item">
              <Icon size={22} aria-hidden="true" />
              <span>{item.label}</span>
              <strong>{item.value}</strong>
            </div>
          );
        })}
      </div>

      <div className="work-band">
        <div>
          <p className="eyebrow">Дальше</p>
          <h2>OAuth, Redis, RabbitMQ и Kubernetes</h2>
        </div>
        <p>
          Текущий инкремент закрывает базовый контур клиента и сервера. Следующие шаги вынесены в README, чтобы проект
          можно было наращивать по требованиям курса.
        </p>
      </div>
    </section>
  );
}

