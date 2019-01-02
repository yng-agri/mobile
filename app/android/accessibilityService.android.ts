import { ServiceContainer } from '../../services/serviceContainer';

import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { StateService } from 'jslib/abstractions/state.service';
import { StorageService } from 'jslib/abstractions/storage.service';

@JavaProxy('com.tns.AccessibilityService')
export class AccessibilityService extends android.accessibilityservice.AccessibilityService {
    async onAccessibilityEvent(e: android.view.accessibility.AccessibilityEvent) {
        console.log('onAccessibilityEvent : ' + e.getPackageName() + ' : ' + e.getEventType());
        const serviceContainer: ServiceContainer = (this.getApplicationContext() as any).serviceContainer;
        const storageService = serviceContainer.resolve<StorageService>('storageService');
        const stateService = serviceContainer.resolve<StateService>('stateService');
        const i18nService = serviceContainer.resolve<I18nService>('i18nService');
        const platformUtilsService = serviceContainer.resolve<PlatformUtilsService>('platformUtilsService');
        console.log('state: ' + (await stateService.get<string>('hello')));
        console.log('i18n: ' + i18nService.t('hello'));
        console.log('platform: ' + platformUtilsService.getDevice());
        console.log('storage: ' + (await storageService.get<string>('hello')));
    }

    onInterrupt() {
        // Do nothing
    }
}
