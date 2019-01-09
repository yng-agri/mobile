import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { GroupingsViewModel } from './groupings-view-model';

import { MobileUtils } from '~/misc/mobileUtils';

import { SyncService } from 'jslib/abstractions/sync.service';

export async function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    const model = new GroupingsViewModel(page, MobileUtils.resolveService('collectionService'),
        MobileUtils.resolveService('folderService'), MobileUtils.resolveService('cipherService'),
        MobileUtils.resolveService('i18nService'));
    page.bindingContext = model;
    // await MobileUtils.resolveService<SyncService>('syncService').fullSync(true);
    await model.load();
}

export function templateSelector(item: any, index: number, items: any[]) {
    if (item.isHeader) {
        return 'header';
    }
    if (item.isType) {
        return 'type';
    }
    if (item.type != null) {
        return 'cipher';
    }
    if (item.node != null && item.node.organizationId != null) {
        return 'collection';
    }
    return 'folder';
}
