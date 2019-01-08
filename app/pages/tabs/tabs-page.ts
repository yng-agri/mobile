import { Frame } from 'tns-core-modules/ui/frame/frame';
import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { TabsViewModel } from './tabs-view-model';

export function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    page.bindingContext = new TabsViewModel(page.getViewById<Frame>('root'));
}
