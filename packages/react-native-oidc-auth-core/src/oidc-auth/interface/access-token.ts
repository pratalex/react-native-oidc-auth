import {JwtToken} from '@/oidc-auth/interface/jwt-token';

export interface AccessToken extends JwtToken {
  auth_time: number;
  acr: string;
  'allowed-origins': string[];
  realm_access: {
    roles: string[];
  };
  resource_access: {
    [key: string]: {
      roles: string[];
    };
    account: {
      roles: string[];
    };
  };
  scope: string;
  email_verified: boolean;
  name: string;
  preferred_username: string;
  given_name: string;
  family_name: string;
  email: string;
  locale?: string;
}
