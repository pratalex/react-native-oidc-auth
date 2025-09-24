import React, {PropsWithChildren, useEffect} from 'react';
import {tracingLog} from '@/logs';
import {EventState} from '@/oidc-auth/enum/event-state';
import {User} from '@/oidc-auth/interface/user';
import {IOidcAuth} from '@/oidc-auth/interface/oidc-auth';
import {
  OidcAuthContext,
  OidcAuthContextProps,
} from '@/provider/oidc-auth/oidc-auth-context';

type OidcAuthProviderProps = PropsWithChildren & {
  instance: IOidcAuth;
};

export const OidcAuthProvider: React.FC<OidcAuthProviderProps> = ({
  children,
  instance,
}) => {
  const [isInitializing, setIsInitializing] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<User | null>(null);
  const [isUserFetchSuccess, setUserFetchSuccess] =
    React.useState<boolean>(false);
  const [isUserFetchError, setUserFetchError] = React.useState<boolean>(false);

  useEffect(() => {
    const getUserInfo = async () => {
      let userInfo: User | null = null;
      try {
        userInfo = await instance.getUserInfo();
        setUserFetchSuccess(true);
      } catch (e) {
        setUserFetchError(true);
        tracingLog.error('[OIDC-AUTH PROVIDER] get user info failed', e);
      }

      setUser(userInfo);
    };

    if (isAuthenticated) getUserInfo();
  }, [isAuthenticated, instance]);

  const isLoading =
    isInitializing &&
    (isUserFetchSuccess || isUserFetchError || !isAuthenticated);

  useEffect(() => {
    const subscription = instance.onStateChanged(state => {
      tracingLog.info(`[OIDC-AUTH PROVIDER] state changed: ${state}`);

      if (state === EventState.TOKEN_EXPIRED) {
        instance.updateToken();
      } else if (state === EventState.INIT_COMPLETED) {
        setIsInitializing(true);
      }

      setIsAuthenticated(instance.isAuthenticated());
    });

    tracingLog.debug('[OIDC-AUTH PROVIDER] Initialization provider');

    instance
      .initState()
      .catch(e =>
        tracingLog.error('[OIDC-AUTH PROVIDER] initialization failed', e),
      );

    return subscription;
  }, []);

  const context: OidcAuthContextProps = {
    isAuthenticated,
    user,
    login: async () => {
      const result = await instance.login();
      if (!result) {
        tracingLog.error('[AUTHENTICATION] login failed');
        throw new Error('Login failed');
      }
    },
    logout: async () => {
      const result = await instance.logout();
      if (!result) {
        tracingLog.error('[AUTHENTICATION] logout failed');
        throw new Error('Logout failed');
      }
    },
    register: async () => {
      const result = await instance.register();
      if (!result) {
        tracingLog.error('[AUTHENTICATION] register failed');
        throw new Error('Register failed');
      }
    },
  };

  if (!isLoading) {
    return null;
  }

  return (
    <OidcAuthContext.Provider value={context}>
      {children}
    </OidcAuthContext.Provider>
  );
};
