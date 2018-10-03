import { android as androidApp, ios as iosApp } from 'application';

import { DeviceType } from 'jslib/enums/deviceType';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';

import { Utils } from 'jslib/misc/utils';

export class MobilePlatformUtilsService implements PlatformUtilsService {
    identityClientId = 'mobile';

    constructor(private i18nService: I18nService) { }

    getDevice(): DeviceType {
        return iosApp ? DeviceType.iOS : DeviceType.Android;
    }

    getDeviceString(): string {
        return 'TODO';
    }

    isFirefox(): boolean {
        return false;
    }

    isChrome(): boolean {
        return false;
    }

    isEdge(): boolean {
        return false;
    }

    isOpera(): boolean {
        return false;
    }

    isVivaldi(): boolean {
        return false;
    }

    isSafari(): boolean {
        return false;
    }

    isIE(): boolean {
        return false;
    }

    isMacAppStore(): boolean {
        return false;
    }

    analyticsId(): string {
        return null;
    }

    getDomain(uriString: string): string {
        return Utils.getHostname(uriString);
    }

    isViewOpen(): boolean {
        return false;
    }

    lockTimeout(): number {
        return null;
    }

    launchUri(uri: string, options?: any): void {

    }

    saveFile(win: Window, blobData: any, blobOptions: any, fileName: string): void {

    }

    getApplicationVersion(): string {
        return '2.0.0';
    }

    supportsU2f(win: Window): boolean {
        return false;
    }

    supportsDuo(): boolean {
        return true;
    }

    showToast(type: 'error' | 'success' | 'warning' | 'info', title: string, text: string | string[],
        options?: any): void {

    }

    showDialog(text: string, title?: string, confirmText?: string, cancelText?: string, type?: string):
        Promise<boolean> {
        return Promise.resolve(false);
    }

    isDev(): boolean {
        return true;
    }

    isSelfHost(): boolean {
        return false;
    }

    copyToClipboard(text: string, options?: any): void {

    }
}
