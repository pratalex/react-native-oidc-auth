import {JwtToken} from '@/oidc-auth/interface/jwt-token';

export interface RefreshToken extends JwtToken {
  scope: string;
}
