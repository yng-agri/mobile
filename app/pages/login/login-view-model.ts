import { Observable } from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page/page';

import { AuthService } from 'jslib/abstractions/auth.service';

import { DeviceActionUtils } from '~/misc/deviceActionUtils';
import { MobileUtils } from '~/misc/mobileUtils';

export class LoginViewModel extends Observable {
    protected authService: AuthService;

    private _email = '';
    private _masterPassword = '';
    private _showPassword = false;

    constructor(private page: Page) {
        super();
        this.authService = MobileUtils.resolveService('authService');
    }

    get email(): string {
        return this._email;
    }

    set email(value: string) {
        this._email = value;
        this.notifyPropertyChange('email', this.email);
    }

    get masterPassword(): string {
        return this._masterPassword;
    }

    set masterPassword(value: string) {
        this._masterPassword = value;
        this.notifyPropertyChange('masterPassword', this.masterPassword);
    }

    get showPassword(): boolean {
        return this._showPassword;
    }

    set showPassword(value: boolean) {
        this._showPassword = value;
        this.notifyPropertyChange('showPassword', this.showPassword);
        this.notifyPropertyChange('showPasswordIcon', this.showPasswordIcon);
    }

    get showPasswordIcon() {
        return this.showPassword ? '' : '';
    }

    async submit() {
        await DeviceActionUtils.showLoading('Loading...');
        try {
            const result = await this.authService.logIn(this.email, this.masterPassword);
            this.page.frame.navigate({
                moduleName: 'pages/tabs/tabs-page',
                animated: true,
            });
        } catch (e) {
            MobileUtils.alertApiError(e);
        }
        await DeviceActionUtils.hideLoading();
    }

    togglePassword() {
        this.showPassword = !this.showPassword;
    }
}
