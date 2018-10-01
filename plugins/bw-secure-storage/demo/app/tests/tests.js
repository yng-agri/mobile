var application = require('tns-core-modules/application');

var Utils = require('./utils').MobileUtils;
var BwSecureStorage = require('nativescript-bw-secure-storage').BwSecureStorage;
var bwSecureStorage = new BwSecureStorage();
if (application.android) {
    bwSecureStorage.init({ androidContext: application.android.context });
} else {
    bwSecureStorage.init();
}

describe('save', () => {
    it('should work', async () => {
        const key = 'test';
        const val = 'some string';
        const valB64 = Utils.fromBufferToB64(Utils.fromUtf8ToArray(val).buffer);
        await bwSecureStorage.save(key, valB64);
        const gotVal = await bwSecureStorage.get(key);
        expect(Utils.fromBufferToB64(gotVal)).toBe(valB64);
    });
});
