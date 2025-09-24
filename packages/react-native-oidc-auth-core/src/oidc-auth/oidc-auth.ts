import {tracingLog} from '@/logs';
import {jwtDecode} from 'jwt-decode';
import {AccessToken} from '@/oidc-auth/interface/access-token';
import {JwtToken} from '@/oidc-auth/interface/jwt-token';
import {TinyEmitter as EventEmitter} from 'tiny-emitter';
import {EventState} from '@/oidc-auth/enum/event-state';
import {IKeychainStorage, IOidcAuth} from '@/oidc-auth/interface/oidc-auth';
import {OidcAuthData} from '@/oidc-auth/interface/oidc-auth-data';
import {OauthAccessTokenErrorCode} from '@/oidc-auth/enum/oauth-access-token-error-code';
import {OauthAuthErrorCode} from '@/oidc-auth/enum/oauth-auth-error-code';
import {OauthAuthorizationErrorCode} from '@/oidc-auth/enum/oauth-authorization-error-code';
import {IAppAuth} from '@/app-auth/interface/app-auth';
import {DateTime, IDateTime} from '@/utils/date-time';
import {IProcess, Process} from '@/utils/process';
import {EndSessionConfiguration} from '@/app-auth/interface/end-session-configuration';
import {LogoutConfiguration} from '@/app-auth/interface/logout-configuration';
import {OidcConfiguration} from '@/app-auth/interface/oidc-configuration';

export class OidcAuth implements IOidcAuth {
  private _accessToken: string | null = null;
  private accessTokenParsed: AccessToken | null = null;
  private idToken: string | null = null;
  private refreshToken: string | null = null;
  private authenticated: boolean = false;
  private tokenTimeoutHandle: NodeJS.Timeout | null = null;
  private timeSkew: number | null = null;
  private readonly stateChangedEvent = new EventEmitter();
  private readonly date: IDateTime;
  private readonly process: IProcess;

  constructor(
    private readonly config: OidcConfiguration,
    private readonly storage: IKeychainStorage,
    private readonly appAuth: IAppAuth,
    date?: IDateTime,
    process?: IProcess,
  ) {
    if (config.issuer == null) throw new Error('Issuer should not be null');
    this.date = date || new DateTime();
    this.process = process || new Process();
  }

  get accessToken() {
    return this._accessToken;
  }

  set accessToken(token) {
    this._accessToken = token;
  }

  /**
   * Checks if the user is authenticated.
   *
   * @returns {Boolean} - Returns true if the user is authenticated, false otherwise.
   */
  isAuthenticated(): boolean {
    return this.authenticated;
  }

  /**
   * Initializes the state of the application by retrieving data from storage and setting the appropriate tokens.
   *
   * @async
   * @returns {Promise<void>} A promise that resolves when the state has been initialized.
   */
  async initState(): Promise<void> {
    const state = await this.storage.get();
    if (state) {
      tracingLog.debug('[OIDC-AUTH] Restoring state from storage');
      this.timeSkew = state.timeSkew;
      this.setToken(state.accessToken, state.refreshToken, state.idToken);
    } else {
      tracingLog.debug('[OIDC-AUTH] No state found in storage');
    }

    this.emitStateChanged(EventState.INIT_COMPLETED);
  }

  /**
   * Emits the 'onStateChanged' event with the specified arguments.
   *
   * @private
   * @param {...any} arg - The arguments to pass to the event handler.
   * @return {void}
   */
  private emitStateChanged(...arg: any[]): void {
    if (arg && arg.length > 0) {
      tracingLog.debug(`[OIDC-AUTH] Emitting state change: ${arg[0]}`);
    } else {
      tracingLog.debug('[OIDC-AUTH] Emitting state change with no args');
    }
    this.stateChangedEvent.emit('onStateChanged', arg);
  }

  /**
   * Adds an event listener for state change events.
   *
   * @param {function} callback - The callback function to handle state change events.
   * @returns {function} - A function to remove the event listener.
   */
  onStateChanged(callback: (state: EventState) => void): () => void {
    const handleCallback = (arg: [state: EventState]) =>
      arg.length >= 1 && callback(arg[0]);

    this.stateChangedEvent.on('onStateChanged', handleCallback);

    return () => this.stateChangedEvent.off('onStateChanged', handleCallback);
  }

