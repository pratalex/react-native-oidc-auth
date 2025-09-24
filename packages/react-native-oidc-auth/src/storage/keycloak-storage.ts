import {IKeychainStorage, OidcAuthData} from 'react-native-oidc-auth-core';
import Keychain from 'react-native-keychain';

export class KeycloakStorage implements IKeychainStorage {
  private readonly username = 'oidc-auth';

  async get(): Promise<OidcAuthData | null> {
    const key = await Keychain.getGenericPassword();
    let state: OidcAuthData | null = null;
    if (key && key.username === this.username && key.password != null) {
      state = JSON.parse(key.password);
    }

    return state;
  }

  async add(state?: OidcAuthData) {
    await Keychain.setGenericPassword(this.username, JSON.stringify(state));
  }

  async reset() {
    await Keychain.resetGenericPassword();
  }
}
