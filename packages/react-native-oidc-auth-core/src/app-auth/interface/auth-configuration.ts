import {BaseAuthConfiguration} from '@/app-auth/interface/base-auth-configuration';

export type AuthConfiguration = BaseAuthConfiguration & {
  clientSecret?: string;
  scopes: string[];
  redirectUrl: string;
  clientAuthMethod?: 'basic' | 'post';
  dangerouslyAllowInsecureHttpRequests?: boolean;
  connectionTimeoutSeconds?: number;
  useNonce?: boolean;
  usePKCE?: boolean;
  warmAndPrefetchChrome?: boolean;
  skipCodeExchange?: boolean;
  iosCustomBrowser?: 'safari' | 'chrome' | 'opera' | 'firefox';
  androidAllowCustomBrowsers?: (
    | 'chrome'
    | 'chromeCustomTab'
    | 'firefox'
    | 'firefoxCustomTab'
    | 'samsung'
    | 'samsungCustomTab'
  )[];
  androidTrustedWebActivity?: boolean;
  iosPrefersEphemeralSession?: boolean;
};
