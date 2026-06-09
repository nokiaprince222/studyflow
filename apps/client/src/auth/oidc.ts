import { User, UserManager, WebStorageStateStore } from 'oidc-client-ts';

const authority = import.meta.env.VITE_OIDC_AUTHORITY ?? '';
const clientId = import.meta.env.VITE_OIDC_CLIENT_ID ?? 'studyflow-client';
const redirectUri = import.meta.env.VITE_OIDC_REDIRECT_URI ?? window.location.origin;
const postLogoutRedirectUri = import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI ?? window.location.origin;

export const oidcEnabled = authority.trim().length > 0;

export const userManager = oidcEnabled
  ? new UserManager({
      authority,
      client_id: clientId,
      redirect_uri: redirectUri,
      post_logout_redirect_uri: postLogoutRedirectUri,
      response_type: 'code',
      scope: 'openid profile email',
      userStore: new WebStorageStateStore({
        store: window.localStorage
      })
    })
  : null;

export function isCallbackUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.has('code') && params.has('state');
}

export async function completeSignIn() {
  if (!userManager || !isCallbackUrl()) {
    return null;
  }

  const user = await userManager.signinRedirectCallback();
  window.history.replaceState({}, document.title, window.location.pathname || '/');
  return user;
}

export async function getCurrentUser() {
  return userManager?.getUser() ?? null;
}

export function isUsableUser(user: User | null) {
  return Boolean(user && !user.expired && user.access_token);
}

export async function getAccessToken() {
  const user = await getCurrentUser();
  return isUsableUser(user) ? user?.access_token : null;
}

export async function signIn() {
  await userManager?.signinRedirect();
}

export async function signOut() {
  await userManager?.signoutRedirect();
}

