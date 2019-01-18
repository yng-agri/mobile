import { ServiceContainer } from '../../services/serviceContainer';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { StorageService } from 'jslib/abstractions/storage.service';

import { Utils } from 'jslib/misc/utils';

import { AccessibilityHelpers } from './accessibility/accessibilityHelpers';

declare let com: any;

const AutoFillNotificationId = 34573;
const BitwardenPackage = 'com.x8bit.bitwarden';
const BitwardenWebsite = 'vault.bitwarden.com';

@JavaProxy('com.tns.AccessibilityService')
export class AccessibilityService extends android.accessibilityservice.AccessibilityService {
    private notificationChannel: android.app.NotificationChannel;
    private serviceContainer: ServiceContainer;
    private storageService: StorageService;
    private i18nService: I18nService;
    private lastNotificationTime = 0;
    private lastNotificationUri: string;
    private launcherPackageNames: Set<string>;
    private lastLauncherSetBuilt: number;
    private rebuildLauncherSpan = 3600000; // 1 hour (in ms)
    private settingAutofillPasswordField = false;
    private settingAutofillPersistNotification = false;
    private lastSettingsReload: number;
    private settingsReloadSpan = 60000; // 1 minute (in ms)

    async onAccessibilityEvent(e: android.view.accessibility.AccessibilityEvent) {
        try {
            const powerManager: android.os.PowerManager = this.getSystemService(android.content.Context.POWER_SERVICE);
            if (android.os.Build.VERSION.SDK_INT > 20 && !powerManager.isInteractive()) {
                return;
            }
            if (android.os.Build.VERSION.SDK_INT < 21 && !powerManager.isScreenOn()) {
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

            // AccessibilityHelpers.printTestData(root, e);
            this.loadServices();
            this.loadSettings();

            let notificationManager: android.app.NotificationManager = this.getSystemService(
                android.content.Context.NOTIFICATION_SERVICE);
            let cancelNotification = true;

            switch (e.getEventType()) {
                case android.view.accessibility.AccessibilityEvent.TYPE_VIEW_FOCUSED:
                    const source1 = e.getSource();
                    if (source1 == null || !source1.isPassword() || !this.settingAutofillPasswordField) {
                        break;
                    }
                    if (eventPackageName === BitwardenPackage) {
                        this.cancelNotification(notificationManager);
                        break;
                    }
                    if (this.scanAndAutofill(root, e, notificationManager, cancelNotification)) {
                        this.cancelNotification(notificationManager);
                    }
                    break;
                case android.view.accessibility.AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED:
                case android.view.accessibility.AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED:
                    const source2 = e.getSource();
                    if (this.settingAutofillPasswordField && source2.isPassword()) {
                        break;
                    } else if (this.settingAutofillPasswordField && AccessibilityHelpers.lastCredentials == null) {
                        if (Utils.isNullOrWhitespace(this.lastNotificationUri)) {
                            this.cancelNotification(notificationManager);
                            break;
                        }
                        const uri = AccessibilityHelpers.getUri(root);
                        if (uri !== this.lastNotificationUri) {
                            this.cancelNotification(notificationManager);
                        } else if (uri.indexOf('androidapp://') === 0) {
                            this.cancelNotification(notificationManager, 30000);
                        }
                        break;
                    }

                    if (eventPackageName === BitwardenPackage) {
                        this.cancelNotification(notificationManager);
                        break;
                    }

                    if (this.settingAutofillPersistNotification) {
                        const uri = AccessibilityHelpers.getUri(root);
                        if (uri != null && uri.indexOf(BitwardenWebsite) === -1) {
                            let needToFill = AccessibilityHelpers.needsToAutofill(
                                AccessibilityHelpers.lastCredentials, uri);
                            if (needToFill) {
                                const passwordNodes = AccessibilityHelpers.getWindowNodes(
                                    root, e, (n) => n.isPassword(), false);
                                needToFill = passwordNodes.length > 0;
                                if (needToFill) {
                                    AccessibilityHelpers.getNodesAndFill(root, e, passwordNodes);
                                }
                                AccessibilityHelpers.disposeNodes(passwordNodes);
                            }
                            if (!needToFill) {
                                this.notifyToAutofill(uri, notificationManager);
                                cancelNotification = false;
                            }
                        }
                        AccessibilityHelpers.lastCredentials = null;
                    } else {
                        cancelNotification = this.scanAndAutofill(root, e, notificationManager, cancelNotification);
                    }

                    if (cancelNotification) {
                        this.cancelNotification(notificationManager);
                    }
                    break;
                default:
                    break;
            }
            notificationManager = null;
            root = null;
            e = null;
        } catch (e) {
            // Suppress exceptions so that service doesn't crash
            // console.log(e);
        }
    }

    onInterrupt() {
        // Do nothing
    }

    private scanAndAutofill(root: android.view.accessibility.AccessibilityNodeInfo,
        e: android.view.accessibility.AccessibilityEvent, notificationManager: android.app.NotificationManager,
        cancelNotification: boolean): boolean {
        const passwordNodes = AccessibilityHelpers.getWindowNodes(root, e, (n) => n.isPassword(), false);
        if (passwordNodes.length > 0) {
            const uri = AccessibilityHelpers.getUri(root);
            if (uri != null && uri.indexOf(BitwardenWebsite) === -1) {
                if (AccessibilityHelpers.needsToAutofill(AccessibilityHelpers.lastCredentials, uri)) {
                    AccessibilityHelpers.getNodesAndFill(root, e, passwordNodes);
                } else {
                    this.notifyToAutofill(uri, notificationManager);
                    cancelNotification = false;
                }
            }
            AccessibilityHelpers.lastCredentials = null;
        } else if (AccessibilityHelpers.lastCredentials != null) {
            setTimeout(() => {
                AccessibilityHelpers.lastCredentials = null;
            }, 1000);
        }

        AccessibilityHelpers.disposeNodes(passwordNodes);
        return cancelNotification;
    }

    private cancelNotification(notificationManager: android.app.NotificationManager, limit = 250): void {
        if (new Date().getTime() - this.lastNotificationTime < limit) {
            return;
        }
        this.lastNotificationUri = null;
        if (notificationManager != null) {
            notificationManager.cancel(AutoFillNotificationId);
        }
    }

    private notifyToAutofill(uri: string, notificationManager: android.app.NotificationManager): void {
        if (notificationManager == null || Utils.isNullOrWhitespace(uri)) {
            return;
        }

        const context = this.getApplicationContext();
        const now = new Date().getTime();
        const intent = new android.content.Intent(context, com.tns.AccessibilityActivity.class);
        intent.putExtra('uri', uri);
        intent.setFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK |
            android.content.Intent.FLAG_ACTIVITY_SINGLE_TOP | android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP);
        const pendingIntent = android.app.PendingIntent.getActivity(context, 0, intent,
            android.app.PendingIntent.FLAG_UPDATE_CURRENT);

        const newAndroid = android.os.Build.VERSION.SDK_INT > 20;
        const oAndNewerAndroid = android.os.Build.VERSION.SDK_INT >= 26;
        const notificationContent = this.i18nService.t(
            newAndroid ? 'autofillNotificationContent' : 'autofillNotificationContentOld');
        const notificationIcon = context.getResources().getIdentifier('notification_sm',
            'drawable', context.getPackageName());

        let builder = new android.app.Notification.Builder(context);
        builder.setSmallIcon(notificationIcon)
            .setContentTitle(this.i18nService.t('bitwardenAutofillServiceTitle'))
            .setContentText(notificationContent)
            .setTicker(notificationContent)
            .setWhen(now)
            .setContentIntent(pendingIntent);

        if (newAndroid) {
            const primaryColor = context.getResources().getIdentifier('primary', 'color', context.getPackageName());
            builder.setVisibility(android.app.Notification.VISIBILITY_SECRET)
                .setColor(android.support.v4.content.ContextCompat.getColor(context, primaryColor));
        }
        if (oAndNewerAndroid) {
            if (this.notificationChannel == null) {
                this.notificationChannel = new android.app.NotificationChannel('bitwarden_autofill_service',
                    this.i18nService.t('autofillServiceTitle'), android.app.NotificationManager.IMPORTANCE_LOW);
                notificationManager.createNotificationChannel(this.notificationChannel);
            }
            builder.setChannelId(this.notificationChannel.getId());
        }

        if (this.settingAutofillPersistNotification) {
            builder.setPriority(android.app.Notification.PRIORITY_MIN);
        }

        this.lastNotificationTime = now;
        this.lastNotificationUri = uri;
        notificationManager.notify(AutoFillNotificationId, builder.build());
        builder = null;
    }

