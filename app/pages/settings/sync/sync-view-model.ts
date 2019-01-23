import { Observable, } from 'tns-core-modules/data/observable';
import { Page } from 'tns-core-modules/ui/page/page';

import { ObservableProperty } from '~/misc/observable-property.decorator';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { SyncService } from 'jslib/abstractions/sync.service';
import { DeviceActionUtils } from '~/misc/deviceActionUtils';
import { MobileUtils } from '~/misc/mobileUtils';

export class SyncViewModel extends Observable {
    @ObservableProperty() lastSync = '--';

    constructor(private page: Page, private syncService: SyncService,
        private i18nService: I18nService, private platformUtilsService: PlatformUtilsService) {
        super();
    }

    async init() {
        await this.setLastSync();
    }

    async sync() {
        await MobileUtils.doActionWithLoading(async () => {
            const success = await this.syncService.fullSync(true);
            if (success) {
                await this.setLastSync();
                this.platformUtilsService.eventTrack('Synced Full');
                DeviceActionUtils.toast(this.i18nService.t('syncingComplete'));
            } else {
                DeviceActionUtils.toast(this.i18nService.t('syncingFailed'));
            }
        }, () => {
            DeviceActionUtils.toast(this.i18nService.t('syncingFailed'));
        }, this.i18nService.t('syncing'));
    }

    private async setLastSync() {
        const last = await this.syncService.getLastSync();
        if (last != null) {
            this.lastSync = last.toLocaleDateString() + ' ' + last.toLocaleTimeString();
        } else {
            this.lastSync = this.i18nService.t('never');
        }
    }
}
