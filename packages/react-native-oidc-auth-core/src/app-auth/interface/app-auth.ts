import {User} from '@/oidc-auth/interface/user';
import {AuthorizeResult} from '@/app-auth/interface/authorize-result';
import {AuthConfiguration} from '@/app-auth/interface/auth-configuration';
import {EndSessionConfiguration} from '@/app-auth/interface/end-session-configuration';
import {RefreshResult} from '@/app-auth/interface/refresh-result';
import {LogoutConfiguration} from '@/app-auth/interface/logout-configuration';
import {RefreshConfiguration} from '@/app-auth/interface/refresh-configuration';
import {UserInfoConfiguration} from '@/app-auth/interface/user-info-configuration';

export interface IAppAuth {
  authorize(config: AuthConfiguration): Promise<AuthorizeResult>;

  logout(
    config: EndSessionConfiguration,
    logoutConfig: LogoutConfiguration,
  ): Promise<void>;

  refresh(
    config: AuthConfiguration,
    refreshConfig: RefreshConfiguration,
  ): Promise<RefreshResult>;

  getUserInfo(config: UserInfoConfiguration): Promise<User>;

  register(
    config: AuthConfiguration,
    registrationPageEndpoint: string,
  ): Promise<AuthorizeResult>;
}
