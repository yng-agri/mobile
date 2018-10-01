const AndroidKeyStore = 'AndroidKeyStore';
const AesMode = 'AES/GCM/NoPadding';
const KeyAlias = 'bitwardenKey3';
const SettingsPrefix = 'ksSecured3:';
const AesKey = 'ksSecured3:aesKeyForService';

export class BwSecureStorage {
    private keyStore: java.security.KeyStore;
    private oldAndroid = false;
    private rsaMode: string;
    private androidContext: android.content.Context;

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
    }

    get<T>(key: string): Promise<T> {
        const formattedKey = SettingsPrefix + key;
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
            const buffer = this.aesDecrypt(ivBytes.buffer, encBytes.buffer, aesKey);
            return Promise.resolve(this.fromBufferToB64(buffer) as any);
        } catch {
            // tslint:disable-next-line
            console.error('Failed to decrypt from secure storage.');
            this.removePref(formattedKey);
            return Promise.resolve(null);
        }
    }

    save(key: string, obj: any): Promise<any> {
        const formattedKey = SettingsPrefix + key;
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
            const cs = this.aesEncrypt(arr.buffer, aesKey);
            this.savePref(formattedKey, cs);
        } catch {
            // tslint:disable-next-line
            console.error('Failed to encrypt to secure storage.');
        }
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        this.removePref(SettingsPrefix + key);
        return Promise.resolve();
    }

    private getAesKey(): ArrayBuffer {
        const encKey = this.getPref(AesKey);
        if (encKey == null) {
            return null;
        }

        try {
            if (this.oldAndroid) {
                const encKeyBytes = this.fromB64ToArray(encKey);
                const key = this.rsaDecrypt(encKeyBytes.buffer);
                return key;
            } else {
                const parts = encKey.split('|');
                if (parts.length < 2) {
                    return null;
                }
                const ivBytes = this.fromB64ToArray(parts[0]);
                const encKeyBytes = this.fromB64ToArray(parts[1]);
                const key = this.aesDecrypt(ivBytes.buffer, encKeyBytes.buffer);
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

        this.clearSettings();
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
            const gen = java.security.KeyPairGenerator.getInstance(
                android.security.keystore.KeyProperties.KEY_ALGORITHM_RSA, AndroidKeyStore);
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
                builder.setKeyValidityStart(new java.util.Date(0)).setKeyValidityEnd(new java.util.Date(end.time));
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
        const random = new java.security.SecureRandom();
        const keyBytes = Array.create('byte', 32);
        random.nextBytes(keyBytes);
        const key = this.toBuf(keyBytes);
        const encKey = this.oldAndroid ? this.rsaEncrypt(key) : this.aesEncrypt(key);
        this.savePref(AesKey, encKey);
    }

    private aesEncrypt(input: ArrayBuffer, key: ArrayBuffer = null): string {
        const entry = key != null ? new javax.crypto.spec.SecretKeySpec(this.toByteArr(key), 'AES') :
            this.keyStore.getKey(KeyAlias, null);
        const cipher = javax.crypto.Cipher.getInstance(AesMode);
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, entry);
        const encBytes = cipher.doFinal(this.toByteArr(input));
        const ivBytes = cipher.getIV();
        return this.fromBufferToB64(this.toBuf(ivBytes)) + '|' + this.fromBufferToB64(this.toBuf(encBytes));
    }

    private aesDecrypt(iv: ArrayBuffer, encData: ArrayBuffer, key: ArrayBuffer = null): ArrayBuffer {
        const entry = key != null ? new javax.crypto.spec.SecretKeySpec(this.toByteArr(key), 'AES') :
            this.keyStore.getKey(KeyAlias, null);
        const cipher = javax.crypto.Cipher.getInstance(AesMode);
        const spec = new javax.crypto.spec.GCMParameterSpec(128, this.toByteArr(iv));
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, entry, spec);
        const decBytes = cipher.doFinal(this.toByteArr(encData));
        return this.toBuf(decBytes);
    }

    private rsaEncrypt(data: ArrayBuffer): string {
        const entry = this.getRsaKeyEntry(KeyAlias);
        const cipher = javax.crypto.Cipher.getInstance(this.rsaMode);
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, entry.getCertificate().getPublicKey());
        const cipherText = cipher.doFinal(this.toByteArr(data));
        return this.fromBufferToB64(this.toBuf(cipherText));
    }

    private rsaDecrypt(encData: ArrayBuffer): ArrayBuffer {
        const entry = this.getRsaKeyEntry(KeyAlias);
        const cipher = javax.crypto.Cipher.getInstance(this.rsaMode);
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, entry.getPrivateKey());
        const plainText = cipher.doFinal(this.toByteArr(encData));
        return this.toBuf(plainText);
    }

    private getRsaKeyEntry(alias: string) {
        return this.keyStore.getEntry(alias, null) as java.security.KeyStore.PrivateKeyEntry;
    }

    private toByteArr(value: string | ArrayBuffer): native.Array<number> {
        if (typeof (value) === 'string') {
            const strVal = new java.lang.String(value);
            return strVal.getBytes('UTF-8');
        } else {
            const arr = new Uint8Array(value);
            const bytes = Array.create('byte', arr.length);
            arr.forEach((v, i) => bytes[i] = v);
            return bytes;
        }
    }

    private toBuf(value: native.Array<number>): ArrayBuffer {
        return new Uint8Array(value).buffer;
    }

    private fromBufferToB64(buffer: ArrayBuffer): string {
        return android.util.Base64.encodeToString(this.toByteArr(buffer), android.util.Base64.NO_WRAP);
    }

    private fromB64ToArray(str: string): Uint8Array {
        const arr = android.util.Base64.decode(str, android.util.Base64.NO_WRAP);
        return new Uint8Array(arr);
    }

    private clearSettings() {
        const sharedPrefs = android.preference.PreferenceManager.getDefaultSharedPreferences(this.androidContext);
        const sharedPrefsEditor = sharedPrefs.edit();
        let removed = false;
        const prefKeys = sharedPrefs.getAll().keySet();
        for (let i = 0; i < prefKeys.size(); i++) {
            const key: string = prefKeys[i];
            if (key.indexOf(SettingsPrefix) === 0) {
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