  /**
   * Sets the token information for authentication.
   *
   * @param {string} token - The access token.
   * @param {string} refreshToken - The refresh token.
   * @param {string} idToken - The id token.
   * @param {number} timeLocal - The local time in milliseconds.
   */
  private setToken(
    token?: string,
    refreshToken?: string,
    idToken?: string,
    timeLocal?: number,
  ) {
    tracingLog.debug('[OIDC-AUTH] setToken called');
    this.clearTokenTimeoutIfExists();
    this.updateSecondaryTokens(refreshToken, idToken);

    if (token) {
      tracingLog.debug('[OIDC-AUTH] Applying access token');
      this.applyAccessToken(token, timeLocal);
    } else {
      tracingLog.debug(
        '[OIDC-AUTH] Resetting tokens (no access token provided)',
      );
      this.resetTokensAndAuth();
    }
  }

  /**
   * Clear any existing token expiration timeout
   */
  private clearTokenTimeoutIfExists(): void {
    if (this.tokenTimeoutHandle) {
      clearTimeout(this.tokenTimeoutHandle);
      this.tokenTimeoutHandle = null;
      tracingLog.debug('[OIDC-AUTH] Cleared existing token timeout handle');
    }
  }

  /**
   * Update refresh and id tokens
   */
  private updateSecondaryTokens(refreshToken?: string, idToken?: string): void {
    this.refreshToken = refreshToken ? refreshToken : null;
    this.idToken = idToken ? idToken : null;
    tracingLog.debug(
      '[OIDC-AUTH] Updated secondary tokens (refresh/id tokens set)',
    );
  }

  /**
   * Apply a new access token, parse it, compute skew if provided, and schedule expiry
   */
  private applyAccessToken(token: string, timeLocal?: number): void {
    this.accessToken = token;
    this.accessTokenParsed = jwtDecode(token);

    if (this.accessTokenParsed == null) {
      throw new Error('Parsed token failed');
    }

    tracingLog.debug('[OIDC-AUTH] Access token parsed successfully');
    this.authenticated = true;

    if (timeLocal) {
      this.timeSkew = Math.floor(timeLocal / 1000) - this.accessTokenParsed.iat;
      tracingLog.debug('[OIDC-AUTH] Computed timeSkew from timeLocal');
    }

    this.scheduleExpiryIfPossible();
  }

  /**
   * Schedule token expiration event if timeSkew is known; otherwise warn
   */
  private scheduleExpiryIfPossible(): void {
    if (this.timeSkew != null && this.accessTokenParsed) {
      tracingLog.info(
        '[OIDC-AUTH] Estimated time difference between browser and server is ' +
          this.timeSkew +
          ' seconds',
      );

      const expiresIn =
        (this.accessTokenParsed.exp -
          this.date.getTime() / 1000 +
          this.timeSkew) *
        1000;
      tracingLog.info(
        '[OIDC-AUTH] Token expires in ' + Math.round(expiresIn / 1000) + ' s',
      );

      if (expiresIn <= 0) {
        this.emitStateChanged(EventState.TOKEN_EXPIRED);
      } else {
        this.tokenTimeoutHandle = this.process.setTimeout(
          () => this.emitStateChanged(EventState.TOKEN_EXPIRED),
          expiresIn,
        );
      }
    } else {
      tracingLog.warn('[OIDC-AUTH] Skew time is not defined');
    }
  }

  /**
   * Reset tokens and authentication flags when no access token is provided
   */
  private resetTokensAndAuth(): void {
    this.accessToken = null;
    this.accessTokenParsed = null;
    this.authenticated = false;
    tracingLog.debug('[OIDC-AUTH] Tokens and authentication flags reset');
  }

  /**
   * Compute averaged local time between a start timestamp and current time
   */
  private computeAveragedTimeLocal(startTimeMs: number): number {
    const computed = (startTimeMs + this.date.getTime()) / 2;
    tracingLog.debug('[OIDC-AUTH] Computed averaged timeLocal');
    return computed;
  }

