import {AccessToken} from '@/oidc-auth/interface/access-token';
import {DateTime} from 'luxon';
import JWT from 'expo-jwt';
import {SupportedAlgorithms} from 'expo-jwt/dist/types/algorithms';
import {IdToken} from '@/test-utils/oidc-auth/id-token';
import {RefreshToken} from '@/test-utils/oidc-auth/refresh-token';

export function createAccessToken(exp?: number, iat?: number) {
  const accessTokenParsed: AccessToken = {
    exp: exp || DateTime.now().plus({minute: 10}).toUTC().toSeconds(), // Expiration time in 10 minutes
    iat: iat || DateTime.now().toUTC().toSeconds(), // Issued at time is now
    auth_time: DateTime.now().toUTC().toSeconds(),
    jti: '88e25c75-7ea6-4105-8c42-94c3b6163b30',
    iss: 'http://oidc-auth.com/realms/test',
    aud: 'account',
    sub: '4f7ab9fe-2257-4ada-a22f-b357a4ca308c',
    typ: 'Bearer',
    azp: 'clientId',
    sid: '017b98ca-741f-4f0a-af66-4dc7646bba67',
    acr: '0',
    'allowed-origins': ['http://website'],
    realm_access: {
      roles: ['offline_access', 'uma_authorization', 'default-roles-test'],
    },
    resource_access: {
      'test-administration': {
        roles: ['Admin'],
      },
      account: {
        roles: ['manage-account', 'manage-account-links', 'view-profile'],
      },
    },
    scope: 'openid profile email',
    email_verified: true,
    name: 'firstname lastname',
    preferred_username: 'test@test.com',
    given_name: 'firstname',
    locale: 'fr',
    family_name: 'lastname',
    email: 'test@test.com',
  };
  const accessToken = JWT.encode(accessTokenParsed, 'ssh', {
    algorithm: SupportedAlgorithms.HS256,
  });
  return {accessTokenParsed, accessToken};
}

export function createRefreshToken(exp?: number, iat?: number) {
  const refreshTokenParsed: RefreshToken = {
    exp: exp || DateTime.now().plus({minute: 10}).toUTC().toSeconds(), // Expiration time in 10 minutes
    iat: iat || DateTime.now().toUTC().toSeconds(), // Issued at time is now
    jti: '5470dfdb-f5fd-482c-8cc7-12b063167428',
    iss: 'https://oidc-auth.com/realms/test',
    aud: 'https://oidc-auth.com/realms/test',
    sub: '4f7ab9fe-2257-4ada-a22f-b357a4ca308c',
    typ: 'Refresh',
    azp: 'clientId',
    sid: '017b98ca-741f-4f0a-af66-4dc7646bba67',
    scope: 'openid profile acr roles email basic web-origins',
  };
  const refreshToken = JWT.encode(refreshTokenParsed, 'ssh', {
    algorithm: SupportedAlgorithms.HS256,
  });
  return {refreshTokenParsed, refreshToken};
}

export function createIdToken() {
  const idTokenParsed: IdToken = {
    exp: DateTime.now().plus({minute: 10}).toUTC().toSeconds(), // Expiration time in 10 minutes
    iat: DateTime.now().toUTC().toSeconds(), // Issued at time is now
    auth_time: DateTime.now().toUTC().toSeconds(),
    jti: 'ea5fad0a-cd0b-4fbe-b65d-618773e163d7',
    iss: 'https://oidc-auth.com/realms/test',
    aud: 'test-administration',
    sub: '4f7ab9fe-2257-4ada-a22f-b357a4ca308c',
    typ: 'ID',
    azp: 'test-administration',
    nonce: '0a91f771-d348-44ad-b417-69831cc3dc22',
    sid: '017b98ca-741f-4f0a-af66-4dc7646bba67',
    at_hash: 'hCiMMsOPCcnc9LKKIm4c4w',
    acr: '0',
    email_verified: true,
    name: 'Alex Prost',
    preferred_username: 'alex.prost@test.com',
    given_name: 'Alex',
    locale: 'fr',
    family_name: 'Prost',
    email: 'alex.prost@test.com',
  };
  const idToken = JWT.encode(idTokenParsed, 'ssh', {
    algorithm: SupportedAlgorithms.HS256,
  });
  return {idTokenParsed, idToken};
}
