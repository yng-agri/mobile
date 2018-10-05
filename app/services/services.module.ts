import { android as androidApp, ios as iosApp } from 'application';

import { ServiceContainer } from '../../services/serviceContainer';

import {
    APP_INITIALIZER,
    LOCALE_ID,
    NgModule,
} from '@angular/core';

import { ApiService } from 'jslib/abstractions/api.service';
import { AppIdService } from 'jslib/abstractions/appId.service';
import { AuditService } from 'jslib/abstractions/audit.service';
import { AuthService } from 'jslib/abstractions/auth.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { CryptoFunctionService } from 'jslib/abstractions/cryptoFunction.service';
import { EnvironmentService } from 'jslib/abstractions/environment.service';
import { ExportService } from 'jslib/abstractions/export.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { I18nService as I18nService } from 'jslib/abstractions/i18n.service';
import { LockService } from 'jslib/abstractions/lock.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';
import { NotificationsService } from 'jslib/abstractions/notifications.service';
import { PasswordGenerationService } from 'jslib/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { SearchService } from 'jslib/abstractions/search.service';
import { SettingsService } from 'jslib/abstractions/settings.service';
import { StateService } from 'jslib/abstractions/state.service';
import { StorageService } from 'jslib/abstractions/storage.service';
import { SyncService } from 'jslib/abstractions/sync.service';
import { TokenService } from 'jslib/abstractions/token.service';
import { TotpService } from 'jslib/abstractions/totp.service';
import { UserService } from 'jslib/abstractions/user.service';

import { BroadcasterService } from 'jslib/angular/services/broadcaster.service';

import { MobileSecureStorageService } from '../../services/mobileSecureStorage.service';
import { MobileBroadcasterMessagingService } from '../../services/mobileBroadcasterMessaging.service';

function getServiceContainer() {
    let serviceContainer: ServiceContainer = null;
    if (androidApp) {
        serviceContainer = androidApp.context.serviceContainer;
    } else if (iosApp) {
        serviceContainer = iosApp.delegate.serviceContainer;
    }
    if (serviceContainer == null) {
        throw new Error('Cannot resolve service container.');
    }
    return serviceContainer;
}

function getApplicationService<T>(service: string) {
    return (): T => getServiceContainer().resolve<T>(service);
}

const broadcasterService = new BroadcasterService();
const messagingService = new MobileBroadcasterMessagingService(broadcasterService);

export function initFactory(): Function {
    return async () => {
        const serviceContainer = getServiceContainer();
        await serviceContainer.bootstrap();
        messagingService.init(serviceContainer);
    };
}

@NgModule({
    imports: [
    ],
    declarations: [],
    providers: [
        { provide: MessagingService, useValue: messagingService },
        { provide: BroadcasterService, useValue: broadcasterService },
        { provide: EnvironmentService, useFactory: getApplicationService<EnvironmentService>('environmentService'), deps: [] },
        { provide: LockService, useFactory: getApplicationService<LockService>('lockService'), deps: [] },
        { provide: SyncService, useFactory: getApplicationService<SyncService>('syncService'), deps: [] },
        { provide: AuthService, useFactory: getApplicationService<AuthService>('authService'), deps: [] },
        { provide: TotpService, useFactory: getApplicationService<TotpService>('totpService'), deps: [] },
        { provide: AuditService, useFactory: getApplicationService<AuditService>('auditService'), deps: [] },
        { provide: PasswordGenerationService, useFactory: getApplicationService<PasswordGenerationService>('passwordGenerationService'), deps: [] },
        { provide: ExportService, useFactory: getApplicationService<ExportService>('exportService'), deps: [] },
        { provide: ApiService, useFactory: getApplicationService<ApiService>('apiService'), deps: [] },
        { provide: ApiService, useFactory: getApplicationService<ApiService>('apiService'), deps: [] },
        { provide: TokenService, useFactory: getApplicationService<TokenService>('tokenService'), deps: [] },
        { provide: UserService, useFactory: getApplicationService<UserService>('userService'), deps: [] },
        { provide: AppIdService, useFactory: getApplicationService<AppIdService>('appIdService'), deps: [] },
        { provide: SettingsService, useFactory: getApplicationService<SettingsService>('settingsService'), deps: [] },
        { provide: CipherService, useFactory: getApplicationService<CipherService>('cipherService'), deps: [] },
        { provide: FolderService, useFactory: getApplicationService<FolderService>('folderService'), deps: [] },
        { provide: CollectionService, useFactory: getApplicationService<CollectionService>('collectionService'), deps: [] },
        { provide: SearchService, useFactory: getApplicationService<SearchService>('searchService'), deps: [] },
        { provide: StateService, useFactory: getApplicationService<StateService>('stateService'), deps: [] },
        { provide: CryptoService, useFactory: getApplicationService<CryptoService>('cryptoService'), deps: [] },
        { provide: CryptoFunctionService, useFactory: getApplicationService<CryptoFunctionService>('cryptoFunctionService'), deps: [] },
        { provide: StorageService, useFactory: getApplicationService<StorageService>('storageService'), deps: [] },
        { provide: MobileSecureStorageService, useFactory: getApplicationService<MobileSecureStorageService>('secureStorageService'), deps: [] },
        {
            provide: PlatformUtilsService,
            useFactory: getApplicationService<PlatformUtilsService>('platformUtilsService'),
            deps: []
        },
        { provide: I18nService, useFactory: getApplicationService<I18nService>('i18nService'), deps: [] },
        {
            provide: APP_INITIALIZER,
            useFactory: initFactory,
            deps: [],
            multi: true,
        },
        {
            provide: LOCALE_ID,
            useFactory: () => getApplicationService<I18nService>('i18nService')().translationLocale,
            deps: [],
        },
    ],
})
export class ServicesModule {
}