  /**
   * Apply tokens to runtime and persist them to storage
   */
  private async setTokenAndPersist(
    accessToken?: string,
    refreshToken?: string,
    idToken?: string,
    timeLocal?: number,
  ): Promise<void> {
    this.setToken(accessToken, refreshToken, idToken, timeLocal);
    tracingLog.debug('[OIDC-AUTH] Persisting tokens to storage');
    await this.storage.add(
      new OidcAuthData(accessToken!, idToken!, refreshToken!, this.timeSkew!),
    );
  }

  /**
   * Checks if a given token is expired.
   *
   * @param {JwtToken} tokenParsed - The parsed token object.
   * @param {number} [minValidity] - Minimum validity in seconds.
   * @returns {boolean} - True if the token is expired, false otherwise.
   * @throws {string} - Throws an error if minValidity is not a valid number.
   */
  private isTokenExpired<T extends JwtToken>(
    tokenParsed: T,
    minValidity: number,
  ): boolean {
    if (!tokenParsed) {
      return true;
    }

    if (this.timeSkew == null) {
      tracingLog.warn(
        '[OIDC-AUTH] Unable to determine if token is expired as timeskew is not set',
      );
      return true;
    }

    let expiresIn = this.getExpireIn(this.timeSkew, tokenParsed);

    if (minValidity) {
      if (isNaN(minValidity)) {
        throw 'Invalid minValidity';
      }
      expiresIn -= minValidity;
    }

    return expiresIn < 0;
  }

  /**
   * Calculates the time remaining until token expiration.
   *
   * @param {number} timeSkew - The time skew value to consider for calculating expiration.
   * @param {JwtToken} tokenParsed - The parsed token object or null.
   *
   * @return {number} - The time remaining until token expiration in seconds. Returns -1 if tokenParsed is null.
   */
  private getExpireIn<T extends JwtToken>(
    timeSkew: number,
    tokenParsed?: T,
  ): number {
    if (!tokenParsed) {
      return -1;
    }

    return tokenParsed.exp - Math.ceil(this.date.getTime() / 1000) + timeSkew;
  }

  /**
   * Logs in a user using the authentication service.
   *
   * @returns {Promise<boolean>} - Returns a promise that resolves to a boolean indicating whether the login was successful or not.
   * The promise resolves to true if the login was successful, and false otherwise.
   */
  async login(): Promise<boolean> {
    try {
      let timeLocal = this.date.getTime();
      const state = await this.appAuth.authorize(this.config);
      tracingLog.info('[OIDC-AUTH] Login success');

      timeLocal = this.computeAveragedTimeLocal(timeLocal);

      await this.setTokenAndPersist(
        state.accessToken,
        state.refreshToken,
        state.idToken,
        timeLocal,
      );

      if (state.accessToken && state.refreshToken) {
        this.emitStateChanged(EventState.LOGIN_SUCCESS);
      }

      return true;
    } catch (e) {
      this.emitStateChanged(EventState.LOGIN_ERROR);
      tracingLog.error('[OIDC-AUTH] Login failed', e);
      return false;
    }
  }

  /**
   * Display a register page and use the same workflow as login.
   *
   * @returns {Promise<boolean>} - A promise that resolves with the result of the registration process.
   * @experimental the oidc provider doesn't support displaying a registration page natively, so I use the login function and override the authorizationEndpoint with the registration endpoint.
   */
  async register(): Promise<boolean> {
    let timeLocal = this.date.getTime();

    if (this.config.registrationPageEndpoint == null)
      throw new Error('registrationPageEndpoint should not be null.');

    try {
      const result = await this.appAuth.register(
        this.config,
        this.config.registrationPageEndpoint,
      );

      if (result && result.refreshToken) {
        timeLocal = this.computeAveragedTimeLocal(timeLocal);

        await this.setTokenAndPersist(
          result.accessToken,
          result.refreshToken,
          result.idToken,
          timeLocal,
        );

        this.emitStateChanged(EventState.REGISTER_SUCCESS);

        return true;
      }
    } catch (e) {
      this.emitStateChanged(EventState.REGISTER_ERROR);
      tracingLog.error('[OIDC-AUTH] Register failed', e);
    }

    return false;
  }

