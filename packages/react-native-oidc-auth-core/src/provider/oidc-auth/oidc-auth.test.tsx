import React from 'react';
import {act, render, screen} from '@testing-library/react-native';
import {OidcAuthProvider} from '@/provider/oidc-auth/oidc-auth';
import {View} from 'react-native';
import {
  createAccessToken,
  createIdToken,
  createRefreshToken,
} from '@/test-utils/oidc-auth/tokens';
import {OauthAuthErrorCode} from '@/oidc-auth/enum/oauth-auth-error-code';
import {OidcAuthData} from '@/oidc-auth/interface/oidc-auth-data';
import {
  createAccessTokenExpired,
  createOidcAuthInstance,
  createRefreshTokenExpired,
} from '@/test-utils/oidc-auth/create-oidc-auth-instance';
import {IOidcAuth} from '@/oidc-auth/interface/oidc-auth';
import {useOidcAuth} from '@/provider/oidc-auth/use-oidc-auth';

jest.useFakeTimers();

const authenticatedTestId = 'authenticated';
const notAuthenticatedTestId = 'not-authenticated';
const FakeComponent: React.FC = () => {
  const {isAuthenticated} = useOidcAuth();

  return isAuthenticated ? (
    <View testID={authenticatedTestId} />
  ) : (
    <View testID={notAuthenticatedTestId} />
  );
};

describe('OidcAuthProvider - oidcAuth connection initialization and authentication state management', () => {
  async function initRendering(oidcAuthInstance: IOidcAuth) {
    render(
      <OidcAuthProvider instance={oidcAuthInstance}>
        <FakeComponent />
      </OidcAuthProvider>,
    );

    await wait();
  }

  function wait(msToRun: number = 1000) {
    return act(() => jest.advanceTimersByTimeAsync(msToRun));
  }

  describe('Provider initialization and token state validation', () => {
    describe('when no stored authentication state exists', () => {
      beforeEach(async () => {
        const {oidcAuth} = createOidcAuthInstance();
        await initRendering(oidcAuth);
      });

      it('should return authenticated false', async () => {
        expect(
          await screen.findByTestId(notAuthenticatedTestId),
        ).toBeOnTheScreen();
      });
    });

    describe('when user successfully authenticates', () => {
      beforeEach(async () => {
        const {oidcAuth} = createOidcAuthInstance();
        await initRendering(oidcAuth);
        await oidcAuth.login();
      });

      it('should return authenticated true', async () => {
        expect(
          await screen.findByTestId(authenticatedTestId),
        ).toBeOnTheScreen();
      });
    });

    describe('when user authentication fails', () => {
      beforeEach(async () => {
        const {oidcAuth, appAuth} = createOidcAuthInstance();
        await initRendering(oidcAuth);

        appAuth.configureAuthorizeToThrowError();

        await oidcAuth.login();
      });

      it('should return authenticated false', async () => {
        expect(
          await screen.findByTestId(notAuthenticatedTestId),
        ).toBeOnTheScreen();
      });
    });

    describe('when stored authentication state exists', () => {
      describe('when access token is expired', () => {
        describe('when refresh token is still valid and can renew access token', () => {
          beforeEach(async () => {
            const {oidcAuth} = createOidcAuthInstance({
              customStorageData: new OidcAuthData(
                createAccessTokenExpired(),
                createIdToken().idToken,
                createRefreshToken().refreshToken,
                0,
              ),
            });

            await initRendering(oidcAuth);
          });

          it('should return authenticated true', async () => {
            expect(
              await screen.findByTestId(authenticatedTestId),
            ).toBeOnTheScreen();
          });
        });

        describe('when refresh token is expired and cannot renew access token', () => {
          beforeEach(async () => {
            const {oidcAuth, appAuth} = createOidcAuthInstance({
              customStorageData: new OidcAuthData(
                createAccessTokenExpired(),
                createIdToken().idToken,
                createRefreshTokenExpired(),
                0,
              ),
            });
            appAuth.configureRefreshShouldThrowError(
              OauthAuthErrorCode.TOKEN_REFRESH_FAILED,
            );

            await initRendering(oidcAuth);
          });

          it('should return authenticated false', async () => {
            expect(
              await screen.findByTestId(notAuthenticatedTestId),
            ).toBeOnTheScreen();
          });
        });
      });

      describe('when access token is still valid', () => {
        beforeEach(async () => {
          const {oidcAuth} = createOidcAuthInstance({
            customStorageData: new OidcAuthData(
              createAccessToken().accessToken,
              createIdToken().idToken,
              createRefreshToken().refreshToken,
              0,
            ),
          });
          await initRendering(oidcAuth);
        });

        it('should return authenticated true', async () => {
          expect(
            await screen.findByTestId(authenticatedTestId),
          ).toBeOnTheScreen();
        });
      });
    });
  });
});
