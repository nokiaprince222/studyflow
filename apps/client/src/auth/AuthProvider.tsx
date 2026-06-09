import type { PropsWithChildren } from 'react';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { completeSignIn, getCurrentUser, isUsableUser, oidcEnabled, signIn, signOut, userManager } from './oidc';

interface AuthContextValue {
  enabled: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  userName: string | null;
  login: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function getDisplayName(profile: Record<string, unknown>) {
  return (
    (typeof profile.name === 'string' && profile.name) ||
    (typeof profile.preferred_username === 'string' && profile.preferred_username) ||
    (typeof profile.email === 'string' && profile.email) ||
    null
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const [isLoading, setIsLoading] = useState(oidcEnabled);
  const [isAuthenticated, setIsAuthenticated] = useState(!oidcEnabled);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadUser() {
      if (!oidcEnabled) {
        return;
      }

      try {
        const callbackUser = await completeSignIn();
        const user = callbackUser ?? (await getCurrentUser());

        if (!mounted) {
          return;
        }

        setIsAuthenticated(isUsableUser(user));
        setUserName(user ? getDisplayName(user.profile) : null);
      } catch (error) {
        console.error(error);
        if (mounted) {
          setIsAuthenticated(false);
          setUserName(null);
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadUser();

    const onUserLoaded = () => {
      void loadUser();
    };

    const onUserUnloaded = () => {
      setIsAuthenticated(false);
      setUserName(null);
    };

    userManager?.events.addUserLoaded(onUserLoaded);
    userManager?.events.addUserUnloaded(onUserUnloaded);

    return () => {
      mounted = false;
      userManager?.events.removeUserLoaded(onUserLoaded);
      userManager?.events.removeUserUnloaded(onUserUnloaded);
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      enabled: oidcEnabled,
      isLoading,
      isAuthenticated,
      userName,
      login: signIn,
      logout: signOut
    }),
    [isAuthenticated, isLoading, userName]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }

  return context;
}
