import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { AddEditViewModel } from './add-edit-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new AddEditViewModel(page);
}
