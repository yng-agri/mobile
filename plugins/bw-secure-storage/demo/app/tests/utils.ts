import { isIOS } from 'tns-core-modules/platform';

export class MobileUtils {
    static fromBufferToB64(buffer: ArrayBuffer): string {
        if (isIOS) {
            return MobileUtils.fromBufferToIosNsData(buffer).base64EncodedStringWithOptions(0);
        } else {
            return android.util.Base64.encodeToString(MobileUtils.fromBufferToAndroidByteArr(buffer),
                android.util.Base64.NO_WRAP);
        }
    }

    static fromBufferToHex(buffer: ArrayBuffer): string {
        const bytes = new Uint8Array(buffer);
        return Array.prototype.map.call(bytes, (x: number) => ('00' + x.toString(16)).slice(-2)).join('');
    }

    static fromBufferToUtf8(buffer: ArrayBuffer): string {
        if (isIOS) {
            const data = MobileUtils.fromBufferToIosNsData(buffer);
            const str = NSString.alloc().initWithDataEncoding(data, NSUTF8StringEncoding);
            return str.toString();
        } else {
            return new java.lang.String(MobileUtils.fromBufferToAndroidByteArr(buffer), 'UTF-8').toString();
        }
    }

    static fromUtf8ToArray(str: string): Uint8Array {
        if (isIOS) {
            const nsStr = NSString.stringWithString(str);
            const data = nsStr.dataUsingEncoding(NSUTF8StringEncoding);
            const buffer = interop.bufferFromData(data);
            return new Uint8Array(buffer);
        } else {
            const strVal = new java.lang.String(str);
            const arr = strVal.getBytes('UTF-8');
            return new Uint8Array(arr);
        }
    }

    static fromB64ToArray(str: string): Uint8Array {
        if (isIOS) {
            const data = NSData.alloc().initWithBase64EncodedStringOptions(str, 0);
            return new Uint8Array(interop.bufferFromData(data));
        } else {
            const arr = android.util.Base64.decode(str, android.util.Base64.NO_WRAP);
            return new Uint8Array(arr);
        }
    }

    private static fromBufferToAndroidByteArr(buffer: ArrayBuffer): any {
        const arr = new Uint8Array(buffer);
        const bytes = Array.create('byte', arr.length);
        arr.forEach((v, i) => bytes[i] = v);
        return bytes;
    }

    private static fromBufferToIosNsData(buffer: ArrayBuffer): NSData {
        const data = new Uint8Array(buffer);
        const intRef = new interop.Reference(interop.types.int8, interop.alloc(data.length));
        data.forEach((d, i) => intRef[i] = d);
        return NSData.dataWithBytesLength(intRef, data.length);
    }
}
