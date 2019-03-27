import { EventData } from 'tns-core-modules/data/observable';

import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';
import { TestViewModel } from './test-view-model';

export function onLoaded(args: EventData) {
    const layout = args.object as StackLayout;
    layout.bindingContext = new TestViewModel(layout);
}
