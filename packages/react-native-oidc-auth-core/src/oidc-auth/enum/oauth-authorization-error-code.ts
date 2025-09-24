// see for more details: https://datatracker.ietf.org/doc/html/rfc6749#section-4.1.2.1
export enum OauthAuthorizationErrorCode {
  INVALID_REQUEST = 'invalid_request',
  UNAUTHORIZED_CLIENT = 'unauthorized_client',
  ACCESS_DENIED = 'access_denied',
  UNSUPPORTED_RESPONSE_TYPE = 'unsupported_response_type',
  INVALID_SCOPE = 'invalid_scope',
  TEMPORARILY_UNAVAILABLE = 'temporarily_unavailable',
}
