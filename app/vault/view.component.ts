import {
    ChangeDetectorRef,
    Component,
    NgZone,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalDialogParams } from 'nativescript-angular/modal-dialog';

import { AuditService } from 'jslib/abstractions/audit.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CryptoService } from 'jslib/abstractions/crypto.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { TokenService } from 'jslib/abstractions/token.service';
import { TotpService } from 'jslib/abstractions/totp.service';
import { UserService } from 'jslib/abstractions/user.service';

import { BroadcasterService } from 'jslib/angular/services/broadcaster.service';

import { ViewComponent as BaseViewComponent } from 'jslib/angular/components/view.component';

@Component({
    selector: 'app-vault-view',
    templateUrl: 'view.component.html',
})
export class ViewComponent extends BaseViewComponent {
    showAttachments = true;

    constructor(cipherService: CipherService, totpService: TotpService,
        tokenService: TokenService, i18nService: I18nService,
        cryptoService: CryptoService, platformUtilsService: PlatformUtilsService,
        auditService: AuditService, private route: ActivatedRoute,
        broadcasterService: BroadcasterService, ngZone: NgZone,
        changeDetectorRef: ChangeDetectorRef, userService: UserService,
        private params: ModalDialogParams) {
        super(cipherService, totpService, tokenService, i18nService, cryptoService, platformUtilsService,
            auditService, null, broadcasterService, ngZone, changeDetectorRef, userService);
    }

    async ngOnInit() {
        if (this.params.context.cipherId) {
            this.cipherId = this.params.context.cipherId;
        } else {
            this.close();
        }

        await this.load();
        super.ngOnInit();
    }

    edit() {
        super.edit();
        // this.router.navigate(['/edit-cipher'], { queryParams: { cipherId: this.cipher.id } });
    }

    close() {
        this.params.closeCallback();
    }
}
