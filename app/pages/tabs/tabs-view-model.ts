import { Observable } from 'tns-core-modules/data/observable';
import { Frame } from 'tns-core-modules/ui/frame/frame';

import {
    BottomBar,
    TabSelectedEventData,
} from 'nativescript-bottombar';

export class TabsViewModel extends Observable {
    private bar: BottomBar;

    constructor(private frame: Frame) {
        super();
    }

    barLoaded(ev: any) {
        if (ev == null) {
            return;
        }
        this.bar = ev.object;
        this.bar.on('tabSelected', (selEv: TabSelectedEventData) => this.barTabSelected(selEv));
    }

    private barTabSelected(ev: TabSelectedEventData) {
        if (ev == null) {
            return;
        }
        // TODO
        switch (ev.newIndex) {
            case 0:
                this.navigateToRootPage('pages/home/home-page');
                break;
            case 1:
                this.navigateToRootPage('pages/login/login-page');
                break;
            case 2:
                this.navigateToRootPage('pages/home/home-page');
                break;
            default:
                break;
        }
    }

    private navigateToRootPage(moduleName: string) {
        this.frame.navigate({
            moduleName: moduleName,
            clearHistory: true,
            transition: null,
        });
    }
}
