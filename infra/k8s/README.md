# StudyFlow Kubernetes

Local manifests for Minikube, MicroK8s, Docker Desktop Kubernetes, or another local cluster.

The stack contains:

- 2 replicas of the stateless API server
- 2 replicas of the static client
- PostgreSQL as persistent storage
- Redis for cached task statistics
- RabbitMQ for task event processing

Build local images before applying manifests:

```powershell
.\scripts\build-images.ps1
.\scripts\deploy-k8s.ps1
```

Default local endpoints:

- Client: `http://localhost:30080`
- API health: `http://localhost:30040/health`

OpenID Connect is enabled in Docker Compose, where Keycloak is imported automatically. The Kubernetes profile keeps OIDC disabled by default to make local multi-replica deployment independent from public hostname configuration.
