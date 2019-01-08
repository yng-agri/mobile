import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { GroupingsViewModel } from './groupings-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new GroupingsViewModel(page);
}
