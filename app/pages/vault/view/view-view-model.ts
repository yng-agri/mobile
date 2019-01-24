import {
    EventData,
    Observable,
} from 'tns-core-modules/data/observable';
import * as dialogs from 'tns-core-modules/ui/dialogs';
import {
    Page,
    View,
} from 'tns-core-modules/ui/page/page';

import { ObservableProperty } from '~/misc/observable-property.decorator';

import { AuditService } from 'jslib/abstractions/audit.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { TotpService } from 'jslib/abstractions/totp.service';
import { UserService } from 'jslib/abstractions/user.service';

import { CipherView } from 'jslib/models/view/cipherView';

import { CipherType } from 'jslib/enums/cipherType';
import { FieldType } from 'jslib/enums/fieldType';

import { AttachmentView } from 'jslib/models/view/attachmentView';
import { FieldView } from 'jslib/models/view/fieldView';
import { LoginUriView } from 'jslib/models/view/loginUriView';

import { DeviceActionUtils } from '~/misc/deviceActionUtils';
import { MobileUtils } from '~/misc/mobileUtils';

export class ViewViewModel extends Observable {
    @ObservableProperty() cipher: CipherView = new CipherView();
    @ObservableProperty() showPassword: boolean;
    @ObservableProperty() showCardCode: boolean;
    @ObservableProperty() canAccessPremium: boolean;
    @ObservableProperty() totpCode: string;
    @ObservableProperty() totpCodeFormatted: string;
    @ObservableProperty() totpDash: number;
    @ObservableProperty() totpSec: number;
    @ObservableProperty() totpLow: boolean;

    fieldType = FieldType;
    cipherType = CipherType;
    cipherId: string;

    private totpInterval: any;

    constructor(private page: Page, private closeModal: Function,
        private cipherService: CipherService, private totpService: TotpService,
        private userService: UserService, private platformUtilsService: PlatformUtilsService,
        private auditService: AuditService, private i18nService: I18nService) {
        super();
    }

    async init() {
        await this.load();
    }

    async load() {
        this.cleanUp();

        const cipher = await this.cipherService.get(this.cipherId);
        this.cipher = await cipher.decrypt();
        this.canAccessPremium = await this.userService.canAccessPremium();

        if (this.cipher.type === CipherType.Login && this.cipher.login.totp &&
            (cipher.organizationUseTotp || this.canAccessPremium)) {
            await this.totpUpdateCode();
            const interval = this.totpService.getTimeInterval(this.cipher.login.totp);
            await this.totpTick(interval);

            this.totpInterval = setInterval(async () => {
                await this.totpTick(interval);
            }, 1000);
        }
    }

    edit() {
        // TODO
    }

    togglePassword() {
        this.platformUtilsService.eventTrack('Toggled Password');
        this.showPassword = !this.showPassword;
    }

    toggleCardCode() {
        this.platformUtilsService.eventTrack('Toggled Card Code');
        this.showCardCode = !this.showCardCode;
    }

    async checkPassword() {
        if (this.cipher.login == null || this.cipher.login.password == null || this.cipher.login.password === '') {
            return;
        }
        this.platformUtilsService.eventTrack('Check Password');
        await MobileUtils.doActionWithLoading(async () => {
            const matches = await this.auditService.passwordLeaked(this.cipher.login.password);
            if (matches > 0) {
                dialogs.alert(this.i18nService.t('passwordExposed', matches.toString()));
            } else {
                dialogs.alert(this.i18nService.t('passwordSafe'));
            }
        });
    }

    toggleFieldValue(field: FieldView) {
        const f = (field as any);
        f.showValue = !f.showValue;
    }

    launch(uri: LoginUriView) {
        if (!uri.canLaunch) {
            return;
        }
        this.platformUtilsService.eventTrack('Launched Login URI');
        this.platformUtilsService.launchUri(uri.launchUri);
    }

    copy(value: string, typeI18nKey: string, aType: string) {
        if (value == null) {
            return;
        }
        this.platformUtilsService.eventTrack('Copied ' + aType);
        this.platformUtilsService.copyToClipboard(value);
        DeviceActionUtils.toast(this.i18nService.t('valueCopied', this.i18nService.t(typeI18nKey)));
    }

    async downloadAttachment(attachment: AttachmentView) {
        const a = (attachment as any);
        if (a.downloading) {
            return;
        }

        a.downloading = true;
        a.downloading = false;
    }

    cleanUp() {
        this.totpCode = null;
        this.cipher = new CipherView();
        this.showPassword = false;
        if (this.totpInterval) {
            clearInterval(this.totpInterval);
        }
    }

    private async totpUpdateCode() {
        if (this.cipher == null || this.cipher.type !== CipherType.Login || this.cipher.login.totp == null) {
            if (this.totpInterval) {
                clearInterval(this.totpInterval);
            }
            return;
        }

        this.totpCode = await this.totpService.getCode(this.cipher.login.totp);
        if (this.totpCode != null) {
            if (this.totpCode.length > 4) {
                const half = Math.floor(this.totpCode.length / 2);
                this.totpCodeFormatted = this.totpCode.substring(0, half) + ' ' + this.totpCode.substring(half);
            } else {
                this.totpCodeFormatted = this.totpCode;
            }
        } else {
            this.totpCodeFormatted = null;
            if (this.totpInterval) {
                clearInterval(this.totpInterval);
            }
        }
    }

    private async totpTick(intervalSeconds: number) {
        const epoch = Math.round(new Date().getTime() / 1000.0);
        const mod = epoch % intervalSeconds;

        this.totpSec = intervalSeconds - mod;
        this.totpDash = +(Math.round((((78.6 / intervalSeconds) * mod) + 'e+2') as any) + 'e-2');
        this.totpLow = this.totpSec <= 7;
        if (mod === 0) {
            await this.totpUpdateCode();
        }
    }
}
