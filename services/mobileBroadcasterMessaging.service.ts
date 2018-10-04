import { MessagingService } from 'jslib/abstractions/messaging.service';

import { BroadcasterService } from 'jslib/angular/services/broadcaster.service';

import { ServiceContainer } from './serviceContainer';

export class MobileBroadcasterMessagingService implements MessagingService {
    private mainMessagingService: MessagingService;
    private inited = false;

    constructor(private broadcasterService: BroadcasterService) { }

    init(serviceContainer: ServiceContainer) {
        if (this.inited) {
            return;
        }
        this.mainMessagingService = serviceContainer.resolve<MessagingService>('messagingService');
        serviceContainer.registerMessageClient('mobileBroadcasterMessagingService', (message: any) => {
            this.broadcasterService.send(message);
        });
        this.inited = true;
    }

    send(subscriber: string, arg: any = {}) {
        this.mainMessagingService.send(subscriber, arg);
    }
}
