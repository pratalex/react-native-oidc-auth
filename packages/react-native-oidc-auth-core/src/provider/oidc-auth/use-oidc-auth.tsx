import {useContext} from 'react';
import {
  OidcAuthContext,
  OidcAuthContextProps,
} from '@/provider/oidc-auth/oidc-auth-context';

export const useOidcAuth = (): OidcAuthContextProps => {
  return useContext(OidcAuthContext);
};
