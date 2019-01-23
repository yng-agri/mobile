import * as app from 'tns-core-modules/application';
import * as dialogs from 'tns-core-modules/ui/dialogs';
import { getFrameById } from 'tns-core-modules/ui/frame';

import { MobileUtils } from './misc/mobileUtils';

import { AuthService } from 'jslib/abstractions/auth.service';
import { BroadcasterService } from 'jslib/abstractions/broadcaster.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { PasswordGenerationService } from 'jslib/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { SearchService } from 'jslib/abstractions/search.service';
import { SettingsService } from 'jslib/abstractions/settings.service';
import { SyncService } from 'jslib/abstractions/sync.service';
import { TokenService } from 'jslib/abstractions/token.service';
import { UserService } from 'jslib/abstractions/user.service';
import { DeviceActionUtils } from './misc/deviceActionUtils';

export class AppMain {
    inited = false;

    private broadcasterService: BroadcasterService;
    private userService: UserService;
    private syncService: SyncService;
    private cryptoService: CryptoService;
    private tokenService: TokenService;
    private settingsService: SettingsService;
    private cipherService: CipherService;
    private folderService: FolderService;
    private collectionService: CollectionService;
    private passwordGenerationService: PasswordGenerationService;
    private searchService: SearchService;
    private authService: AuthService;
    private platformUtilsService: PlatformUtilsService;
    private i18nService: I18nService;

    constructor() {
        this.setup();
    }

    init(): void {
        if (this.inited) {
            return;
        }
        this.inited = true;

        this.broadcasterService = MobileUtils.resolveService('broadcasterService');
        this.userService = MobileUtils.resolveService('userService');
        this.syncService = MobileUtils.resolveService('syncService');
        this.cryptoService = MobileUtils.resolveService('cryptoService');
        this.tokenService = MobileUtils.resolveService('tokenService');
        this.settingsService = MobileUtils.resolveService('settingsService');
        this.cipherService = MobileUtils.resolveService('cipherService');
        this.folderService = MobileUtils.resolveService('folderService');
        this.collectionService = MobileUtils.resolveService('collectionService');
        this.passwordGenerationService = MobileUtils.resolveService('passwordGenerationService');
        this.searchService = MobileUtils.resolveService('searchService');
        this.authService = MobileUtils.resolveService('authService');
        this.platformUtilsService = MobileUtils.resolveService('platformUtilsService');
        this.i18nService = MobileUtils.resolveService('i18nService');

        this.listen();
    }

    private listen(): void {
        this.broadcasterService.subscribe('AppMain', (message: any) => {
            switch (message.command) {
                case 'loggedIn':
                case 'loggedOut':
                case 'unlocked':
                    break;
                case 'logout':
                    this.logOut(!!message.expired, !!message.confirm);
                    break;
                default:
                    break;
            }
            console.log('Got message in AppMain');
            console.log(message);
        });
    }

    private setup(): void {
        app.on(app.launchEvent, (args: app.LaunchEventData) => {
            if (args.android) {
                // For Android applications, args.android is an android.content.Intent class.
                console.log('Launched Android application with the following intent: ' + args.android + '.');
            } else if (args.ios !== undefined) {
                // For iOS applications, args.ios is NSDictionary (launchOptions).
                console.log('Launched iOS application with options: ' + args.ios);
            }
        });

        app.on(app.suspendEvent, (args: app.ApplicationEventData) => {
            if (args.android) {
                // For Android applications, args.android is an android activity class.
                console.log('Activity: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is UIApplication.
                console.log('UIApplication: ' + args.ios);
            }
        });

        app.on(app.resumeEvent, (args: app.ApplicationEventData) => {
            if (args.android) {
                // For Android applications, args.android is an android activity class.
                console.log('Activity: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is UIApplication.
                console.log('UIApplication: ' + args.ios);
            }
        });

        app.on(app.displayedEvent, (args: app.ApplicationEventData) => {
            console.log('displayedEvent');
        });

        app.on(app.orientationChangedEvent, (args: app.OrientationChangedEventData) => {
            // 'portrait', 'landscape', 'unknown'
            console.log(args.newValue);
        });

        app.on(app.exitEvent, (args: app.ApplicationEventData) => {
            if (args.android) {
                // For Android applications, args.android is an android activity class.
                console.log('Activity: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is UIApplication.
                console.log('UIApplication: ' + args.ios);
            }
        });

        app.on(app.lowMemoryEvent, (args: app.ApplicationEventData) => {
            if (args.android) {
                // For Android applications, args.android is an android activity class.
                console.log('Activity: ' + args.android);
            } else if (args.ios) {
                // For iOS applications, args.ios is UIApplication.
                console.log('UIApplication: ' + args.ios);
            }
        });

        app.on(app.uncaughtErrorEvent, (args: app.UnhandledErrorEventData) => {
            console.log('Error: ' + args.error);
        });
    }

    private async logOut(expired: boolean, checkConfirmation: boolean) {
        if (checkConfirmation) {
            const confirmed = await dialogs.confirm({
                title: this.i18nService.t('logOut'),
                message: this.i18nService.t('logOutConfirmation'),
                okButtonText: this.i18nService.t('yes'),
                cancelButtonText: this.i18nService.t('cancel'),
            });
            if (!confirmed) {
                return;
            }
        }

        const userId = await this.userService.getUserId();
        await Promise.all([
            this.syncService.setLastSync(new Date(0)),
            this.tokenService.clearToken(),
            this.cryptoService.clearKeys(),
            this.userService.clear(),
            this.settingsService.clear(userId),
            this.cipherService.clear(userId),
            this.folderService.clear(userId),
            this.collectionService.clear(userId),
            this.passwordGenerationService.clear(),
        ]);

        this.searchService.clearIndex();
        this.authService.logOut(async () => {
            this.platformUtilsService.eventTrack('Logged Out');
            if (expired) {
                DeviceActionUtils.toast(this.i18nService.t('loginExpired'));
            }
            const rootFrame = getFrameById('app-root-frame');
            rootFrame.navigate({
                moduleName: 'pages/home/home-page',
                animated: true,
                transition: null,
                clearHistory: true,
            });
        });
    }
}
