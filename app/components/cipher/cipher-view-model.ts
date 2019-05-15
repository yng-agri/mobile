import {
    EventData,
    Observable,
} from 'tns-core-modules/data/observable';

import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';

import { fromFile, ImageSource, fromNativeSource, fromResource } from 'tns-core-modules/image-source/image-source';
import { Cache } from 'tns-core-modules/ui/image-cache';

import { CipherType } from 'jslib/enums/cipherType';

import { CipherView } from 'jslib/models/view/cipherView';

import { Utils } from 'jslib/misc/utils';
import { ObservableProperty } from '~/misc/observable-property.decorator';

const IconMap: any = {
    'fa-globe': String.fromCharCode(0xf0ac),
    'fa-sticky-note-o': String.fromCharCode(0xf24a),
    'fa-id-card-o': String.fromCharCode(0xf2c3),
    'fa-credit-card': String.fromCharCode(0xf09d),
    'fa-android': String.fromCharCode(0xf17b),
    'fa-apple': String.fromCharCode(0xf179),
};

export class CipherViewModel extends Observable {
    @ObservableProperty() cipher = new CipherView();
    @ObservableProperty() image: ImageSource;
    @ObservableProperty() icon: string;
    imageEnabled = true;

    private imageCache: Cache;
    private imageUrl: string;

    constructor(private layout: StackLayout) {
        super();
        this.cipher = (layout as any).cipher;
        this.imageCache = new Cache();
        this.imageCache.placeholder = this.image = fromResource('ic_heart');
        this.imageCache.maxRequests = 5;

        switch (this.cipher.type) {
            case CipherType.Login:
                this.icon = IconMap['fa-globe'];
                break;
            case CipherType.SecureNote:
                this.icon = IconMap['fa-sticky-note-o'];
                break;
            case CipherType.Card:
                this.icon = IconMap['fa-credit-card'];
                break;
            case CipherType.Identity:
                this.icon = IconMap['fa-id-card-o'];
                break;
            default:
                break;
        }
    }

    load() {
        if (this.cipher.type === CipherType.Login && this.cipher.login.uri) {
            let hostnameUri = this.cipher.login.uri;
            let isWebsite = false;

            if (hostnameUri.indexOf('androidapp://') === 0) {
                this.icon = 'fa-android';
                this.image = null;
            } else if (hostnameUri.indexOf('iosapp://') === 0) {
                this.icon = 'fa-apple';
                this.image = null;
            } else if (this.imageEnabled && hostnameUri.indexOf('://') === -1 && hostnameUri.indexOf('.') > -1) {
                hostnameUri = 'http://' + hostnameUri;
                isWebsite = true;
            } else if (this.imageEnabled) {
                isWebsite = hostnameUri.indexOf('http') === 0 && hostnameUri.indexOf('.') > -1;
            }

            if (this.imageEnabled && isWebsite) {
                try {
                    this.imageUrl = 'https://icons.bitwarden.net/' + Utils.getHostname(hostnameUri) + '/icon.png';
                } catch (e) { }
            }
        } else {
            this.image = null;
        }

        if (this.imageUrl != null) {
            this.imageCache.enableDownload();
            const cachedImage = this.imageCache.get(this.imageUrl);
            if (cachedImage != null) {
                console.log('got cached');
                this.image = fromNativeSource(cachedImage);
            } else {
                console.log('push cached');
                this.imageCache.push({
                    key: this.imageUrl,
                    url: this.imageUrl,
                    completed: (image, key) => {
                        console.log('pushed cached');
                        if (this.imageUrl === key) {
                            this.image = fromNativeSource(image);
                        }
                    },
                });
            }
            this.imageCache.disableDownload();
        }
    }
}
