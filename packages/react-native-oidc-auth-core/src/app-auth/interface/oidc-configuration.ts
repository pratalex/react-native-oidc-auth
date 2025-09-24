import {AuthConfiguration} from '@/app-auth/interface/auth-configuration';
import {LogoutConfiguration} from '@/app-auth/interface/logout-configuration';

export type OidcConfiguration = AuthConfiguration &
  Pick<LogoutConfiguration, 'postLogoutRedirectUrl'> & {
    registrationPageEndpoint?: string;
  };
