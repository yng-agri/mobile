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

const RsaOaepAlgorithms = {
    sha1: 'RSA/ECB/OAEPWithSHA1AndMGF1Padding',
    sha256: 'RSA/ECB/OAEPWithSHA-256AndMGF1Padding',
};

export class BwCrypto {
    pbkdf2(password: string | ArrayBuffer, salt: string | ArrayBuffer, algorithm: 'sha256' | 'sha512',
        iterations: number): Promise<ArrayBuffer> {
        const digest = algorithm === 'sha256' ? new org.spongycastle.crypto.digests.SHA256Digest() :
            new org.spongycastle.crypto.digests.SHA512Digest();
        const generator = new org.spongycastle.crypto.generators.PKCS5S2ParametersGenerator(digest);
        generator.init(this.toByteArr(password), this.toByteArr(salt), iterations);
        const param: any = generator.generateDerivedMacParameters(algorithm === 'sha256' ? 256 : 512);
        const key = param.getKey();
        return Promise.resolve(this.toBuf(key));
    }

    hash(value: string | ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512' | 'md5'): Promise<ArrayBuffer> {
        const md = java.security.MessageDigest.getInstance(HashAlgorithms[algorithm]);
        const hash = md.digest(this.toByteArr(value));
        return Promise.resolve(this.toBuf(hash));
    }

    hmac(value: ArrayBuffer, key: ArrayBuffer, algorithm: 'sha1' | 'sha256' | 'sha512'): Promise<ArrayBuffer> {
        const keySpec = new javax.crypto.spec.SecretKeySpec(this.toByteArr(key), HmacAlgorithms[algorithm]);
        const mac = javax.crypto.Mac.getInstance(HmacAlgorithms[algorithm]);
        mac.init(keySpec);
        const hmac = mac.doFinal(this.toByteArr(value));
        return Promise.resolve(this.toBuf(hmac));
    }

    aesEncrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const keySpec = new javax.crypto.spec.SecretKeySpec(this.toByteArr(key), 'AES');
        const ivSpec = new javax.crypto.spec.IvParameterSpec(this.toByteArr(iv));
        const cipher = javax.crypto.Cipher.getInstance('AES/CBC/PKCS5Padding'); // TODO: what padding?
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, keySpec, ivSpec);
        const encBytes = cipher.doFinal(this.toByteArr(data));
        return Promise.resolve(this.toBuf(encBytes));
    }

    aesDecrypt(data: ArrayBuffer, iv: ArrayBuffer, key: ArrayBuffer): Promise<ArrayBuffer> {
        const keySpec = new javax.crypto.spec.SecretKeySpec(this.toByteArr(key), 'AES');
        const ivSpec = new javax.crypto.spec.IvParameterSpec(this.toByteArr(iv));
        const cipher = javax.crypto.Cipher.getInstance('AES/CBC/PKCS5Padding'); // TODO: what padding?
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, keySpec, ivSpec);
        const decBytes = cipher.doFinal(this.toByteArr(data));
        return Promise.resolve(this.toBuf(decBytes));
    }

    rsaEncrypt(data: ArrayBuffer, publicKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        // Convert from ASN1
        const decoder = new org.spongycastle.asn1.ASN1InputStream(this.toByteArr(publicKey));
        const topSequence = decoder.readObject();
        const bitString = topSequence.getObjectAt(1);
        const bitStringSequence = org.spongycastle.asn1.ASN1Sequence.getInstance(
            org.spongycastle.asn1.ASN1Primitive.fromByteArray(bitString.getOctets()));
        const modulus = bitStringSequence.getObjectAt(0);
        const exponent = bitStringSequence.getObjectAt(1);
        decoder.close();
        const keySpec = new java.security.spec.RSAPublicKeySpec(modulus.getPositiveValue(),
            exponent.getPositiveValue());
        const factory = java.security.KeyFactory.getInstance('RSA');
        const pub = factory.generatePublic(keySpec);
        // Encrypt
        const cipher = javax.crypto.Cipher.getInstance(RsaOaepAlgorithms[algorithm]);
        cipher.init(javax.crypto.Cipher.ENCRYPT_MODE, pub);
        const cipherText = cipher.doFinal(this.toByteArr(data));
        return Promise.resolve(this.toBuf(cipherText));
    }

    rsaDecrypt(data: ArrayBuffer, privateKey: ArrayBuffer, algorithm: 'sha1' | 'sha256'): Promise<ArrayBuffer> {
        // Convert from PKCS8
        const pkcs8Spec = new java.security.spec.PKCS8EncodedKeySpec(this.toByteArr(privateKey));
        const factory = java.security.KeyFactory.getInstance('RSA');
        const priv = factory.generatePrivate(pkcs8Spec);
        // Decrypt
        const cipher = javax.crypto.Cipher.getInstance(RsaOaepAlgorithms[algorithm]);
        cipher.init(javax.crypto.Cipher.DECRYPT_MODE, priv);
        const cipherText = cipher.doFinal(this.toByteArr(data));
        return Promise.resolve(this.toBuf(cipherText));
    }

    rsaExtractPublicKey(privateKey: ArrayBuffer): Promise<ArrayBuffer> {
        // Convert from PKCS8
        const pkcs8Spec = new java.security.spec.PKCS8EncodedKeySpec(this.toByteArr(privateKey));
        const factory = java.security.KeyFactory.getInstance('RSA');
        const priv = factory.generatePrivate(pkcs8Spec);
        // Extract
        const privKeySpec = factory.getKeySpec(priv,
            java.security.spec.RSAPrivateKeySpec.class) as java.security.spec.RSAPrivateKeySpec;
        const pubKeySpec = new java.security.spec.RSAPublicKeySpec(privKeySpec.getModulus(),
            java.math.BigInteger.valueOf(65537));
        const pub = factory.generatePublic(pubKeySpec).getEncoded();
        return Promise.resolve(this.toBuf(pub));
    }

    rsaGenerateKeyPair(length: 1024 | 2048 | 4096): Promise<[ArrayBuffer, ArrayBuffer]> {
        const generator = java.security.KeyPairGenerator.getInstance('RSA');
        generator.initialize(length);
        const keyPair = generator.genKeyPair();
        const publicKey = keyPair.getPublic().getEncoded();
        const privateKey = keyPair.getPrivate().getEncoded();
        const result = [this.toBuf(publicKey), this.toBuf(privateKey)];
        return Promise.resolve(result as [ArrayBuffer, ArrayBuffer]);
    }

    randomBytes(length: number): Promise<ArrayBuffer> {
        const random = new java.security.SecureRandom();
        const bytes = Array.create('byte', length);
        random.nextBytes(bytes);
        return Promise.resolve(this.toBuf(bytes));
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
}
