import * as Keychain from 'expo-secure-store';
import {IKeychainStorage, OidcAuthData} from 'react-native-oidc-auth-core';

export class ExpoStorage implements IKeychainStorage {
  private readonly username = 'oidc-auth';

  async get(): Promise<OidcAuthData | null> {
    const key = await Keychain.getItemAsync(this.username);
    let state: OidcAuthData | null = null;
    if (key != null) {
      state = JSON.parse(key);
    }

    return state;
  }

  async add(state?: OidcAuthData) {
    await Keychain.setItemAsync(this.username, JSON.stringify(state));
  }

  async reset() {
    await Keychain.deleteItemAsync(this.username);
  }
}
