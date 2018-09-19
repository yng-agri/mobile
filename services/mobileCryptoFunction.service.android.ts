import { android as androidApp } from 'application';

import { Utils } from 'jslib/misc/utils';

import { MobileCryptoFunctionService as Common } from './mobileCryptoFunction.service.common';

declare var org: any;

const HashAlgorithms = {
    sha1: 'SHA-1',
    sha256: 'SHA-256',
    sha512: 'SHA-512',
    md5: 'MD5',
};

const HmacAlgorithms = {
    sha1: 'HmacSHA1',
    sha256: 'HmacSHA256',
    sha512: 'HmacSHA512',
};

export class MobileCryptoFunctionService extends Common {
    pbkdf2(password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number): Promise<ArrayBuffer> {
        return null;
    }

    hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512' | 'md5'): Promise<ArrayBuffer> {
        const md = java.security.MessageDigest.getInstance(HashAlgorithms[algorithm]);
        const hash = md.digest(this.toArr(value));
        return Promise.resolve(new Uint8Array(hash).buffer);
    }

    hmac(value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const keySpec = new javax.crypto.spec.SecretKeySpec(this.toArr(key), HmacAlgorithms[algorithm]);
        let mac = javax.crypto.Mac.getInstance(HmacAlgorithms[algorithm]);
        mac.init(keySpec);
        const hmac = mac.doFinal(this.toArr(value));
        return Promise.resolve(new Uint8Array(hmac).buffer);
    }

    aesEncrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const keySpec = new javax.crypto.spec.SecretKeySpec(this.toArr(key), 'AES');
        const ivSpec = new javax.crypto.spec.IvParameterSpec(this.toArr(iv));
        let cipher = javax.crypto.Cipher.getInstance('AES/CBC/PKCS5Padding'); // TODO: what padding?
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, keySpec, ivSpec);
        const encBytes = cipher.doFinal(this.toArr(data));
        return Promise.resolve(new Uint8Array(encBytes).buffer);
    }

    aesDecrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const keySpec = new javax.crypto.spec.SecretKeySpec(this.toArr(key), 'AES');
        const ivSpec = new javax.crypto.spec.IvParameterSpec(this.toArr(iv));
        let cipher = javax.crypto.Cipher.getInstance('AES/CBC/PKCS5Padding'); // TODO: what padding?
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, keySpec, ivSpec);
        const decBytes = cipher.doFinal(this.toArr(data));
        return Promise.resolve(new Uint8Array(decBytes).buffer);
    }

    rsaEncrypt(data: ArrayBuffer, publicKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        return null;
    }

    rsaDecrypt(data: ArrayBuffer, privateKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        return null;
    }

    rsaExtractPublicKey(privateKey: ArrayBuffer): Promise<ArrayBuffer> {
        return null;
    }

    async rsaGenerateKeyPair(length: 1024 | 2048 | 4096): Promise<[ArrayBuffer, ArrayBuffer]> {
        return null;
    }

    randomBytes(length: number): Promise<ArrayBuffer> {
        const random = new java.security.SecureRandom();
        const bytes = [length];
        random.nextBytes(bytes);
        return Promise.resolve(new Uint8Array(bytes).buffer);
    }

    private toArr(value: string | ArrayBuffer): number[] {
        if (typeof (value) === 'string') {
            return Array.from(Utils.fromUtf8ToArray(value));
        }
        return Array.from(new Uint8Array(value));
    }
}
