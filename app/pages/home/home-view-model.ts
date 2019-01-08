import {
    EventData,
    Observable,
} from 'tns-core-modules/data/observable';
import {
    Page,
    View,
} from 'tns-core-modules/ui/page/page';

export class HomeViewModel extends Observable {
    constructor(private page: Page) {
        super();
    }

    login(args: EventData) {
        this.page.frame.navigate({
            moduleName: 'pages/login/login-page',
            animated: true,
        });
    }

    register(args: EventData) {
        this.page.frame.navigate({
            moduleName: 'pages/login/login-page',
            animated: true,
        });
    }
}
