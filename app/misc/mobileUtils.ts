import {
    android,
    ios,
} from 'tns-core-modules/application';

import { I18nService } from 'jslib/abstractions/i18n.service';

import { ServiceContainer } from '../../services/serviceContainer';

export class MobileUtils {
    static getServiceContainer(): ServiceContainer {
        let serviceContainer: ServiceContainer = null;
        if (android != null) {
            serviceContainer = android.context.serviceContainer;
        } else if (ios != null) {
            serviceContainer = ios.delegate.serviceContainer;
        }
        if (serviceContainer == null) {
            throw new Error('Cannot resolve service container.');
        }
        return serviceContainer;
    }

    static resolveService<T>(service: string): T {
        return MobileUtils.getServiceContainer().resolve<T>(service);
    }

    static i18n(id: string, p1?: string, p2?: string, p3?: string): string {
        return MobileUtils.resolveService<I18nService>('i18nService').t(id, p1, p2, p3);
    }
}
