import {EventState} from '@/oidc-auth/enum/event-state';
import {OidcAuthData} from '@/oidc-auth/interface/oidc-auth-data';
import {User} from '@/oidc-auth/interface/user';

export interface IOidcAuth {
  accessToken: string | null;

  initState(): Promise<void>;

  onStateChanged(callback: (state: EventState) => void): any;

  login(): Promise<boolean>;

  updateToken(minValidity?: number): Promise<boolean>;

  logout(): Promise<boolean>;

  isAuthenticated(): boolean;

  register(): Promise<any>;

  getUserInfo(): Promise<User>;
}

export interface IKeychainStorage {
  get(): Promise<OidcAuthData | null>;
  add(state?: OidcAuthData): Promise<void>;
  reset(): Promise<void>;
}
