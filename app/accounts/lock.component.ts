import { Component } from '@angular/core';
import { RouterExtensions } from "nativescript-angular/router";

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { UserService } from 'jslib/abstractions/user.service';

import { LockComponent as BaseLockComponent } from 'jslib/angular/components/lock.component';

@Component({
    selector: 'app-lock',
    templateUrl: 'lock.component.html',
})
export class LockComponent extends BaseLockComponent {
    constructor(routerExtensions: RouterExtensions, i18nService: I18nService,
        platformUtilsService: PlatformUtilsService, messagingService: MessagingService,
        userService: UserService, cryptoService: CryptoService) {
        super(null, i18nService, platformUtilsService, messagingService, userService, cryptoService);
        this.onSuccessfulSubmit = () => {
            routerExtensions.navigate(['/tabs']);
        };
    }
}
