import { MessagingService } from 'jslib/abstractions/messaging.service';

export class MobileMainMessagingService implements MessagingService {
    private messageClients: Map<string, (message: any) => void> = new Map<string, (message: any) => void>();

    send(subscriber: string, arg: any = {}) {
        const message = Object.assign({}, { command: subscriber }, arg);
        this.messageClients.forEach((c) => c(message));
    }

    registerClient(client: string, callback: (message: any) => void) {
        this.messageClients.set(client, callback);
    }

    removeClient(client: string) {
        this.messageClients.delete(client);
    }
}
