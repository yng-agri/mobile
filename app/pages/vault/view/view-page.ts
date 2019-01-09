import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { ViewViewModel } from './view-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new ViewViewModel(page, null);
}
