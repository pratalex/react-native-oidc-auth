export class OidcAuthData {
  constructor(
    public accessToken: string,
    public idToken: string,
    public refreshToken: string,
    public timeSkew: number,
  ) {}
}
