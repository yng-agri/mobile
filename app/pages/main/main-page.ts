import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { getFrameById } from 'tns-core-modules/ui/frame';
import { MobileUtils } from '~/misc/mobileUtils';

import { CryptoService } from 'jslib/abstractions/crypto.service';
import { UserService } from 'jslib/abstractions/user.service';

export async function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.actionBarHidden = true;

    const userService = MobileUtils.resolveService<UserService>('userService');
    const cryptoService = MobileUtils.resolveService<CryptoService>('cryptoService');

    const rootFrame = getFrameById('app-root-frame');
    let moduleName = 'pages/home/home-page';
    if (await userService.isAuthenticated) {
        if (await cryptoService.hasKey) {
            moduleName = 'pages/tabs/tabs-page';
        } else {
            moduleName = 'pages/lock/lock-page';
        }
    }
    rootFrame.navigate({
        moduleName: moduleName,
        animated: true,
        transition: null,
    });
}
