import { BroadcasterService } from 'jslib/abstractions/broadcaster.service';

import { MobileUtils } from './misc/mobileUtils';

export class AppMain {
    inited = false;

    init() {
        if (this.inited) {
            return;
        }
        this.inited = true;
        const broadcasterService = MobileUtils.resolveService<BroadcasterService>('broadcasterService');
        broadcasterService.subscribe('AppMain', (message: any) => {
            console.log('Got message in AppMain');
            console.log(message);
        });
    }
}
