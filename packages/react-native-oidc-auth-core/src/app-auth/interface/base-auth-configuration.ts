export interface ServiceConfiguration {
  authorizationEndpoint: string;
  tokenEndpoint: string;
  revocationEndpoint?: string;
  registrationEndpoint?: string;
  endSessionEndpoint?: string;
}

export type BaseConfiguration = {
  issuer: string;
  serviceConfiguration?: ServiceConfiguration;
};

export type BaseAuthConfiguration = BaseConfiguration & {
  clientId: string;
};
