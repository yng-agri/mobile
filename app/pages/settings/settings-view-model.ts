import {
    EventData,
    Observable,
} from 'tns-core-modules/data/observable';
import { ItemEventData } from 'tns-core-modules/ui/list-view/list-view';
import {
    Page,
    View,
} from 'tns-core-modules/ui/page/page';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { MessagingService } from 'jslib/abstractions/messaging.service';

export class SettingsViewModel extends Observable {
    items: any[];

    constructor(private page: Page, private messagingService: MessagingService,
        private i18nService: I18nService) {
        super();
        this.items = [
            { isHeader: true, name: 'Manage' },
            { type: 'button', id: 'sync', name: this.i18nService.t('sync') },
            { isHeader: true, name: 'Security' },
            { isHeader: true, name: 'Account' },
            { type: 'button', id: 'logout', name: this.i18nService.t('logOut') },
            { isHeader: true, name: 'Tools' },
            { isHeader: true, name: 'Other' },
        ];
    }

    itemTapped(args: ItemEventData) {
        const item = this.items[args.index];
        const context: any = {};
        if (item.isHeader) {
            return;
        } else if (item.id === 'logout') {
            this.messagingService.send('logout', { confirm: true });
        } else if (item.id === 'sync') {
            this.page.frame.navigate({
                moduleName: 'pages/settings/sync/sync-page',
                animated: true,
            });
        }
    }
}
