import { NavigatedData, Page } from 'tns-core-modules/ui/page';

import { LoginViewModel } from './login-view-model';

import { MobileUtils } from '~/misc/mobileUtils';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new LoginViewModel(page, MobileUtils.resolveService('authService'));
}
