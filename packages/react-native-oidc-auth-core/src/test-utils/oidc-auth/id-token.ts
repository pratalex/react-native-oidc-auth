import {JwtToken} from '@/oidc-auth/interface/jwt-token';

export interface IdToken extends JwtToken {
  auth_time: number;
  nonce: string;
  at_hash: string;
  acr: string;
  email_verified: boolean;
  preferred_username: string;
  email: string;
  name?: string;
  given_name?: string;
  locale?: string;
  family_name?: string;
}
