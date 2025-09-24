import {BaseAuthConfiguration} from '@/app-auth/interface/base-auth-configuration';

export type EndSessionConfiguration = BaseAuthConfiguration & {
  additionalParameters?: {[name: string]: string};
  dangerouslyAllowInsecureHttpRequests?: boolean;
  iosPrefersEphemeralSession?: boolean;
};
