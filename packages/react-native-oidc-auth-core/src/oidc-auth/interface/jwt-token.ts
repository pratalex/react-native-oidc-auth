export interface JwtToken {
  iss: string;
  sub: string;
  exp: number;
  iat: number;
  jti: string;
  aud: string;
  typ: string;
  azp: string;
  sid: string;
}
