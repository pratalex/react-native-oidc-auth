export type OpenIdConfigurationResponse = {
  issuer: string;
  authorization_endpoint: string;
  token_endpoint: string;
  introspection_endpoint: string;
  userinfo_endpoint: string;
  end_session_endpoint: string;
  registration_endpoint: string;
  revocation_endpoint: string;
}