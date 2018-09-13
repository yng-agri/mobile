import { android as androidApp, ios as iosApp } from "application";

import { ServiceContainer } from '../../services/serviceContainer';

import {
    APP_INITIALIZER,
    LOCALE_ID,
    NgModule,
} from '@angular/core';

/*
import { ApiService } from 'jslib/abstractions/api.service';
import { AppIdService } from 'jslib/abstractions/appId.service';
import { AuditService } from 'jslib/abstractions/audit.service';
import { AuthService as AuthServiceAbstraction } from 'jslib/abstractions/auth.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { EnvironmentService } from 'jslib/abstractions/environment.service';
import { ExportService } from 'jslib/abstractions/export.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { LockService } from 'jslib/abstractions/lock.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';
import { NotificationsService } from 'jslib/abstractions/notifications.service';
import { PasswordGenerationService } from 'jslib/abstractions/passwordGeneration.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { SearchService as SearchServiceAbstraction } from 'jslib/abstractions/search.service';
import { SettingsService } from 'jslib/abstractions/settings.service';
import { StateService as StateServiceAbstraction } from 'jslib/abstractions/state.service';
import { StorageService } from 'jslib/abstractions/storage.service';
import { SyncService } from 'jslib/abstractions/sync.service';
import { TokenService } from 'jslib/abstractions/token.service';
import { TotpService } from 'jslib/abstractions/totp.service';
import { UserService } from 'jslib/abstractions/user.service';
*/

function getApplicationService<T>(service: string) {
    let serviceContainer: ServiceContainer = null;
    if (androidApp) {
        serviceContainer = androidApp.context.serviceContainer;
    } else if (iosApp) {
        serviceContainer = iosApp.nativeApp['serviceContainer'];
    } else {
        throw new Error('Unknown platform.');
    }
    return serviceContainer == null ? null : serviceContainer.resolve<T>(service);
}

export function initFactory(): Function {
    return () => {
        console.log('doing init');
        console.log(getApplicationService<string>('testString'));
    };
}

@NgModule({
    imports: [
    ],
    declarations: [],
    providers: [
        {
            provide: APP_INITIALIZER,
            useFactory: initFactory,
            deps: [],
            multi: true,
        },
    ],
})
export class ServicesModule {
}
