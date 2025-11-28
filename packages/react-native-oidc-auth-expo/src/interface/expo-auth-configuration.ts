import {AuthConfiguration} from 'react-native-oidc-auth-core';
import {AuthSessionRedirectUriOptions} from 'expo-auth-session';

export type ExpoAuthConfiguration = AuthConfiguration & {
  redirectUriOptions?: AuthSessionRedirectUriOptions;
};
