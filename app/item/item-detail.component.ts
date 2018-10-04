import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { Item } from "./item";
import { ItemService } from "./item.service";

import { StateService } from "jslib/abstractions/state.service";
import { I18nService } from "jslib/abstractions/i18n.service";
import { PlatformUtilsService } from "jslib/abstractions/platformUtils.service";
import { StorageService } from "jslib/abstractions/storage.service";
import { CryptoService } from "jslib/abstractions/crypto.service";
import { CryptoFunctionService } from "jslib/abstractions/cryptoFunction.service";
import { ApiService } from "jslib/abstractions/api.service";

import { MobileSecureStorageService } from "../../services/mobileSecureStorage.service";

import { Utils } from "jslib/misc/utils";
import { SymmetricCryptoKey } from "jslib/models/domain";
import { BroadcasterService } from "jslib/angular/services/broadcaster.service";
import { MessagingService } from "jslib/abstractions/messaging.service";
import { AuthService } from "jslib/abstractions/auth.service";

@Component({
    selector: "ns-details",
    moduleId: module.id,
    templateUrl: "./item-detail.component.html",
})
export class ItemDetailComponent implements OnInit {
    item: Item;

    constructor(
        private itemService: ItemService,
        private route: ActivatedRoute,
        private stateService: StateService,
        private i18nService: I18nService,
        private platformUtilsService: PlatformUtilsService,
        private storageService: StorageService,
        private cryptoFunctionService: CryptoFunctionService,
        private cryptoService: CryptoService,
        private mobileSecureStorageService: MobileSecureStorageService,
        private apiService: ApiService,
        private broadcasterService: BroadcasterService,
        private messagingService: MessagingService,
        private authService: AuthService,
    ) { }

    async ngOnInit() {
        const id = +this.route.snapshot.params["id"];
        this.item = this.itemService.getItem(id);
        await this.stateService.save('hello', 'world!');
        await this.storageService.save('hello', 'world!!!!!!!!!!!!!');
        const b64Secure = Utils.fromBufferToB64(Utils.fromUtf8ToArray('secure world!!!!!!!!!!!!!').buffer);
        await this.mobileSecureStorageService.save('hello', b64Secure);
        console.log('state: ' + (await this.stateService.get<string>('hello')));
        console.log('i18n: ' + this.i18nService.t('hello'));
        console.log('platform: ' + this.platformUtilsService.getDevice());
        console.log('storage: ' + (await this.storageService.get<string>('hello')));
        const gotb64secure = await this.mobileSecureStorageService.get<string>('hello');
        console.log('secure storage: ' + Utils.fromBufferToUtf8(Utils.fromB64ToArray(gotb64secure).buffer));
        console.log('pbkdf2: ' +
            Utils.fromBufferToB64(await this.cryptoFunctionService.pbkdf2('1234', '123456', 'sha256', 5000)));
        console.log('hash: ' +
            Utils.fromBufferToB64(await this.cryptoFunctionService.hash('1234', 'sha256')));
        const keyPair = await this.cryptoFunctionService.rsaGenerateKeyPair(2048);
        console.log('rsa pub: ' + Utils.fromBufferToB64(keyPair[0]));
        console.log('rsa priv: ' + Utils.fromBufferToB64(keyPair[1]));
        console.log('rsa pub2: ' + Utils.fromBufferToB64(await this.cryptoFunctionService.rsaExtractPublicKey(keyPair[1])));
        const enc = await this.cryptoFunctionService.rsaEncrypt(Utils.fromUtf8ToArray('Hi').buffer, keyPair[0], 'sha1');
        console.log('rsa enc: ' + Utils.fromBufferToB64(enc));
        const dec = await this.cryptoFunctionService.rsaDecrypt(enc, keyPair[1], 'sha1');
        console.log('rsa dec: ' + Utils.fromBufferToUtf8(dec));
        const key = await this.cryptoFunctionService.randomBytes(32);
        console.log('key: ' + Utils.fromBufferToB64(key));
        const iv = await this.cryptoFunctionService.randomBytes(16);
        console.log('iv: ' + Utils.fromBufferToB64(iv));
        const aesEnc = await this.cryptoFunctionService.aesEncrypt(Utils.fromUtf8ToArray('Hi2').buffer, iv, key);
        console.log('aes enc: ' + Utils.fromBufferToB64(aesEnc));
        const aesDec = await this.cryptoFunctionService.aesDecrypt(aesEnc, iv, key);
        console.log('aes dec: ' + Utils.fromBufferToUtf8(aesDec));
        console.log('hmac: ' +
            Utils.fromBufferToB64(await this.cryptoFunctionService.hmac(
                Utils.fromUtf8ToArray('Hi3').buffer, key, 'sha256')));
        console.log('hmac2: ' +
            Utils.fromBufferToB64(await this.cryptoFunctionService.hmac(
                Utils.fromUtf8ToArray('Hi3').buffer, key, 'sha256')));
        /*
        const bigKey = await this.cryptoFunctionService.randomBytes(64);
        const cKey = new SymmetricCryptoKey(bigKey);
        const cEnc = await this.cryptoService.encrypt('Hello World Enc');
        console.log('c enc: ' + cEnc.encryptedString);
        const cDec = await this.cryptoService.decryptToUtf8(cEnc, cKey);
        console.log('c dec: ' + cDec);
        */
        const response = await this.apiService.fetch(new Request('https://api.bitwarden.com/alive'));
        console.log('api response: ' + await response.text());

        this.broadcasterService.subscribe('ItemDetails', (message: any) => {
            console.log('Got message in ItemDetails');
            console.log(message);
        });
        this.messagingService.send('printFromItemDetails', { name: 'MEEE!!' });

        console.log(await this.authService.logIn('hello@bitwarden.com', 'somepassword'));
    }
}
