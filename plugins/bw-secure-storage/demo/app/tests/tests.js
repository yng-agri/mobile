var application = require('tns-core-modules/application');

var Utils = require('./utils').MobileUtils;
var BwSecureStorage = require('nativescript-bw-secure-storage').BwSecureStorage;
var bwSecureStorage = new BwSecureStorage();
if (application.android) {
    bwSecureStorage.init({ androidContext: application.android.context });
} else {
    bwSecureStorage.init();
}

it('should save and then get the same value', async () => {
    const key = 'testKey';
    const val = 'some string to be secured';
    const valB64 = Utils.fromBufferToB64(Utils.fromUtf8ToArray(val).buffer);
    await bwSecureStorage.save(key, valB64);
    const gotVal = await bwSecureStorage.get(key);
    expect(gotVal).toBe(valB64);
});

it('should save and then delete the key', async () => {
    const key = 'testKey2';
    const val = 'some string to be secured';
    const valB64 = Utils.fromBufferToB64(Utils.fromUtf8ToArray(val).buffer);
    await bwSecureStorage.save(key, valB64);
    const gotVal = await bwSecureStorage.get(key);
    expect(gotVal).toBe(valB64);
    await bwSecureStorage.remove(key);
    const gotVal2 = await bwSecureStorage.get(key);
    expect(gotVal2).toBe(null);
});

it('should save and then update the key with a new value', async () => {
    const key = 'testKey3';
    const val = 'some string to be secured';
    const val2 = 'the new value';
    const valB64 = Utils.fromBufferToB64(Utils.fromUtf8ToArray(val).buffer);
    const val2B64 = Utils.fromBufferToB64(Utils.fromUtf8ToArray(val2).buffer);
    await bwSecureStorage.save(key, valB64);
    const gotVal = await bwSecureStorage.get(key);
    expect(gotVal).toBe(valB64);
    await bwSecureStorage.save(key, val2B64);
    const gotVal2 = await bwSecureStorage.get(key);
    expect(gotVal2).toBe(val2B64);
});
