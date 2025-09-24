import {IKeychainStorage} from '@/oidc-auth/interface/oidc-auth';
import {OidcAuthData} from '@/oidc-auth/interface/oidc-auth-data';

export class StorageFake implements IKeychainStorage {
  private storage: OidcAuthData | null;
  private resetShouldThrowError = false;

  constructor(storage?: OidcAuthData | null) {
    this.storage = storage || null;
  }

  configureResetShouldThrowError() {
    this.resetShouldThrowError = true;
  }

  async add(data: OidcAuthData) {
    this.storage = data;
  }

  async get() {
    return this.storage;
  }

  async reset() {
    if (this.resetShouldThrowError) {
      throw new Error('reset error');
    }
    this.storage = null;
  }
}
