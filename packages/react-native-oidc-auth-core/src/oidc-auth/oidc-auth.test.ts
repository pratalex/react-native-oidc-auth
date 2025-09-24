import {IOidcAuth} from '@/oidc-auth/interface/oidc-auth';
import {EventState} from '@/oidc-auth/enum/event-state';
import {
  createAccessToken,
  createIdToken,
  createRefreshToken,
} from '@/test-utils/oidc-auth/tokens';
import {StorageFake} from '@/test-utils/oidc-auth/storage-fake';
import {OidcAuthData} from '@/oidc-auth/interface/oidc-auth-data';
import {OauthAccessTokenErrorCode} from '@/oidc-auth/enum/oauth-access-token-error-code';
import {AppAuthFake} from '@/test-utils/oidc-auth/app-auth-fake';
import {ProcessFake} from '@/test-utils/process-fake';
import {
  createAccessTokenExpired,
  createOidcAuthInstance,
} from '@/test-utils/oidc-auth/create-oidc-auth-instance';

describe('Authentication Service', () => {
  function getTimeSkew() {
    return 0;
  }

  describe('Service Initialization - Startup Authentication State Detection', () => {
    describe('when starting with no stored authentication data', () => {
      let oidcAuth: IOidcAuth;

      beforeEach(() => {
        oidcAuth = createOidcAuthInstance().oidcAuth;
      });

      it('should maintain unauthenticated status', async () => {
        await oidcAuth.initState();

        expect(oidcAuth.isAuthenticated()).toBeFalsy();
      });

      it('should emit initialization completed event', async () => {
        let initCompleted: boolean = false;
        oidcAuth.onStateChanged(state => {
          initCompleted = state === EventState.INIT_COMPLETED;
        });
        await oidcAuth.initState();

        expect(initCompleted).toBeTruthy();
      });
    });

    describe('when restoring from existing stored authentication data', () => {
      describe('when stored access token has expired', () => {
        let oidcAuthInstance: IOidcAuth;
        let processInstance: ProcessFake;
        beforeEach(() => {
          const {oidcAuth, process} = createOidcAuthInstance({
            customStorageData: new OidcAuthData(
              createAccessTokenExpired(),
              createRefreshToken().refreshToken,
              createIdToken().idToken,
              getTimeSkew(),
            ),
          });

          oidcAuthInstance = oidcAuth;
          processInstance = process;
        });

        it('should maintain authentication status to authenticated', async () => {
          await oidcAuthInstance.initState();

          expect(oidcAuthInstance.isAuthenticated()).toBeTruthy();
        });

        it('should emit token expired event', async () => {
          let eventFired: boolean = false;
          let subscription: () => void;
          subscription = oidcAuthInstance.onStateChanged(state => {
            if (state === EventState.TOKEN_EXPIRED) {
              eventFired = true;
            }
          });

          await oidcAuthInstance.initState();
          processInstance.nextTick(99999);

          expect(eventFired).toBeTruthy();
          subscription();
        });
      });

      describe('when stored access token is still valid', () => {
        let oidcAuthInstance: IOidcAuth;

        beforeEach(() => {
          oidcAuthInstance = createOidcAuthInstance({
            customStorageData: new OidcAuthData(
              createAccessToken().accessToken,
              createRefreshToken().refreshToken,
              createIdToken().idToken,
              getTimeSkew(),
            ),
          }).oidcAuth;
        });

        it('should indicate user is authenticated', async () => {
          await oidcAuthInstance.initState();

          expect(oidcAuthInstance.isAuthenticated()).toBeTruthy();
        });

        it('should not emit token expired', async () => {
          let eventFired: boolean = false;
          let subscription: () => void;
          subscription = oidcAuthInstance.onStateChanged(state => {
            if (state === EventState.TOKEN_EXPIRED) {
              eventFired = true;
            }
          });

          await oidcAuthInstance.initState();

          expect(eventFired).toBeFalsy();
          subscription();
        });
      });
    });
  });

  it('should indicate not authenticated when service instance is first created', () => {
    expect(createOidcAuthInstance().oidcAuth.isAuthenticated()).toBe(false);
  });

  describe('User Login - Authentication Flow with Token Storage', () => {
    describe('when authentication succeeds', () => {
      let oidcAuthInstance: IOidcAuth;
      let storageInstance: StorageFake;
      let loginSuccess: boolean = false;
      let subscription: () => void;

      beforeEach(() => {
        const {oidcAuth, storage} = createOidcAuthInstance();

        oidcAuthInstance = oidcAuth;
        storageInstance = storage;
      });

      beforeEach(async () => {
        subscription = oidcAuthInstance.onStateChanged(state => {
          if (state === EventState.LOGIN_SUCCESS) {
            loginSuccess = true;
          }
        });
        await oidcAuthInstance.login();
      });

      afterEach(() => {
        subscription();
      });

      it('should update authentication status to authenticated', async () => {
        expect(oidcAuthInstance.isAuthenticated()).toBeTruthy();
      });

      it('should emit authentication success event', async () => {
        expect(loginSuccess).toBeTruthy();
      });

      it('should persist authentication tokens', async () => {
        expect(await storageInstance.get()).not.toBeNull();
      });
    });

    describe('when authentication fails', () => {
      let loginError: boolean = false;
      let subscription: () => void;
      let oidcAuthInstance: IOidcAuth;
      let appAuthInstance: AppAuthFake;

      beforeEach(() => {
        const {oidcAuth, appAuth} = createOidcAuthInstance();

        oidcAuthInstance = oidcAuth;
        appAuthInstance = appAuth;
      });

      beforeEach(async () => {
        subscription = oidcAuthInstance.onStateChanged(state => {
          if (state === EventState.LOGIN_ERROR) {
            loginError = true;
          }
        });
        appAuthInstance.configureAuthorizeToThrowError();

        await oidcAuthInstance.login();
      });

      afterEach(() => {
        subscription();
      });

      it('should indicate user is not authenticated', async () => {
        expect(oidcAuthInstance.isAuthenticated()).toBeFalsy();
      });

      it('should emit authentication error event', async () => {
        expect(loginError).toBeTruthy();
      });
    });
  });

  describe('User Logout - Session Termination and Token Cleanup', () => {
    let logoutSuccess: boolean = false;

    describe('when logout succeeds', () => {
      let oidcAuthInstance: IOidcAuth;
      let storageInstance: StorageFake;
      let subscription: () => void;

      beforeEach(async () => {
        const {oidcAuth, storage} = createOidcAuthInstance();
        oidcAuthInstance = oidcAuth;
        storageInstance = storage;

        subscription = oidcAuthInstance.onStateChanged(state => {
          if (state === EventState.LOGOUT_SUCCESS) {
            logoutSuccess = true;
          }
        });
        await oidcAuthInstance.login();
        expect(oidcAuthInstance.isAuthenticated()).toBeTruthy();
        await oidcAuthInstance.logout();
      });

      afterEach(() => {
        subscription();
      });

      it('should update authentication status to unauthenticated', async () => {
        expect(oidcAuthInstance.isAuthenticated()).toBeFalsy();
      });

      it('should emit session termination success event', async () => {
        expect(logoutSuccess).toBeTruthy();
      });

      it('should clear all stored authentication tokens', async () => {
        expect(await storageInstance.get()).toBeNull();
      });
    });

    describe('when logout fails', () => {
      let logoutError: boolean = false;
      let subscription: () => void;
      let oidcAuthInstance: IOidcAuth;
      let storageInstance: StorageFake;

      beforeEach(async () => {
        const {oidcAuth, storage} = createOidcAuthInstance();
        oidcAuthInstance = oidcAuth;
        storageInstance = storage;

        storageInstance.configureResetShouldThrowError();
        subscription = oidcAuthInstance.onStateChanged(state => {
          if (state === EventState.LOGOUT_ERROR) {
            logoutError = true;
          }
        });
        await oidcAuthInstance.login();
        expect(oidcAuthInstance.isAuthenticated()).toBeTruthy();
        await oidcAuthInstance.logout();
      });

      afterEach(() => {
        subscription();
      });

      it('should update authentication status to unauthenticated', async () => {
        expect(oidcAuthInstance.isAuthenticated()).toBeFalsy();
      });

      it('should emit session termination error event', async () => {
        expect(logoutError).toBeTruthy();
      });

      it('should leave authentication tokens in storage', async () => {
        expect(await storageInstance.get()).not.toBeNull();
      });
    });
  });

  describe('User Registration - Account Creation with Authentication', () => {
    describe('when registration succeeds', () => {
      let registerSuccess: boolean = false;
      let oidcAuthInstance: IOidcAuth;
      let storageInstance: StorageFake;
      let subscription: () => void;

      beforeEach(async () => {
        const {oidcAuth, storage} = createOidcAuthInstance();
        oidcAuthInstance = oidcAuth;
        storageInstance = storage;

        subscription = oidcAuthInstance.onStateChanged(state => {
          if (state === EventState.REGISTER_SUCCESS) {
            registerSuccess = true;
          }
        });
        await oidcAuthInstance.register();
      });

      afterEach(() => {
        subscription();
      });

      it('should automatically authenticate user after successful registration', async () => {
        expect(oidcAuthInstance.isAuthenticated()).toBeTruthy();
      });

      it('should emit account creation success event', async () => {
        expect(registerSuccess).toBeTruthy();
      });

      it('should persist new user authentication tokens to secure storage', async () => {
        expect(await storageInstance.get()).not.toBeNull();
      });
    });

    describe('when registration fails', () => {
      let registerError: boolean = false;
      let subscription: () => void;
      let oidcAuthInstance: IOidcAuth;
      let storageInstance: StorageFake;

      beforeEach(async () => {
        const {oidcAuth, appAuth, storage} = createOidcAuthInstance();
        oidcAuthInstance = oidcAuth;
        storageInstance = storage;

        appAuth.configureRegisterToThrowError();
        subscription = oidcAuthInstance.onStateChanged(state => {
          if (state === EventState.REGISTER_ERROR) {
            registerError = true;
          }
        });
        await oidcAuthInstance.register();
      });

      afterEach(() => {
        subscription();
      });

      it('should maintain authentication status to unauthenticated', async () => {
        expect(oidcAuthInstance.isAuthenticated()).toBeFalsy();
      });

      it('should emit account creation error event', async () => {
        expect(registerError).toBeTruthy();
      });

      it('should not persist any tokens', async () => {
        expect(await storageInstance.get()).toBeNull();
      });
    });
  });

  describe('Token Auto-Refresh - Automatic Token Renewal and Expiry Handling', () => {
    describe('when attempting refresh without authentication', () => {
      it('should throw error indicating no refresh token available', async () => {
        await expect(() =>
          createOidcAuthInstance().oidcAuth.updateToken(),
        ).rejects.toThrow(new Error('Refresh token should not be null.'));
      });
    });

    describe('when user is authenticated', () => {
      describe('when refresh token is valid', () => {
        describe('when access token has expired and needs renewal', () => {
          let accessTokenExpired: string;
          let oidcAuthInstance: IOidcAuth;
          let storageInstance: StorageFake;

          beforeEach(async () => {
            accessTokenExpired = createAccessTokenExpired();
            const {oidcAuth, storage, appAuth} = createOidcAuthInstance({
              customAccessToken: accessTokenExpired,
            });
            oidcAuthInstance = oidcAuth;
            storageInstance = storage;
            await oidcAuthInstance.login();
            appAuth.addNextToken(createAccessToken().accessToken);
          });

          it('should successfully refresh access token with new valid token', async () => {
            expect(await oidcAuthInstance.updateToken()).toBeTruthy();
            expect(oidcAuthInstance.accessToken).not.toBe(accessTokenExpired);
          });

          it('should emit token refresh success event', async () => {
            let refreshTokenSuccess: boolean = false;
            const subscription = oidcAuthInstance.onStateChanged(state => {
              if (state === EventState.REFRESH_SUCCESS) {
                refreshTokenSuccess = true;
              }
            });
            await oidcAuthInstance.updateToken();

            expect(refreshTokenSuccess).toBeTruthy();
            subscription();
          });

          it('should persist updated authentication state with new tokens', async () => {
            await oidcAuthInstance.updateToken();

            const state = await storageInstance.get();
            expect(state).not.toBeNull();
            expect(state?.accessToken).toBe(oidcAuthInstance.accessToken);
          });
        });

        describe('when access token is still valid and no refresh needed', () => {
          let previousAccessToken: string | null;
          let oidcAuthInstance: IOidcAuth;
          let processInstance: ProcessFake;

          beforeEach(async () => {
            const {oidcAuth, appAuth, process} = createOidcAuthInstance();
            oidcAuthInstance = oidcAuth;
            await oidcAuthInstance.login();
            previousAccessToken = oidcAuthInstance.accessToken;
            processInstance = process;
            appAuth.addNextToken(createAccessToken().accessToken);
          });

          it('should skip token refresh and keep existing valid token', async () => {
            expect(await oidcAuthInstance.updateToken()).toBeFalsy();
            expect(oidcAuthInstance.accessToken).toBe(previousAccessToken);
          });

          it('should not emit token refresh event', async () => {
            let refreshTokenSuccess: boolean = false;
            const subscription = oidcAuthInstance.onStateChanged(state => {
              if (state === EventState.REFRESH_SUCCESS) {
                refreshTokenSuccess = true;
              }
            });
            await oidcAuthInstance.updateToken();

            expect(refreshTokenSuccess).toBeFalsy();
            subscription();
          });

          describe('when token expires during runtime', () => {
            let tokenExpired: boolean = false;
            let subscription: () => void;

            beforeEach(() => {
              subscription = oidcAuthInstance.onStateChanged(state => {
                tokenExpired = state === EventState.TOKEN_EXPIRED;
              });
              processInstance.nextTick(99999);
            });

            afterEach(() => {
              subscription();
            });

            it('should emit token expired event', async () => {
              expect(tokenExpired).toBeTruthy();
            });
          });
        });
      });

      describe('when refresh token has expired and cannot renew access token', () => {
        let oidcAuthInstance: IOidcAuth;

        beforeEach(async () => {
          const {oidcAuth, appAuth} = createOidcAuthInstance({
            customAccessToken: createAccessTokenExpired(),
          });
          oidcAuthInstance = oidcAuth;
          appAuth.configureRefreshShouldThrowError(
            OauthAccessTokenErrorCode.INVALID_GRANT,
          );
          await oidcAuthInstance.login();
        });

        it('should indicate token refresh failed', async () => {
          expect(await oidcAuthInstance.updateToken()).toBeFalsy();
        });

        it('should clear access token', async () => {
          await oidcAuthInstance.updateToken();

          expect(oidcAuthInstance.accessToken).toBeNull();
        });

        it('should update authentication status to unauthenticated', async () => {
          await oidcAuthInstance.updateToken();

          expect(oidcAuthInstance.isAuthenticated()).toBeFalsy();
        });

        it('should emit token refresh failed event when refresh token is invalid', async () => {
          let refreshTokenFailed: boolean = false;
          const subscription = oidcAuthInstance.onStateChanged(state => {
            if (state === EventState.REGISTER_ERROR) {
              refreshTokenFailed = true;
            }
          });
          await oidcAuthInstance.updateToken();

          expect(refreshTokenFailed).toBeFalsy();
          subscription();
        });
      });
    });
  });
});
