import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { CiphersViewModel } from './ciphers-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new CiphersViewModel(page);
}
