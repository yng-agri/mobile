import { CryptoService } from 'jslib/abstractions/crypto.service';
import { StorageService } from 'jslib/abstractions/storage.service';

import { Utils } from 'jslib/misc/utils';

const KeyChainService = 'com.8bit.bitwarden';
const KeyChainAccessGroup = 'LTZ2PFU5D6.com.8bit.bitwarden';

export class MobileSecureStorageService implements StorageService {
    constructor(private storageService: StorageService, private cryptoService: () => CryptoService) {
    }

    init() {
        return Promise.resolve();
    }

    async get<T>(key: string): Promise<T> {
        try {
            const query = this.getRecordQuery(key);
            const intRef = new interop.Reference<any>();
            this.checkError(SecItemCopyMatching(query, intRef));
            const buffer = interop.bufferFromData(intRef.value as NSData);
            return Promise.resolve(Utils.fromBufferToB64(buffer) as any);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async save(key: string, obj: any): Promise<any> {
        try {
            await this.remove(key);
            const query = this.getRecordQuery(key, obj);
            this.checkError(SecItemAdd(query, null));
            return Promise.resolve();
        } catch (e) {
            return Promise.reject(e);
        }
    }

    remove(key: string): Promise<any> {
        try {
            const query = this.getRecordQuery(key);
            this.checkError(SecItemDelete(query));
        } catch (e) {
            return Promise.reject(e);
        }
    }

    private checkError(resultCode: number) {
        if (resultCode !== errSecSuccess) {
            throw new Error('Failed to execute key chain action. Result code: ' + resultCode);
        }
    }

    private getRecordQuery(key: string, obj: any = null) {
        const query = NSMutableDictionary.new();
        query.setValueForKey(kSecClassGenericPassword, kSecClass);
        query.setValueForKey(KeyChainAccessGroup, kSecAttrAccessGroup);
        query.setValueForKey(KeyChainService, kSecAttrService);
        query.setValueForKey(key, kSecAttrAccount);
        if (obj == null) {
            query.setValueForKey(kCFBooleanTrue, kSecReturnData);
            query.setValueForKey(kSecMatchLimitOne, kSecMatchLimit);
        }
        else {
            if (typeof (obj) !== 'string') {
                throw new Error('Only base 64 strings can be stored in key chain.');
            }
            const data = Utils.fromB64ToArray(obj);
            const intRef = new interop.Reference(interop.types.int8, interop.alloc(data.length));
            data.forEach((d, i) => intRef[i] = d);
            const nsData = NSData.dataWithBytesLength(intRef, data.length);
            query.setValueForKey(nsData, kSecValueData);
        }
        return query;
    }
}
