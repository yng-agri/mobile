import { Observable } from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page/page';

import { ObservableProperty } from '../../misc/observable-property.decorator';

import { AuthService } from 'jslib/abstractions/auth.service';

import { DeviceActionUtils } from '~/misc/deviceActionUtils';
import { MobileUtils } from '~/misc/mobileUtils';

export class LoginViewModel extends Observable {
    @ObservableProperty(['showPasswordIcon'])
    showPassword = false;
    @ObservableProperty() email = '';
    @ObservableProperty() masterPassword = '';

    constructor(private page: Page, private authService: AuthService) {
        super();
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
