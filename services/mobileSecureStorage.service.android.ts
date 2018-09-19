import { android as androidApp } from 'application';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { StorageService } from 'jslib/abstractions/storage.service';

import { Utils } from 'jslib/misc/utils';

import { CipherString } from 'jslib/models/domain/cipherString';
import { SymmetricCryptoKey } from 'jslib/models/domain/symmetricCryptoKey';

const AndroidKeyStore = 'AndroidKeyStore';
const AesMode = 'AES/GCM/NoPadding';
const KeyAlias = 'bitwardenKey2';
const SettingsPrefix = 'ksSecured2:';
const AesKey = 'ksSecured2:aesKeyForService';

export class MobileSecureStorageService implements StorageService {
    private keyStore: java.security.KeyStore;
    private oldAndroid = false;
    private rsaMode: string;

    constructor(private storageService: StorageService, private cryptoService: () => CryptoService) {
        this.oldAndroid = android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.M;
        this.rsaMode = this.oldAndroid ? 'RSA/ECB/PKCS1Padding' : 'RSA/ECB/OAEPWithSHA-1AndMGF1Padding';
    }

    async init() {
        this.keyStore = java.security.KeyStore.getInstance(AndroidKeyStore);
        this.keyStore.load(null);

        try {
            this.generateKeyStore(true);
        } catch {
            this.generateKeyStore(false);
        }

        await this.generateAesKey();
    }

    async get<T>(key: string): Promise<T> {
        const formattedKey = SettingsPrefix + key;
        const cs = await this.storageService.get<string>(formattedKey);
        if (cs == null) {
            return null;
        }
        const aesKey = await this.getAesKey();
        if (aesKey == null) {
            return null;
        }
        try {
            const buffer = await this.cryptoService().decryptToBytes(new CipherString(cs), aesKey);
            return Utils.fromBufferToB64(buffer) as any;
        } catch {
            console.error('Failed to decrypt from secure storage.');
            await this.storageService.remove(formattedKey);
            return null;
        }
    }

    async save(key: string, obj: any): Promise<any> {
        const formattedKey = SettingsPrefix + key;
        if (obj === null) {
            await this.storageService.remove(formattedKey);
            return;
        }

        if (typeof (obj) !== 'string') {
            throw new Error('Only base 64 strings can be stored in android key store.');
        }

        const aesKey = await this.getAesKey();
        if (aesKey == null) {
            return;
        }

        try {
            const arr = Utils.fromB64ToArray(obj);
            const cipherString = await this.cryptoService().encrypt(arr.buffer, aesKey);
            await this.storageService.save(formattedKey, cipherString.encryptedString);
        } catch {
            console.error('Failed to encrypt to secure storage.');
        }
    }

    remove(key: string): Promise<any> {
        return this.storageService.remove(SettingsPrefix + key);
    }

    private async getAesKey(): Promise<SymmetricCryptoKey> {
        const encKey = await this.storageService.get<string>(AesKey);
        if (encKey == null) {
            return null;
        }

        try {
            const parts = encKey.split('|');
            if (parts.length < 2) {
                return null;
            }
            const ivBytes = Utils.fromB64ToArray(parts[0]);
            const encKeyBytes = Utils.fromB64ToArray(parts[1]);
            const key = this.aesDecrypt(ivBytes.buffer, encKeyBytes.buffer);
            return new SymmetricCryptoKey(key);
        } catch {
            this.keyStore.deleteEntry(KeyAlias);
            await this.storageService.remove(AesKey);
            return null;
        }
    }

    private async generateKeyStore(withDate: boolean) {
        if (this.keyStore.containsAlias(KeyAlias)) {
            return;
        }

        // TODO: Clear settings?

        const end = java.util.Calendar.getInstance();
        end.add(java.util.Calendar.YEAR, 99);

        if (this.oldAndroid) {
            const subject = new javax.security.auth.x500.X500Principal('CN=' + KeyAlias);
            const builder = new android.security.KeyPairGeneratorSpec.Builder(androidApp.context)
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

    private async generateAesKey() {
        const existingKey = await this.storageService.get<string>(AesKey);
        if (existingKey != null) {
            return;
        }
        const random = new java.security.SecureRandom();
        const keyBytes = Array.create('byte', 64);
        random.nextBytes(keyBytes);
        const key = this.toBuf(keyBytes);
        const encKey = this.oldAndroid ? this.rsaEncrypt(key) : this.aesEncrypt(key);
        await this.storageService.save(AesKey, encKey);
    }

    private aesEncrypt(input: ArrayBuffer): string {
        let entry = this.keyStore.getKey(KeyAlias, null);
        let cipher = javax.crypto.Cipher.getInstance(AesMode);
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, entry);
        const encBytes = cipher.doFinal(this.toByteArr(input));
        const ivBytes = cipher.getIV();
        return Utils.fromBufferToB64(this.toBuf(ivBytes)) + '|' + Utils.fromBufferToB64(this.toBuf(encBytes));
    }

    private aesDecrypt(iv: ArrayBuffer, encData: ArrayBuffer): ArrayBuffer {
        let entry = this.keyStore.getKey(KeyAlias, null);
        let cipher = javax.crypto.Cipher.getInstance(AesMode);
        const spec = new javax.crypto.spec.GCMParameterSpec(128, this.toByteArr(iv));
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, entry, spec);
        const decBytes = cipher.doFinal(this.toByteArr(encData));
        return this.toBuf(decBytes);
    }

    private rsaEncrypt(data: ArrayBuffer): string {
        let entry = this.getRsaKeyEntry(KeyAlias);
        let cipher = javax.crypto.Cipher.getInstance(this.rsaMode);
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, entry.getCertificate().getPublicKey());
        const cipherText = cipher.doFinal(this.toByteArr(data));
        return Utils.fromBufferToB64(this.toBuf(cipherText));
    }

    private rsaDecrypt(encData: ArrayBuffer): ArrayBuffer {
        let entry = this.getRsaKeyEntry(KeyAlias);
        let cipher = javax.crypto.Cipher.getInstance(this.rsaMode);
        if (this.oldAndroid) {
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, entry.getPrivateKey());
        } else {
            cipher.init(javax.crypto.Cipher.DECRYPT_MODE, entry.getPrivateKey(),
                javax.crypto.spec.OAEPParameterSpec.DEFAULT);
        }
        const plainText = cipher.doFinal(Array.from(new Uint8Array(encData)));
        return this.toBuf(plainText);
    }

    private getRsaKeyEntry(alias: string) {
        return this.keyStore.getEntry(alias, null) as java.security.KeyStore.PrivateKeyEntry;
    }

    private toByteArr(value: string | ArrayBuffer): native.Array<number> {
        let arr: Uint8Array;
        if (typeof (value) === 'string') {
            arr = Utils.fromUtf8ToArray(value);
        } else {
            arr = new Uint8Array(value);
        }
        const bytes = Array.create('byte', arr.length);
        arr.forEach((v, i) => bytes[i] = v);
        return bytes;
    }

    private toBuf(value: native.Array<number>): ArrayBuffer {
        return new Uint8Array(value).buffer;
    }
}
