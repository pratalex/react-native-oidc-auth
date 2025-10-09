import { tracingLog } from './logs';
import {
  createOidcAuth,
  OidcConfiguration,
  setTracingLogger,
} from 'react-native-oidc-auth';
import {
  OIDC_CLIENT_ID,
  OIDC_REALM,
  OIDC_REDIRECT_URI,
  OIDC_URL,
} from '@env';

let issuer = `${OIDC_URL}/realms/${OIDC_REALM}`;
let config: OidcConfiguration = {
  issuer,
  clientId: OIDC_CLIENT_ID || '',
  redirectUrl: OIDC_REDIRECT_URI || '',
  postLogoutRedirectUrl: OIDC_REDIRECT_URI || '',
  scopes: ['openid', 'profile'],
  dangerouslyAllowInsecureHttpRequests: __DEV__,
  // Experimental: Keycloak example
  // registrationPageEndpoint: `${issuer}/protocol/openid-connect/registrations`,
};
tracingLog.info(`[BARE-SAMPLE] config ${JSON.stringify(config)}`);

setTracingLogger(tracingLog);
export const oidcAuth = createOidcAuth(config);
