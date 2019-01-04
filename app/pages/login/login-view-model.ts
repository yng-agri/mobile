import { Observable } from 'tns-core-modules/data/observable';

import { AuthService } from 'jslib/abstractions/auth.service';
import { MobileUtils } from '~/misc/mobileUtils';

export class LoginViewModel extends Observable {
    email: string;
    masterPassword: string;

    protected authService: AuthService;

    constructor() {
        super();
        this.authService = MobileUtils.resolveService('authService');
    }

    async submit() {
        MobileUtils.showLoading('Loading...');
        const result = await this.authService.logIn(this.email, this.masterPassword);
        MobileUtils.hideLoading();
    }
}