    private skipPackage(eventPackageName: string): boolean {
        if (Utils.isNullOrWhitespace(eventPackageName) ||
            AccessibilityHelpers.filteredPackageNames.has(eventPackageName) ||
            eventPackageName.indexOf('launcher') > -1) {
            return true;
        }
        const now = new Date().getTime();
        if (this.launcherPackageNames == null || this.lastLauncherSetBuilt == null ||
            (now - this.lastLauncherSetBuilt) > this.rebuildLauncherSpan) {
            this.lastLauncherSetBuilt = now;
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

    private loadServices(): void {
        if (this.serviceContainer == null) {
            this.serviceContainer = (this.getApplicationContext() as any).serviceContainer;
        }
        if (this.storageService == null) {
            this.storageService = this.serviceContainer.resolve<StorageService>('storageService');
        }
        if (this.i18nService == null) {
            this.i18nService = this.serviceContainer.resolve<I18nService>('i18nService');
        }
    }

    private async loadSettings(): Promise<any> {
        const now = new Date().getTime();
        if (this.lastSettingsReload == null || (now - this.lastSettingsReload) > this.settingsReloadSpan) {
            this.lastSettingsReload = now;
            this.settingAutofillPasswordField = await this.storageService.get<boolean>(
                'accessibilityAutofillPasswordField');
            this.settingAutofillPersistNotification = await this.storageService.get<boolean>(
                'accessibilityAutofillPersistNotification');
        }
    }
}
