import { BroadcasterService } from 'jslib/abstractions/broadcaster.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';

export class MobileBroadcasterMessagingService implements MessagingService {
    constructor(private broadcasterService: BroadcasterService) { }

    send(subscriber: string, arg: any = {}) {
        const message = Object.assign({}, { command: subscriber }, arg);
        this.broadcasterService.send(message);
    }
}
