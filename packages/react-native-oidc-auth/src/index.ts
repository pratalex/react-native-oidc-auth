import {
  OidcConfiguration,
  DateTime,
  OidcAuth,
  Process,
} from "react-native-oidc-auth-core";
import { OidcAuthBare } from "@/oidc-auth-bare";
import { KeycloakStorage } from "@/storage/keycloak-storage";


export const createOidcAuth = (config:  OidcConfiguration) =>
  new OidcAuth(
    config,
    new KeycloakStorage(),
    new OidcAuthBare(config.issuer),
    new DateTime(),
    new Process(),
  );

export {resetTracingLogger, setTracingLogger, OidcAuthProvider, useOidcAuth, configAxios, OidcConfiguration} from "react-native-oidc-auth-core";