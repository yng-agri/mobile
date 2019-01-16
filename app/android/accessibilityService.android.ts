import { ServiceContainer } from '../../services/serviceContainer';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { StateService } from 'jslib/abstractions/state.service';
import { StorageService } from 'jslib/abstractions/storage.service';
import { Utils } from 'jslib/misc/utils';
import { AccessibilityHelpers } from './accessibility/accessibilityHelpers';
import { Browser } from './accessibility/browser';

const BitwardenTag = 'bw_access';
const AutoFillNotificationId = 34573;
const SystemUiPackage = 'com.android.systemui';
const BitwardenPackage = 'com.x8bit.bitwarden';
const BitwardenWebsite = 'vault.bitwarden.com';

@JavaProxy('com.tns.AccessibilityService')
export class AccessibilityService extends android.accessibilityservice.AccessibilityService {
    private notificationChannel: android.app.NotificationChannel;
    private storageService: StorageService;
    private lastNotificationTime = 0;
    private lastNotificationUrl: string;
    private launcherPackageNames: Set<string>;
    private lastLauncherSetBuilt: number;
    private rebuildLauncherSpan = 3600000; // 1 hour (in ms)

    async onAccessibilityEvent(e: android.view.accessibility.AccessibilityEvent) {
        console.log('onAccessibilityEvent : ' + e.getPackageName() + ' : ' + e.getEventType());
        const serviceContainer: ServiceContainer = (this.getApplicationContext() as any).serviceContainer;
        this.storageService = serviceContainer.resolve<StorageService>('storageService');
        const stateService = serviceContainer.resolve<StateService>('stateService');
        const i18nService = serviceContainer.resolve<I18nService>('i18nService');
        const platformUtilsService = serviceContainer.resolve<PlatformUtilsService>('platformUtilsService');
        console.log('state: ' + (await stateService.get<string>('hello')));
        console.log('i18n: ' + i18nService.t('hello'));
        console.log('platform: ' + platformUtilsService.getDevice());
        console.log('storage: ' + (await this.storageService.get<string>('hello')));

        try {
            const powerManager: android.os.PowerManager = this.getSystemService(android.content.Context.POWER_SERVICE);
            if (android.os.Build.VERSION.SDK_INT > android.os.Build.VERSION_CODES.KITKAT_WATCH &&
                !powerManager.isInteractive()) {
                return;
            }
            if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.LOLLIPOP &&
                !powerManager.isScreenOn()) {
                return;
            }
            if (e == null) {
                return;
            }
            const eventPackageName = e.getPackageName();
            if (this.skipPackage(eventPackageName)) {
                return;
            }
            let root = this.getRootInActiveWindow();
            if (root == null || root.getPackageName() !== eventPackageName) {
                return;
            }

            // TODO: test nodes

            let notificationManager: android.app.NotificationManager = this.getSystemService(
                android.content.Context.NOTIFICATION_SERVICE);
            let cancelNotification = true;

            switch (e.getEventType()) {
                case android.view.accessibility.AccessibilityEvent.TYPE_VIEW_FOCUSED:
                    const source = e.getSource();
                    if (source == null || !source.isPassword()) { // TODO: OR NOT autofill password field setting
                        break;
                    }
                    if (eventPackageName === BitwardenPackage) {
                        // TODO: cancel notification
                        break;
                    }
                    // TODO: scan and cancel
                    break;
                case android.view.accessibility.AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED:
                case android.view.accessibility.AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED:
                    break;
                default:
                    break;
            }

            // clean up
            notificationManager = null;
            root = null;
            e = null;
        } catch {
            // Suppress exceptions so that service doesn't crash
        }
    }

    onInterrupt() {
        // Do nothing
    }

    private cancelNotification(notificationManager: android.app.NotificationManager, limit = 250): void {
        if (new Date().getTime() - this.lastNotificationTime < limit) {
            return;
        }
        this.lastNotificationUrl = null;
        if (notificationManager != null) {
            notificationManager.cancel(AutoFillNotificationId);
        }
    }

    private getUri(root: android.view.accessibility.AccessibilityNodeInfo): string {
        const rootPackageName = root.getPackageName();
        let uri = 'androidapp://' + rootPackageName;
        if (AccessibilityHelpers.supportedBrowsers.has(rootPackageName)) {
            const browser = AccessibilityHelpers.supportedBrowsers.get(rootPackageName);
            const nodeList = root.findAccessibilityNodeInfosByViewId(rootPackageName + ':id/' + browser.uriViewId);
            if (nodeList != null && nodeList.size() > 0) {
                let addressNode: android.view.accessibility.AccessibilityNodeInfo = nodeList.get(0);
                if (addressNode != null) {
                    uri = this.extractUri(uri, addressNode, browser);
                    addressNode = null;
                }
            }
        }
        return uri;
    }

    private extractUri(uri: string, addressNode: android.view.accessibility.AccessibilityNodeInfo,
        browser: Browser): string {
        if (addressNode == null) {
            return uri;
        }
        const text = addressNode.getText();
        if (text == null) {
            return uri;
        }
        uri = browser.getUriFunction(text);
        if (uri != null && uri.indexOf('.') > -1) {
            uri = uri.trim();
            if (uri.indexOf('://') === -1 && uri.indexOf(' ') === -1) {
                uri = ('http://' + uri);
            } else if (android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.KITKAT_WATCH) {
                const parts = uri.split('. ');
                if (parts.length > 1) {
                    const urlPart = parts.find((p) => p.indexOf('http') === 0);
                    if (urlPart != null) {
                        uri = urlPart.trim();
                    }
                }
            }
        }
        return uri;
    }

    // TODO

    private skipPackage(eventPackageName: string): boolean {
        if (Utils.isNullOrWhitespace(eventPackageName) ||
            AccessibilityHelpers.filteredPackageNames.has(eventPackageName) ||
            eventPackageName.indexOf('launcher') > -1) {
            return true;
        }
        if (this.launcherPackageNames == null || this.lastLauncherSetBuilt == null ||
            (new Date().getTime() - this.lastLauncherSetBuilt) > this.rebuildLauncherSpan) {
            this.lastLauncherSetBuilt = new Date().getTime();
            const intent = new android.content.Intent(android.content.Intent.ACTION_MAIN);
            intent.addCategory(android.content.Intent.CATEGORY_HOME);
            const resolveInfo = this.getPackageManager().queryIntentActivities(intent, 0);
            const homePackages: string[] = [];
            for (let i = 0; i < resolveInfo.size(); i++) {
                const ri: android.content.pm.ResolveInfo = resolveInfo.get(i);
                homePackages.push(ri.activityInfo.packageName);
            }
            this.launcherPackageNames = new Set<string>(homePackages);
        }
        return this.launcherPackageNames.has(eventPackageName);
    }
}
