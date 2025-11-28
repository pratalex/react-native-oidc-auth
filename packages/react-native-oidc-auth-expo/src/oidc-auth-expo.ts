import * as AuthSession from 'expo-auth-session';
import {
  AuthRequest,
  AuthSessionResult,
  DiscoveryDocument,
  makeRedirectUri,
} from 'expo-auth-session';
import {Platform} from 'react-native';
import axios from 'axios';
import {
  AuthorizeResult,
  encodeFormData,
  EndSessionConfiguration,
  IAppAuth,
  LogoutConfiguration,
  RefreshConfiguration,
  RefreshResult,
  TokenResponse,
  tracingLog,
  User,
  UserInfoConfiguration,
} from 'react-native-oidc-auth-core';
import {ExpoAuthConfiguration} from '@/interface/expo-auth-configuration';

export class OidcAuthExpo implements IAppAuth {
  private discoveryDocument: DiscoveryDocument | null = null;

  constructor(private issuer: string) {}

  private async fetchDiscoveryDocument() {
    if (!this.discoveryDocument) {
      tracingLog.debug(
        `[EXPO APP AUTH] fetch discovery document from issuer: ${this.issuer}`,
      );
      this.discoveryDocument = await AuthSession.resolveDiscoveryAsync(
        this.issuer,
      );
    }

    tracingLog.debug('[EXPO APP AUTH] fetch discovery document successfully');
    return this.discoveryDocument;
  }

  async authorize(config: ExpoAuthConfiguration): Promise<AuthorizeResult> {
    const {discoveryDocument, redirectUri, authRequest} =
      await this.initializeAuthSession(config);

    tracingLog.debug('[EXPO APP AUTH] display login page');
    const result = await authRequest.promptAsync(discoveryDocument);

    return await this.processAuthResult(
      result,
      config,
      authRequest,
      redirectUri,
    );
  }

  async logout(
    config: EndSessionConfiguration,
    logoutConfig: LogoutConfiguration,
  ): Promise<void> {
    if (logoutConfig.idToken == null) throw new Error('Not logged in');

    const discoveryDocument = await this.fetchDiscoveryDocument();

    if (discoveryDocument.endSessionEndpoint) {
      tracingLog.debug(
        '[EXPO APP AUTH] end session endpoint:',
        discoveryDocument.endSessionEndpoint,
      );
      await axios.post(
        `${discoveryDocument.endSessionEndpoint}`,
        `id_token_hint=${logoutConfig.idToken}`,
        {
          headers: {'Content-Type': 'application/x-www-form-urlencoded'},
        },
      );
    }
    if (Platform.OS === 'ios') {
      AuthSession.dismiss();
    }
  }

  async refresh(
    config: ExpoAuthConfiguration,
    refreshConfig: RefreshConfiguration,
  ): Promise<RefreshResult> {
    const discoveryDocument = await this.fetchDiscoveryDocument();
    let result = await AuthSession.refreshAsync(
      {refreshToken: refreshConfig.refreshToken, clientId: config.clientId},
      discoveryDocument,
    );

    if (result.idToken == null || result.refreshToken == null)
      throw new Error('Refresh token has failed');

    return {
      idToken: result.idToken,
      refreshToken: result.refreshToken,
      accessToken: result.accessToken,
    };
  }

  async getUserInfo(config: UserInfoConfiguration): Promise<User> {
    if (config.accessToken == null)
      throw new Error('Access token is not set, please call authorize first');

    const discoveryDocument = await this.fetchDiscoveryDocument();

    tracingLog.debug('[EXPO APP AUTH] fetch user info');
    const result = await AuthSession.fetchUserInfoAsync(
      {accessToken: config.accessToken},
      discoveryDocument,
    );

    return {
      email: result.email,
      createdTimestamp: result.createdTimestamp,
      emailVerified: result.emailVerified,
      enabled: result.enabled,
      firstName: result.firstName,
      totp: result.totp,
      id: result.id,
      lastName: result.lastName,
      username: result.usename,
    };
  }

  async register(
    config: ExpoAuthConfiguration,
    registrationPageEndpoint: string,
  ): Promise<AuthorizeResult> {
    const {discoveryDocument, redirectUri, authRequest} =
      await this.initializeAuthSession(config);

    tracingLog.debug('[EXPO APP AUTH] display login page');
    const result = await authRequest.promptAsync({
      ...discoveryDocument,
      authorizationEndpoint: registrationPageEndpoint,
    });

    return await this.processAuthResult(
      result,
      config,
      authRequest,
      redirectUri,
    );
  }

  private async processAuthResult(
    result: AuthSessionResult,
    config: ExpoAuthConfiguration,
    authRequest: AuthRequest,
    redirectUri: string,
  ) {
    tracingLog.debug('[EXPO APP AUTH] authentication finished: ', result);

    if (result.type !== 'error' && result.type !== 'success')
      throw new Error('AuthSession cancelled');
    if (result.type === 'error')
      throw new Error(`AuthSession failed : ${result.error?.message}`);

    const tokenUrl = `${this.issuer}/protocol/openid-connect/token`;

    const formData = {
      grant_type: 'authorization_code',
      client_id: config.clientId,
      code: result.params.code,
      code_verifier: authRequest.codeVerifier!,
      redirect_uri: redirectUri,
    };

    const response = await axios.post<TokenResponse>(
      tokenUrl,
      encodeFormData(formData),
      {
        headers: {'Content-Type': 'application/x-www-form-urlencoded'},
      },
    );

    if (response.status !== 200) throw new Error('AuthSession failed');

    const data = response.data;

    tracingLog.debug('[EXPO APP AUTH] authentication success: ', data);

    return {
      idToken: data?.id_token,
      accessToken: data?.access_token,
      refreshToken: data?.refresh_token,
    } as AuthorizeResult;
  }

  private async initializeAuthSession(config: ExpoAuthConfiguration) {
    const discoveryDocument = await this.fetchDiscoveryDocument();

    tracingLog.debug('[EXPO APP AUTH] load auth session with config');
    const redirectUri = makeRedirectUri(config.redirectUriOptions);
    tracingLog.debug('[EXPO APP AUTH] redirect uri: ', redirectUri);
    const authRequest = await AuthSession.loadAsync(
      {
        clientId: config.clientId,
        clientSecret: config.clientSecret,
        redirectUri: redirectUri,
        scopes: config.scopes,
      },
      discoveryDocument,
    );
    return {discoveryDocument, redirectUri, authRequest};
  }
}
