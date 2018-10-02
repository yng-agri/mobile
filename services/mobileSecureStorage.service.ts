import { android as androidApp } from 'application';
import { BwSecureStorage } from 'nativescript-bw-secure-storage';

import { StorageService } from 'jslib/abstractions/storage.service';

export class MobileSecureStorageService implements StorageService {
    private bwSecureStorage: BwSecureStorage;

    constructor() {
        this.bwSecureStorage = new BwSecureStorage();
    }

    init(androidAppContext: any = null) {
        this.bwSecureStorage.init({
            keyChainService: 'com.8bit.bitwarden',
            keyChainAccessGroup: 'LTZ2PFU5D6.com.8bit.bitwarden',
            androidContext: androidAppContext != null ? androidAppContext :
                (androidApp != null ? androidApp.context : null),
        });
    }

    get<T>(key: string): Promise<T> {
        return this.bwSecureStorage.get<T>(key);
    }

    save(key: string, obj: any): Promise<any> {
        return this.bwSecureStorage.save(key, obj);
    }

    remove(key: string): Promise<any> {
        return this.bwSecureStorage.remove(key);
    }
}
