param(
  [string]$Namespace = "studyflow",
  [switch]$Wait
)

$ErrorActionPreference = "Stop"

kubectl apply -f infra/k8s/studyflow.yaml

if ($Wait) {
  kubectl rollout status deployment/postgres -n $Namespace
  kubectl rollout status deployment/redis -n $Namespace
  kubectl rollout status deployment/rabbitmq -n $Namespace
  kubectl rollout status deployment/studyflow-server -n $Namespace
  kubectl rollout status deployment/studyflow-client -n $Namespace
}

kubectl get pods,svc -n $Namespace
