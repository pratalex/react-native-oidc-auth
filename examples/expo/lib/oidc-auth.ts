import {
  OIDC_CLIENT_ID,
  OIDC_REALM,
  OIDC_REDIRECT_URI,
  OIDC_URL,
} from '@/constants/keycloak';
import {tracingLog} from '@/lib/logs';
import {
  createOidcAuth,
  OidcConfiguration,
  setTracingLogger,
} from 'react-native-oidc-auth-expo';

let config: OidcConfiguration = {
  issuer: `${OIDC_URL}/realms/${OIDC_REALM}`,
  clientId: OIDC_CLIENT_ID || '',
  redirectUrl: OIDC_REDIRECT_URI || '',
  postLogoutRedirectUrl: OIDC_REDIRECT_URI || '',
  scopes: ['openid', 'profile'],
  // Experimental: Keycloak example
  // registrationPageEndpoint: `${issuer}/protocol/openid-connect/registrations`,
};
tracingLog.info(`[KEYCLOAK] config ${JSON.stringify(config)}`);

setTracingLogger(tracingLog);
export const expoKeycloak = createOidcAuth(config);
