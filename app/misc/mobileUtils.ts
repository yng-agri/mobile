import {
    android as androidApp,
    ios as iosApp,
} from 'tns-core-modules/application';
import { AlertOptions } from 'tns-core-modules/ui/dialogs';

import { I18nService } from 'jslib/abstractions/i18n.service';

import { ServiceContainer } from '../../services/serviceContainer';

import { ErrorResponse } from 'jslib/models/response/errorResponse';

export class MobileUtils {
    static getServiceContainer(): ServiceContainer {
        let serviceContainer: ServiceContainer = null;
        if (androidApp != null) {
            serviceContainer = androidApp.context.serviceContainer;
        } else if (iosApp != null) {
            serviceContainer = iosApp.delegate.serviceContainer;
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

    static isIos() {
        return iosApp != null;
    }

    static isAndroid() {
        return androidApp != null;
    }

    static alertApiError(data: any) {
        const defaultErrorMessage = MobileUtils.i18n('unexpectedError');
        let message = '';

        if (data != null && typeof data === 'string') {
            message = data;
        } else if (data == null || typeof data !== 'object') {
            message = defaultErrorMessage;
        } else if (data.validationErrors != null) {
            message = (data as ErrorResponse).getSingleMessage();
        } else {
            message = data.message ? data.message : defaultErrorMessage;
        }

        const alertOptions: AlertOptions = {
            title: MobileUtils.i18n('errorOccurred'),
            message: message,
            okButtonText: MobileUtils.i18n('ok'),
        };

        alert(alertOptions);
    }
}
