import {tracingLog} from '@/logs';
import createAuthRefreshInterceptor from 'axios-auth-refresh';
import {IOidcAuth} from '@/oidc-auth/interface/oidc-auth';
import {AxiosInstance} from 'axios';

export const configAxios = (
  oidcAuth: IOidcAuth,
  axiosInstance: AxiosInstance,
) => {
  // Auto refresh token
  createAuthRefreshInterceptor(axiosInstance, refreshAuth, {
    statusCodes: [401],
  });

  /**
   * Refreshes the authentication token for a failed request.
   *
   * @param {object} failedRequest - The failed request object.
   * @return {Promise<void>} - A Promise that resolves when the token is refreshed successfully.
   * @throws {object} - The failed request object if the token refresh fails.
   */
  async function refreshAuth(failedRequest: any): Promise<void> {
    try {
      tracingLog.debug(
        '[AXIOS] 401 intercepted',
        JSON.stringify(failedRequest.headers),
      );

      let isSuccess: boolean;
      try {
        isSuccess = await oidcAuth.updateToken(5);
      } catch (e) {
        tracingLog.error('[AXIOS] Refresh token failed', e);
        isSuccess = false;
      }

      tracingLog.debug(
        `[AXIOS] Token Refreshed: ${isSuccess ? 'success' : 'failed'}`,
      );

      if (isSuccess) {
        failedRequest.response.config.headers.Authorization = `Bearer ${oidcAuth.accessToken}`;
      }
    } catch (error) {
      tracingLog.error('[AXIOS] Refresh token failed', error);
      throw failedRequest;
    }
  }

  // Automatically add Bearer token to all outgoing requests
  axiosInstance.interceptors.request.use(config => {
    if (oidcAuth.accessToken) {
      tracingLog.debug('[AXIOS] Set access token');
      config.headers.Authorization = `Bearer ${oidcAuth.accessToken}`;
    }
    return config;
  });
};
