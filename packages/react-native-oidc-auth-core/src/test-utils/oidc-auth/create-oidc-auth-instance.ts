import {OidcAuthData} from '@/oidc-auth/interface/oidc-auth-data';
import {
  createAccessToken,
  createIdToken,
  createRefreshToken,
} from '@/test-utils/oidc-auth/tokens';
import {StorageFake} from '@/test-utils/oidc-auth/storage-fake';
import {AppAuthFake} from '@/test-utils/oidc-auth/app-auth-fake';
import {DateTimeFake} from '@/test-utils/date-time-fake';
import {ProcessFake} from '@/test-utils/process-fake';
import {OidcAuth} from '@/oidc-auth/oidc-auth';
import {DateTime} from 'luxon';
import {AuthConfiguration} from '@/app-auth/interface/auth-configuration';
import {LogoutConfiguration, OidcConfiguration} from '@/app-auth/interface';

const config: OidcConfiguration = {
  clientId: 'testClientId',
  issuer: 'testIssuer',
  scopes: ['openid'],
  redirectUrl: 'testRedirectUrl',
  postLogoutRedirectUrl: 'postLogoutRedirectUrl',
  registrationPageEndpoint: 'registrationPageEndpoint',
};

const now = DateTime.now();

export type OidcAuthInstanceProps = {
  customAccessToken?: string;
  customRefreshToken?: string;
  customIdToken?: string;
  customStorageData?: OidcAuthData;
};

export function createOidcAuthInstance({
  customAccessToken,
  customRefreshToken,
  customIdToken,
  customStorageData,
}: OidcAuthInstanceProps = {}) {
  const accessToken = customAccessToken || createAccessToken().accessToken;
  const refreshToken = customRefreshToken || createRefreshToken().refreshToken;
  const idToken = customIdToken || createIdToken().idToken;

  const storage = new StorageFake(customStorageData);
  const appAuth = new AppAuthFake(accessToken, refreshToken, idToken);
  const dateTimeFake = new DateTimeFake(now.toMillis());
  const process = new ProcessFake(dateTimeFake);

  return {
    oidcAuth: new OidcAuth(config, storage, appAuth, dateTimeFake, process),
    storage,
    appAuth,
    process,
  };
}

export function createAccessTokenExpired() {
  const exp = now.minus({second: 1}).toUTC().toSeconds();
  const iat = now.toUTC().toSeconds();
  const {accessToken} = createAccessToken(exp, iat);
  return accessToken;
}

export function createRefreshTokenExpired() {
  const exp = now.minus({second: 1}).toUTC().toSeconds();
  const iat = now.toUTC().toSeconds();
  const {refreshToken} = createRefreshToken(exp, iat);
  return refreshToken;
}