  /**
   * Logs out the user.
   * If the user is logged in, it will terminate the session and clear the token.
   *
   * @returns {Promise<boolean>} A promise that resolves after the logout process is completed.
   */
  async logout(): Promise<boolean> {
    tracingLog.info('[OIDC-AUTH] Logout');
    if (this.idToken) {
      try {
        await this.appAuth?.logout(
          {
            issuer: this.config.issuer,
            dangerouslyAllowInsecureHttpRequests:
              this.config.dangerouslyAllowInsecureHttpRequests,
          } as EndSessionConfiguration,
          {
            idToken: this.idToken,
            postLogoutRedirectUrl:
              this.config.postLogoutRedirectUrl || this.config.redirectUrl,
          } as LogoutConfiguration,
        );
      } catch (e) {
        tracingLog.error('[OIDC-AUTH] terminate session failed', e);
      }
    }

    try {
      tracingLog.info('[OIDC-AUTH] remove token from storage');
      await this.clearToken();
      this.emitStateChanged(EventState.LOGOUT_SUCCESS);

      return true;
    } catch (e) {
      this.emitStateChanged(EventState.LOGOUT_ERROR, e);
    }

    return false;
  }

  /**
   * Updates the token by refreshing it if necessary.
   *
   * @param minValidity The minimum validity of the token in seconds. Optional. Default value is 5.
   * @returns A boolean indicating whether the token was successfully updated or not.
   * @throws An error if the refresh token is null.
   */
  async updateToken(minValidity = 5) {
    if (!this.refreshToken) {
      throw new Error('Refresh token should not be null.');
    }

    let refreshToken = false;
    if (minValidity === -1) {
      refreshToken = true;
      tracingLog.info('[OIDC-AUTH] Refreshing token: forced refresh');
    } else if (
      !this.accessTokenParsed ||
      this.isTokenExpired(this.accessTokenParsed, minValidity)
    ) {
      refreshToken = true;
      tracingLog.info('[OIDC-AUTH] Refreshing token: token expired');
    }

    if (!refreshToken) {
      tracingLog.debug('[OIDC-AUTH] Skipping token refresh: token still valid');
      return false;
    } else {
      let timeLocal = this.date.getTime();

      try {
        tracingLog.debug('[OIDC-AUTH] Attempting to refresh token');
        const result = await this.appAuth.refresh(this.config, {
          refreshToken: this.refreshToken,
        });

        if (result && result.refreshToken != null) {
          tracingLog.info('[OIDC-AUTH] Token refreshed');

          timeLocal = this.computeAveragedTimeLocal(timeLocal);

          await this.setTokenAndPersist(
            result.accessToken,
            result.refreshToken,
            result.idToken,
            timeLocal,
          );

          this.emitStateChanged(EventState.REFRESH_SUCCESS);

          return true;
        } else {
          tracingLog.warn('[OIDC-AUTH] Failed to refresh token without error');
        }
      } catch (e: any) {
        tracingLog.warn('[OIDC-AUTH] Failed to refresh token', e);

        if (
          e.code === OauthAccessTokenErrorCode.INVALID_GRANT ||
          e.code === OauthAuthErrorCode.TOKEN_REFRESH_FAILED ||
          e.code === OauthAuthErrorCode.AUTHENTICATION_FAILED ||
          e.code === OauthAuthorizationErrorCode.ACCESS_DENIED
        ) {
          await this.clearToken();
        } else {
          tracingLog.warn('[OIDC-AUTH] Error not supported', e);
        }
      }

      this.emitStateChanged(EventState.REFRESH_ERROR);

      return false;
    }
  }

  /**
   * Clears the token by setting it to null and resetting the storage.
   *
   * @returns {Promise<void>} A Promise that resolves when the token is cleared.
   */
  private async clearToken(): Promise<void> {
    tracingLog.debug('[OIDC-AUTH] Clearing tokens and resetting storage');
    this.setToken();
    await this.storage.reset();
  }

  public async getUserInfo() {
    if (this.accessToken == null) throw new Error('No access token');

    return await this.appAuth.getUserInfo({
      accessToken: this.accessToken,
      userInfoEndpoint: `${this.config.issuer}/protocol/openid-connect/userinfo`,
    });
  }
}
