import {
    EventData,
    Observable,
} from 'tns-core-modules/data/observable';
import {
    Page,
    View,
} from 'tns-core-modules/ui/page/page';

export class GroupingsViewModel extends Observable {
    constructor(private page: Page) {
        super();
    }
}
