export class BwSecureStorage {
    private keyChainService = 'bw-secure-storage';
    private keyChainAccessGroup: string = null;

    init(options: any) {
        if (options != null) {
            if (options.keyChainService != null) {
                this.keyChainService = options.keyChainService;
            }
            if (options.keyChainAccessGroup != null) {
                this.keyChainAccessGroup = options.keyChainAccessGroup;
            }
        }
    }

    get<T>(key: string): Promise<T> {
        const query = this.getRecordQuery(key);
        query.setValueForKey(kCFBooleanTrue, kSecReturnData);
        query.setValueForKey(kSecMatchLimitOne, kSecMatchLimit);
        const intRef = new interop.Reference<any>();
        const resultCode = SecItemCopyMatching(query, intRef);
        if (resultCode !== noErr) {
            return Promise.resolve(null);
        }
        const b64 = (intRef.value as NSData).base64EncodedStringWithOptions(0);
        return Promise.resolve(b64 as any);
    }

    save(key: string, obj: any): Promise<any> {
        if (typeof (obj) !== 'string') {
            return Promise.reject('Only base 64 strings can be stored in android key store.');
        }
        return this.remove(key).then(() => {
            const query = this.getRecordQuery(key);
            const data = NSData.alloc().initWithBase64EncodedStringOptions(obj, 0);
            query.setValueForKey(data, kSecValueData);
            const resultCode = SecItemAdd(query, null);
            if (resultCode !== noErr) {
                throw new Error('SecItemAdd failed. Result code: ' + resultCode);
            }
        });
    }

    remove(key: string): Promise<any> {
        const query = this.getRecordQuery(key);
        SecItemDelete(query);
        return Promise.resolve();
    }

    private getRecordQuery(key: string) {
        const query = NSMutableDictionary.new();
        query.setValueForKey(kSecClassGenericPassword, kSecClass);
        if (this.keyChainAccessGroup != null) {
            query.setValueForKey(this.keyChainAccessGroup, kSecAttrAccessGroup);
        }
        query.setValueForKey(this.keyChainService, kSecAttrService);
        query.setValueForKey(key, kSecAttrAccount);
        return query;
    }
}
