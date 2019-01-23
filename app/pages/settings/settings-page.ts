import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { SettingsViewModel } from './settings-view-model';

import { MobileUtils } from '~/misc/mobileUtils';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new SettingsViewModel(page, MobileUtils.resolveService('messagingService'),
        MobileUtils.resolveService('i18nService'));
}

export function templateSelector(item: any, index: number, items: any[]) {
    if (item.isHeader) {
        return 'header';
    }
    return 'button';
}
