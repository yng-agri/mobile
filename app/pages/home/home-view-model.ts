import {
    EventData,
    Observable,
} from 'tns-core-modules/data/observable';
import { View } from 'tns-core-modules/ui/page/page';

export class HomeViewModel extends Observable {
    constructor() {
        super();
    }

    login(args: EventData) {
        (args.object as View).page.frame.navigate({
            moduleName: 'pages/login/login-page',
            animated: true,
        });
    }

    register(args: EventData) {
        (args.object as View).page.frame.navigate({
            moduleName: 'pages/login/login-page',
            animated: true,
        });
    }
}
