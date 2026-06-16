import { Database, Gauge, KeyRound, Route, Server } from 'lucide-react';

const stack = [
  { icon: Route, label: 'Роутинг', value: 'React Router' },
  { icon: Server, label: 'API', value: 'Fastify REST' },
  { icon: Database, label: 'Хранилище', value: 'Postgres + Prisma' },
  { icon: Gauge, label: 'Метрики', value: 'Prometheus + Grafana' },
  { icon: KeyRound, label: 'Auth', value: 'Keycloak OIDC' }
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
          <p className="eyebrow">Инфраструктура</p>
          <h2>Redis, RabbitMQ, Docker и Kubernetes</h2>
        </div>
        <p>
          Проект запускается через Docker Compose, имеет CI-сборку и подготовленные Kubernetes-манифесты с несколькими
          репликами клиента и API.
        </p>
      </div>
    </section>
  );
}
