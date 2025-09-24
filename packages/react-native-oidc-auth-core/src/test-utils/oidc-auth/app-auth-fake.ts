import {IAppAuth} from '@/app-auth/interface/app-auth';
import {DateTime} from 'luxon';
import {OauthAccessTokenErrorCode} from '@/oidc-auth/enum/oauth-access-token-error-code';
import {User} from '@/oidc-auth/interface/user';
import {OauthAuthErrorCode} from '@/oidc-auth/enum/oauth-auth-error-code';
import {AuthorizeResult} from '@/app-auth/interface/authorize-result';
import {AuthConfiguration} from '@/app-auth/interface/auth-configuration';
import {EndSessionConfiguration} from '@/app-auth/interface/end-session-configuration';
import {RefreshResult} from '@/app-auth/interface/refresh-result';
import {LogoutConfiguration} from '@/app-auth/interface/logout-configuration';
import {RefreshConfiguration} from '@/app-auth/interface/refresh-configuration';
import {UserInfoConfiguration} from '@/app-auth/interface/user-info-configuration';

export class AppAuthFake implements IAppAuth {
  private authorizeShouldThrowError = false;
  private registerShouldThrowError = false;
  private refreshShouldThrowError:
    | OauthAccessTokenErrorCode
    | OauthAuthErrorCode
    | null = null;

  constructor(
    private accessToken: string,
    private idToken: string,
    private refreshToken: string,
    private userInfo: User | null = null,
  ) {}

  configureAuthorizeToThrowError() {
    this.authorizeShouldThrowError = true;
  }

  configureRefreshShouldThrowError(
    code: OauthAccessTokenErrorCode | OauthAuthErrorCode,
  ) {
    this.refreshShouldThrowError = code;
  }

  configureRegisterToThrowError() {
    this.registerShouldThrowError = true;
  }

  authorize(config: AuthConfiguration): Promise<AuthorizeResult> {
    return this.authorizeShouldThrowError
      ? Promise.reject()
      : Promise.resolve({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          idToken: this.idToken,
          accessTokenExpirationDate: DateTime.now()
            .plus({minute: 5})
            .toISODate(),
          tokenType: 'jwt',
          scopes: [],
          authorizationCode: 'code',
        });
  }

  logout(
    config: EndSessionConfiguration,
    logoutConfig: LogoutConfiguration,
  ): Promise<void> {
    return Promise.resolve();
  }

  refresh(
    config: AuthConfiguration,
    refreshConfig: RefreshConfiguration,
  ): Promise<RefreshResult> {
    return this.refreshShouldThrowError != null
      ? Promise.reject({code: this.refreshShouldThrowError})
      : Promise.resolve({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          idToken: this.idToken,
          accessTokenExpirationDate: DateTime.now()
            .plus({minute: 5})
            .toISODate(),
          tokenType: 'jwt',
          scopes: [],
          authorizationCode: 'code',
        });
  }

  addNextToken(accessToken: string) {
    this.accessToken = accessToken;
  }

  getUserInfo(config: UserInfoConfiguration): Promise<User> {
    if (!this.userInfo) throw new Error('User info is not set');

    return Promise.resolve(this.userInfo);
  }

  register(
    config: AuthConfiguration,
    registrationPageEndpoint: string,
  ): Promise<AuthorizeResult> {
    return this.registerShouldThrowError
      ? Promise.reject()
      : Promise.resolve({
          accessToken: this.accessToken,
          refreshToken: this.refreshToken,
          idToken: this.idToken,
          accessTokenExpirationDate: DateTime.now()
            .plus({minute: 5})
            .toISODate(),
          tokenType: 'jwt',
          scopes: [],
          authorizationCode: 'code',
        });
  }
}
