param(
  [string]$ServerImage = "studyflow-server:local",
  [string]$ClientImage = "studyflow-client:local",
  [string]$ApiUrl = "http://localhost:30040/api",
  [string]$OidcAuthority = "",
  [string]$OidcClientId = "studyflow-client",
  [string]$OidcRedirectUri = "http://localhost:30080",
  [string]$OidcPostLogoutRedirectUri = "http://localhost:30080"
)

$ErrorActionPreference = "Stop"

docker build `
  -t $ServerImage `
  -f apps/server/Dockerfile `
  .

docker build `
  -t $ClientImage `
  -f apps/client/Dockerfile `
  --build-arg VITE_API_URL=$ApiUrl `
  --build-arg VITE_OIDC_AUTHORITY=$OidcAuthority `
  --build-arg VITE_OIDC_CLIENT_ID=$OidcClientId `
  --build-arg VITE_OIDC_REDIRECT_URI=$OidcRedirectUri `
  --build-arg VITE_OIDC_POST_LOGOUT_REDIRECT_URI=$OidcPostLogoutRedirectUri `
  .
