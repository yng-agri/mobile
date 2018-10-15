import {
    Component,
    ViewContainerRef,
} from '@angular/core';
import { ModalDialogService } from 'nativescript-angular/directives/dialogs';
import { RouterExtensions } from 'nativescript-angular/router';

import { ModalComponent } from '../modal.component';

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
        syncService: SyncService, storageService: StorageService,
        private modalDialogService: ModalDialogService, private vcRef: ViewContainerRef) {
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

    hint() {
        this.modalDialogService.showModal(ModalComponent, {
            context: { path: 'hint' },
            fullscreen: true,
            viewContainerRef: this.vcRef,
        }).then((res) => {
            console.log(res);
        });
    }
}
