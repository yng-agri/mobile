import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { CiphersViewModel } from './ciphers-view-model';

import { MobileUtils } from '~/misc/mobileUtils';

export async function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    const model = new CiphersViewModel(page, args.context, MobileUtils.resolveService('searchService'),
        MobileUtils.resolveService('i18nService'), MobileUtils.resolveService('folderService'),
        MobileUtils.resolveService('collectionService'));
    page.bindingContext = model;
    await model.init();
}

export function templateSelector(item: any, index: number, items: any[]) {
    if (item.isHeader) {
        return 'header';
    }
    if (item.type != null) {
        return 'cipher';
    }
    if (item.node != null && item.node.organizationId != null) {
        return 'collection';
    }
    return 'folder';
}
