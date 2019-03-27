import {
    EventData,
    Observable,
} from 'tns-core-modules/data/observable';

import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';

export class TestViewModel extends Observable {
    text = 'test text';

    constructor(private layout: StackLayout) {
        super();
        this.text = (layout as any).text;
    }
}
