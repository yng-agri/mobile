import {
    EventData,
    NavigatedData,
    Page,
    View,
} from 'tns-core-modules/ui/page';

import { HomeViewModel } from './home-view-model';

import { MobileUtils } from '~/misc/mobileUtils';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new HomeViewModel();
    page.actionBarHidden = true;
}

export function onLoginButtonTap(args: EventData) {
    (args.object as View).page.frame.navigate({
        moduleName: 'pages/login/login-page',
        animated: true,
    });
}

export function onRegisterButtonTap(args: EventData) {
    (args.object as View).page.frame.navigate({
        moduleName: 'pages/login/login-page',
        animated: true,
    });
}
