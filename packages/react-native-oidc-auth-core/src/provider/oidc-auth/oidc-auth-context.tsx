import {createContext} from 'react';
import {User} from '@/oidc-auth/interface/user';
import {tracingLog} from '@/logs';

export type OidcAuthContextProps = {
  user: User | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  register: () => Promise<void>;
};

const initialContext: OidcAuthContextProps = {
  isAuthenticated: false,
  user: null,
  login: () =>
    Promise.resolve().then(() => {
      tracingLog.warn('[OIDC-AUTH CONTEXT] provider not initialized');
    }),
  logout: () =>
    Promise.resolve().then(() => {
      tracingLog.warn('[OIDC-AUTH CONTEXT] provider not initialized');
    }),
  register: () =>
    Promise.resolve().then(() => {
      tracingLog.warn('[OIDC-AUTH CONTEXT] provider not initialized');
    }),
};

export const OidcAuthContext =
  createContext<OidcAuthContextProps>(initialContext);
