const AndroidKeyStore = 'AndroidKeyStore';
const AesMode = 'AES/GCM/NoPadding';
const RsaMode = 'RSA/ECB/PKCS1Padding';
const KeyAlias = 'bitwardenKey3';
const PrefsPrefix = 'ksSecured3:';
const AesKey = 'ksSecured3:aesKeyForService';

export class BwSecureStorage {
    private keyStore: java.security.KeyStore;
    private oldAndroid = false;
    private androidContext: android.content.Context;
    private inited = false;

    constructor() {
        this.oldAndroid = android.os.Build.VERSION.SDK_INT < 23;
    }

    init(options: any) {
        if (options == null || options.androidContext == null) {
            throw new Error('options.androidContext is required.');
        }
        this.androidContext = options.androidContext;
        this.keyStore = java.security.KeyStore.getInstance(AndroidKeyStore);
        this.keyStore.load(null);
        try {
            this.generateKeyStore(true);
        } catch {
            this.generateKeyStore(false);
        }
        this.generateAesKey();
        this.inited = true;
    }

    get<T>(key: string): Promise<T> {
        this.checkInited();
        const formattedKey = PrefsPrefix + key;
        const cs = this.getPref(formattedKey);
        if (cs == null) {
            return Promise.resolve(null);
        }
        const parts = cs.split('|');
        if (parts.length < 2) {
            return Promise.resolve(null);
        }
        const aesKey = this.getAesKey();
        if (aesKey == null) {
            return Promise.resolve(null);
        }
        try {
            const ivBytes = this.fromB64ToArray(parts[0]);
            const encBytes = this.fromB64ToArray(parts[1]);
            const decArr = this.aesDecrypt(ivBytes, encBytes, aesKey);
            return Promise.resolve(this.fromArrayToB64(decArr) as any);
        } catch {
            // tslint:disable-next-line
            console.error('Failed to decrypt from secure storage.');
            this.removePref(formattedKey);
            return Promise.resolve(null);
        }
    }

    save(key: string, obj: any): Promise<any> {
        this.checkInited();
        const formattedKey = PrefsPrefix + key;
        if (obj === null) {
            this.removePref(formattedKey);
            return Promise.resolve();
        }

        if (typeof (obj) !== 'string') {
            throw new Error('Only base 64 strings can be stored in android key store.');
        }

        const aesKey = this.getAesKey();
        if (aesKey == null) {
            return Promise.resolve();
        }

        try {
            const arr = this.fromB64ToArray(obj);
            const cs = this.aesEncrypt(arr, aesKey);
            this.savePref(formattedKey, cs);
        } catch {
            // tslint:disable-next-line
            console.error('Failed to encrypt to secure storage.');
        }
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        this.checkInited();
        this.removePref(PrefsPrefix + key);
        return Promise.resolve();
    }

    private getAesKey(): native.Array<number> {
        const encKey = this.getPref(AesKey);
        if (encKey == null) {
            return null;
        }

        try {
            if (this.oldAndroid) {
                const encKeyBytes = this.fromB64ToArray(encKey);
                const key = this.rsaDecrypt(encKeyBytes);
                return key;
            } else {
                const parts = encKey.split('|');
                if (parts.length < 2) {
                    return null;
                }
                const ivBytes = this.fromB64ToArray(parts[0]);
                const encKeyBytes = this.fromB64ToArray(parts[1]);
                const key = this.aesDecrypt(ivBytes, encKeyBytes);
                return key;
            }
        } catch {
            this.keyStore.deleteEntry(KeyAlias);
            this.remove(AesKey);
            return null;
        }
    }

    private generateKeyStore(withDate: boolean) {
        if (this.keyStore.containsAlias(KeyAlias)) {
            return;
        }

        this.clearPrefs();
        const end = java.util.Calendar.getInstance();
        end.add(java.util.Calendar.YEAR, 99);

        if (this.oldAndroid) {
            const subject = new javax.security.auth.x500.X500Principal('CN=' + KeyAlias);
            const builder = new android.security.KeyPairGeneratorSpec.Builder(this.androidContext)
                .setAlias(KeyAlias)
                .setSubject(subject)
                .setSerialNumber(java.math.BigInteger.TEN);

            if (withDate) {
                builder.setStartDate(new java.util.Date(0)).setEndDate(end.getTime());
            }

            const spec = builder.build();
            const gen = java.security.KeyPairGenerator.getInstance('RSA', AndroidKeyStore);
            gen.initialize(spec);
            gen.generateKeyPair();
        } else {
            const builder = new android.security.keystore.KeyGenParameterSpec.Builder(KeyAlias,
                // tslint:disable-next-line
                android.security.keystore.KeyProperties.PURPOSE_DECRYPT |
                android.security.keystore.KeyProperties.PURPOSE_ENCRYPT)
                .setBlockModes([android.security.keystore.KeyProperties.BLOCK_MODE_GCM])
                .setEncryptionPaddings([android.security.keystore.KeyProperties.ENCRYPTION_PADDING_NONE]);

            if (withDate) {
                builder.setKeyValidityStart(new java.util.Date(0)).setKeyValidityEnd(end.getTime());
            }

            const spec = builder.build();
            const gen = javax.crypto.KeyGenerator.getInstance(
                android.security.keystore.KeyProperties.KEY_ALGORITHM_AES, AndroidKeyStore);
            gen.init(spec);
            gen.generateKey();
        }
    }

