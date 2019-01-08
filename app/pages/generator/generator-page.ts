import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { GeneratorViewModel } from './generator-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new GeneratorViewModel(page);
}
