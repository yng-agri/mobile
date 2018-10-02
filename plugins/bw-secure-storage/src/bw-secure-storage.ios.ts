const KeyChainService = 'com.8bit.bitwarden';
const KeyChainAccessGroup = 'LTZ2PFU5D6.com.8bit.bitwarden';

export class BwSecureStorage {
    init(options: any) {
        // Nothing to init on iOS
    }

    get<T>(key: string): Promise<T> {
        try {
            const query = this.getRecordQuery(key);
            const intRef = new interop.Reference<any>();
            this.checkError(SecItemCopyMatching(query, intRef));
            const b64 = (intRef.value as NSData).base64EncodedStringWithOptions(0);
            return Promise.resolve(b64 as any);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async save(key: string, obj: any): Promise<any> {
        if (typeof (obj) !== 'string') {
            throw new Error('Only base 64 strings can be stored in android key store.');
        }
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
            return Promise.resolve();
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
            const data = NSData.alloc().initWithBase64EncodedStringOptions(obj, 0);
            query.setValueForKey(data, kSecValueData);
        }
        return query;
    }
}