    private generateAesKey() {
        const existingKey = this.getPref(AesKey);
        if (existingKey != null) {
            return;
        }
        const key = this.randomBytes(32);
        const encKey = this.oldAndroid ? this.rsaEncrypt(key) : this.aesEncrypt(key);
        this.savePref(AesKey, encKey);
    }

    private aesEncrypt(input: native.Array<number>, key: native.Array<number> = null): string {
        const entry = this.getAesKeyEntry(key);
        const cipher = javax.crypto.Cipher.getInstance(AesMode);
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, entry);
        const encBytes = cipher.doFinal(input);
        const ivBytes = cipher.getIV();
        return this.fromArrayToB64(ivBytes) + '|' + this.fromArrayToB64(encBytes);
    }

    private aesDecrypt(iv: native.Array<number>, encData: native.Array<number>,
        key: native.Array<number> = null): native.Array<number> {
        const entry = this.getAesKeyEntry(key);
        const cipher = javax.crypto.Cipher.getInstance(AesMode);
        const spec = this.oldAndroid ? new javax.crypto.spec.IvParameterSpec(iv) :
            new javax.crypto.spec.GCMParameterSpec(128, iv);
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, entry, spec);
        return cipher.doFinal(encData);
    }

    private rsaEncrypt(data: native.Array<number>): string {
        const entry = this.getRsaKeyEntry();
        const cipher = javax.crypto.Cipher.getInstance(RsaMode);
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, entry.getCertificate().getPublicKey());
        const cipherText = cipher.doFinal(data);
        return this.fromArrayToB64(cipherText);
    }

    private rsaDecrypt(encData: native.Array<number>): native.Array<number> {
        const entry = this.getRsaKeyEntry();
        const cipher = javax.crypto.Cipher.getInstance(RsaMode);
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, entry.getPrivateKey());
        return cipher.doFinal(encData);
    }

    private getRsaKeyEntry() {
        return this.keyStore.getEntry(KeyAlias, null) as java.security.KeyStore.PrivateKeyEntry;
    }

    private getAesKeyEntry(key: native.Array<number>) {
        return key != null ? new javax.crypto.spec.SecretKeySpec(key, 'AES') :
            this.keyStore.getKey(KeyAlias, null);
    }

    private checkInited() {
        if (!this.inited) {
            throw new Error('BwSecureStorage not inited.');
        }
    }

    private randomBytes(length: number) {
        const random = new java.security.SecureRandom();
        const keyBytes = Array.create('byte', length);
        random.nextBytes(keyBytes);
        return keyBytes;
    }

    private fromArrayToB64(arr: native.Array<number>): string {
        return android.util.Base64.encodeToString(arr, android.util.Base64.NO_WRAP);
    }

    private fromB64ToArray(str: string): native.Array<number> {
        return android.util.Base64.decode(str, android.util.Base64.NO_WRAP);
    }

    private clearPrefs() {
        const sharedPrefs = android.preference.PreferenceManager.getDefaultSharedPreferences(this.androidContext);
        const sharedPrefsEditor = sharedPrefs.edit();
        let removed = false;
        const prefKeys = sharedPrefs.getAll().keySet();
        for (let i = 0; i < prefKeys.size(); i++) {
            const key: string = prefKeys[i];
            if (key != null && key.indexOf(PrefsPrefix) === 0) {
                removed = true;
                sharedPrefsEditor.remove(key);
            }
        }
        if (removed) {
            sharedPrefsEditor.apply();
        }
    }

    private getPref(key: string): string {
        const sharedPrefs = android.preference.PreferenceManager.getDefaultSharedPreferences(this.androidContext);
        if (sharedPrefs.contains(key)) {
            const val = sharedPrefs.getString(key, '');
            if (val != null && val !== '') {
                return val;
            }
        }
        return null;
    }

    private removePref(key: string) {
        const sharedPrefs = android.preference.PreferenceManager.getDefaultSharedPreferences(this.androidContext);
        const sharedPrefsEditor = sharedPrefs.edit();
        sharedPrefsEditor.remove(key);
        sharedPrefsEditor.apply();
    }

    private savePref(key: string, value: string) {
        const sharedPrefs = android.preference.PreferenceManager.getDefaultSharedPreferences(this.androidContext);
        const sharedPrefsEditor = sharedPrefs.edit();
        sharedPrefsEditor.putString(key, value);
        sharedPrefsEditor.apply();
    }
}
