import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { SyncViewModel } from './sync-view-model';

import { MobileUtils } from '~/misc/mobileUtils';

export async function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    const model = new SyncViewModel(page, MobileUtils.resolveService('syncService'),
        MobileUtils.resolveService('i18nService'), MobileUtils.resolveService('platformUtilsService'));
    page.bindingContext = model;
    await model.init();
}
