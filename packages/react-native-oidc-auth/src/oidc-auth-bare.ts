import axios from "axios";
import {
  authorize,
  logout as logoutUser,
  refresh,
} from "react-native-app-auth";
import {
  AuthConfiguration,
  AuthorizeResult,
  EndSessionConfiguration,
  IAppAuth,
  LogoutConfiguration,
  RefreshConfiguration,
  RefreshResult,
  tracingLog,
  User,
  UserInfoConfiguration,
} from "react-native-oidc-auth-core";
import { OpenIdConfigurationResponse } from "./interface/openid-configuration-response";

export class OidcAuthBare implements IAppAuth {
  constructor(private issuer: string) {}

  async authorize(config: AuthConfiguration): Promise<AuthorizeResult> {
    tracingLog.debug("[EXPO APP AUTH] display login page");

    const state = await authorize(config);

    return {
      idToken: state?.idToken,
      accessToken: state?.accessToken,
      refreshToken: state?.refreshToken,
    } as AuthorizeResult;
  }

  async logout(
    config: EndSessionConfiguration,
    logoutConfig: LogoutConfiguration,
  ): Promise<void> {
    if (logoutConfig.idToken == null) throw new Error("Not logged in");

    await logoutUser(
      {
        issuer: config.issuer,
        dangerouslyAllowInsecureHttpRequests:
          config.dangerouslyAllowInsecureHttpRequests,
      } as EndSessionConfiguration,
      {
        idToken: logoutConfig.idToken,
        postLogoutRedirectUrl: logoutConfig.postLogoutRedirectUrl,
      },
    );
  }

  async refresh(
    config: AuthConfiguration,
    refreshConfig: RefreshConfiguration,
  ): Promise<RefreshResult> {
    const result = await refresh(config, {
      refreshToken: refreshConfig.refreshToken,
    });

    if (result.refreshToken == null || result.accessToken == null)
      throw new Error("Refresh token has failed");

    return {
      idToken: result.idToken,
      refreshToken: result.refreshToken,
      accessToken: result.accessToken,
    };
  }

  async getUserInfo(config: UserInfoConfiguration): Promise<User> {
    if (config.accessToken == null)
      throw new Error("Access token is not set, please call authorize first");

    tracingLog.debug("[EXPO APP AUTH] fetch user info");
    const response = await axios.get<User>(`${this.issuer}/account`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
      },
    });

    const result = response.data;

    return {
      email: result.email,
      createdTimestamp: result.createdTimestamp,
      emailVerified: result.emailVerified,
      enabled: result.enabled,
      firstName: result.firstName,
      totp: result.totp,
      id: result.id,
      lastName: result.lastName,
      username: result.username,
    };
  }

  async register(
    config: AuthConfiguration,
    registrationPageEndpoint: string,
  ): Promise<AuthorizeResult> {
    let configService = config.serviceConfiguration;

    if(configService == null) {
      tracingLog.debug("[EXPO APP AUTH] fetch openid configuration");
      const response = await axios.get<OpenIdConfigurationResponse>(
        `${this.issuer}/.well-known/openid-configuration`,
      );

      configService = {
        tokenEndpoint: response.data.token_endpoint,
        authorizationEndpoint: response.data.authorization_endpoint,
        endSessionEndpoint: response.data.end_session_endpoint,
        revocationEndpoint: response.data.revocation_endpoint,
        registrationEndpoint: response.data.registration_endpoint,
      };

      tracingLog.debug("[EXPO APP AUTH] fetch openid configuration successfully");
    }

    tracingLog.debug("[EXPO APP AUTH] display register page");

    // react-native-app-auth doesn't support displaying a registration page natively, so I use the authorize function and override the authorizationEndpoint with the registration endpoint.
    const state = await authorize({
      ...config,
      /* We must change the issuer to clear the cache because the login page is being displayed from the cache and always displays
        instead of the register page */
      issuer: 'https://fake.test.com',
      serviceConfiguration: {
        ...configService,
        authorizationEndpoint: registrationPageEndpoint,
      }
    });

    return {
      idToken: state?.idToken,
      accessToken: state?.accessToken,
      refreshToken: state?.refreshToken,
    } as AuthorizeResult;
  }
}
