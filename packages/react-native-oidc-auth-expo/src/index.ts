import {
  OidcConfiguration,
  OidcAuth,
  DateTime,
  Process,
} from 'react-native-oidc-auth-core';
import {ExpoStorage} from '@/storage/expo-storage';
import {OidcAuthExpo} from '@/oidc-auth-expo';

export const createOidcAuth = (config: OidcConfiguration) =>
  new OidcAuth(
    config,
    new ExpoStorage(),
    new OidcAuthExpo(config.issuer),
    new DateTime(),
    new Process(),
  );

export {
  resetTracingLogger,
  setTracingLogger,
  OidcAuthProvider,
  useOidcAuth,
  configAxios,
  OidcConfiguration,
} from 'react-native-oidc-auth-core';
