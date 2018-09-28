import * as forge from 'node-forge';

export class BwCrypto {
    constructor() {
        forge.options.usePureJavaScript = true;
    }

    pbkdf2(password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number): Promise<ArrayBuffer> {
        const passwordData = this.toNSData(password);
        const saltData = this.toNSData(salt);
        let prf = kCCPRFHmacAlgSHA256;
        let size = 32;
        if (algorithm === 'sha512') {
            prf = kCCPRFHmacAlgSHA512;
            size = 64;
        } else if (algorithm !== 'sha256') {
            throw new Error('Unsupported algorithm.');
        }
        const keyRef = new interop.Reference(interop.types.uint8, interop.alloc(size));
        CCKeyDerivationPBKDF(2, passwordData.bytes as any, passwordData.length,
            saltData.bytes as any, saltData.length, prf, iterations, keyRef as any, size);
        const keyData = NSData.dataWithBytesLength(keyRef, size);
        return Promise.resolve(interop.bufferFromData(keyData));
    }

    hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512' | 'md5'): Promise<ArrayBuffer> {
        const data = this.toNSData(value);
        let digest: NSData = null;
        if (algorithm === 'sha1') {
            const digestRef = new interop.Reference(interop.types.uint8, interop.alloc(20));
            CC_SHA1(data.bytes, data.length, digestRef as any);
            digest = NSData.dataWithBytesLength(digestRef, 20);
        } else if (algorithm === 'sha256') {
            const digestRef = new interop.Reference(interop.types.uint8, interop.alloc(32));
            CC_SHA256(data.bytes, data.length, digestRef as any);
            digest = NSData.dataWithBytesLength(digestRef, 32);
        } else if (algorithm === 'sha512') {
            const digestRef = new interop.Reference(interop.types.uint8, interop.alloc(64));
            CC_SHA512(data.bytes, data.length, digestRef as any);
            digest = NSData.dataWithBytesLength(digestRef, 64);
        } else if (algorithm === 'md5') {
            const digestRef = new interop.Reference(interop.types.uint8, interop.alloc(16));
            CC_MD5(data.bytes, data.length, digestRef as any);
            digest = NSData.dataWithBytesLength(digestRef, 16);
        } else {
            throw new Error('Algorithm not supported.');
        }
        if (digest == null) {
            throw new Error('Digest is null');
        }
        return Promise.resolve(interop.bufferFromData(digest));
    }

    hmac(value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const keyData = this.toNSData(key);
        const valueData = this.toNSData(value);
        let alg = kCCHmacAlgSHA1;
        let size = 20;
        if (algorithm === 'sha256') {
            alg = kCCHmacAlgSHA256;
            size = 32;
        } else if (algorithm === 'sha512') {
            alg = kCCHmacAlgSHA512;
            size = 64;
        } else if (algorithm !== 'sha1') {
            throw new Error('Algorithm not supported.');
        }
        const macRef = new interop.Reference(interop.types.uint8, interop.alloc(size));
        CCHmac(alg, keyData.bytes, keyData.length, valueData.bytes, valueData.length, macRef);
        const macData = NSData.dataWithBytesLength(macRef, size);
        return Promise.resolve(interop.bufferFromData(macData));
    }

    aesEncrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const ivData = this.toNSData(iv);
        const inData = this.toNSData(data);
        const keyData = this.toNSData(key);
        const outData = NSMutableData.dataWithLength(inData.length + kCCBlockSizeAES128);
        const outSize = new interop.Reference(interop.types.uint64, interop.alloc(outData.length));
        CCCrypt(kCCEncrypt, kCCAlgorithmAES128, kCCOptionPKCS7Padding, keyData.bytes, keyData.length,
            ivData.bytes, inData.bytes, inData.length, outData.mutableBytes, outData.length, outSize);
        const encData = NSData.dataWithBytesNoCopyLength(outData.mutableBytes, outSize.value);
        return Promise.resolve(interop.bufferFromData(encData));
    }

    aesDecrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const ivData = this.toNSData(iv);
        const inData = this.toNSData(data);
        const keyData = this.toNSData(key);
        const outData = NSMutableData.dataWithLength(inData.length + kCCBlockSizeAES128);
        const outSize = new interop.Reference(interop.types.uint64, interop.alloc(outData.length));
        CCCrypt(kCCDecrypt, kCCAlgorithmAES128, kCCOptionPKCS7Padding, keyData.bytes, keyData.length,
            ivData.bytes, inData.bytes, inData.length, outData.mutableBytes, outData.length, outSize);
        const decData = NSData.dataWithBytesNoCopyLength(outData.mutableBytes, outSize.value);
        return Promise.resolve(interop.bufferFromData(decData));
    }

    rsaEncrypt(data: ArrayBuffer, publicKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        return Promise.resolve(null);
    }

    rsaDecrypt(data: ArrayBuffer, privateKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        return Promise.resolve(null);
    }

    rsaExtractPublicKey(privateKey: ArrayBuffer): Promise<ArrayBuffer> {
        const privateKeyByteString = String.fromCharCode.apply(null, new Uint8Array(privateKey));
        const privateKeyAsn1 = forge.asn1.fromDer(privateKeyByteString);
        const forgePrivateKey = (forge as any).pki.privateKeyFromAsn1(privateKeyAsn1);
        const forgePublicKey = (forge.pki as any).setRsaPublicKey(forgePrivateKey.n, forgePrivateKey.e);
        const publicKeyAsn1 = (forge.pki as any).publicKeyToAsn1(forgePublicKey);
        const publicKeyByteString = forge.asn1.toDer(publicKeyAsn1).data;
        return Promise.resolve(this.fromByteStringToArray(publicKeyByteString).buffer);
    }

    rsaGenerateKeyPair(length: 1024 | 2048 | 4096): Promise<[ArrayBuffer, ArrayBuffer]> {
        const tag = 'com.8bit.bitwarden.' + (NSUUID.alloc().init().UUIDString).toLowerCase();

        const publicAttr = NSMutableDictionary.new();
        publicAttr.setValueForKey(true, kSecAttrIsPermanent);
        publicAttr.setValueForKey(tag + '.publicKey', kSecAttrApplicationTag);
        publicAttr.setValueForKey(kSecClassKey, kSecClass);
        publicAttr.setValueForKey(kCFBooleanTrue, kSecReturnData);

        const privateAttr = NSMutableDictionary.new();
        privateAttr.setValueForKey(true, kSecAttrIsPermanent);
        privateAttr.setValueForKey(tag + '.privateKey', kSecAttrApplicationTag);
        privateAttr.setValueForKey(kSecClassKey, kSecClass);
        privateAttr.setValueForKey(kCFBooleanTrue, kSecReturnData);

        const pairAttr = NSMutableDictionary.new();
        pairAttr.setValueForKey(kSecAttrKeyTypeRSA, kSecAttrKeyType);
        pairAttr.setValueForKey(length, kSecAttrKeySizeInBits);
        pairAttr.setObjectForKey(publicAttr, kSecPublicKeyAttrs);
        pairAttr.setObjectForKey(privateAttr, kSecPrivateKeyAttrs);

        const publicRef = new interop.Reference<any>();
        const privateRef = new interop.Reference<any>();
        const status = SecKeyGeneratePair(pairAttr, publicRef, privateRef);
        if (status !== noErr) {
            throw new Error('SecKeyGeneratePair failed with status ' + status + '.');
        }
        const privateResultRef = new interop.Reference<any>();
        const privateStatus = SecItemCopyMatching(privateAttr, privateResultRef);
        if (privateStatus !== noErr) {
            throw new Error('SecItemCopyMatching failed for private key with status ' + privateStatus + '.');
        }

        const privateData = interop.bufferFromData(privateResultRef.value);
        return Promise.resolve(this.privateKeyToDerPair(privateData));
    }

    randomBytes(length: number): Promise<ArrayBuffer> {
        const dataRef = new interop.Reference(interop.types.uint8, interop.alloc(length));
        const status = SecRandomCopyBytes(kSecRandomDefault, length, dataRef);
        if (status === noErr) {
            const data = NSData.dataWithBytesLength(dataRef, length);
            return Promise.resolve(interop.bufferFromData(data));
        } else {
            throw new Error('SecRandomCopyBytes failed with status ' + status + '.');
        }
    }

    private toNSData(value: string | ArrayBuffer): NSData {
        if (typeof (value) === 'string') {
            const str = NSString.stringWithString(value);
            return str.dataUsingEncoding(NSUTF8StringEncoding);
        } else {
            const data = new Uint8Array(value);
            const intRef = new interop.Reference(interop.types.int8, interop.alloc(data.length));
            data.forEach((d, i) => intRef[i] = d);
            return NSData.dataWithBytesLength(intRef, data.length);
        }
    }

    private privateKeyToDerPair(pkcs1PrivateKey: ArrayBuffer): [ArrayBuffer, ArrayBuffer] {
        const pkcs1ByteString = String.fromCharCode.apply(null, new Uint8Array(pkcs1PrivateKey));
        const asn1 = forge.asn1.fromDer(pkcs1ByteString);

        const privateKey = forge.pki.privateKeyFromAsn1(asn1);
        const rsaPrivateKey = forge.pki.privateKeyToAsn1(privateKey);
        const privateKeyInfo = forge.pki.wrapRsaPrivateKey(rsaPrivateKey);
        const derPrivateKey = forge.asn1.toDer(privateKeyInfo).getBytes();

        const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
        const rsaPublicKey = forge.pki.publicKeyToAsn1(publicKey);
        const derPublicKey = forge.asn1.toDer(rsaPublicKey).getBytes();

        const privateKeyArr = this.fromByteStringToArray(derPrivateKey).buffer;
        const publicKeyArr = this.fromByteStringToArray(derPublicKey).buffer;
        return [publicKeyArr, privateKeyArr];
    }

    private fromByteStringToArray(str: string): Uint8Array {
        const arr = new Uint8Array(str.length);
        for (let i = 0; i < str.length; i++) {
            arr[i] = str.charCodeAt(i);
        }
        return arr;
    }
}
