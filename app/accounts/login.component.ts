import { Component } from '@angular/core';
import { RouterExtensions } from "nativescript-angular/router";

import { AuthService } from 'jslib/abstractions/auth.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { StorageService } from 'jslib/abstractions/storage.service';
import { SyncService } from 'jslib/abstractions/sync.service';

import { LoginComponent as BaseLoginComponent } from 'jslib/angular/components/login.component';

@Component({
    selector: 'app-login',
    templateUrl: 'login.component.html',
})
export class LoginComponent extends BaseLoginComponent {
    constructor(authService: AuthService, private routerExtensions: RouterExtensions,
        platformUtilsService: PlatformUtilsService, i18nService: I18nService,
        syncService: SyncService, storageService: StorageService) {
        super(authService, null, platformUtilsService, i18nService, storageService);
        this.onSuccessfulLogin = () => {
            return syncService.fullSync(true);
        };
        this.onSuccessfulLoginNavigate = () => {
            routerExtensions.navigate(['tabs'], { clearHistory: true });
            return Promise.resolve();
        };
        this.onSuccessfulLoginTwoFactorNavigate = () => {
            routerExtensions.navigate(['2fa']);
            return Promise.resolve();
        };
    }

    settings() {
        this.routerExtensions.navigate(['environment']);
    }
}
