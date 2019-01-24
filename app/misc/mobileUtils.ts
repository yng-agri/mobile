import {
    android as androidApp,
    ios as iosApp,
} from 'tns-core-modules/application';
import { AlertOptions } from 'tns-core-modules/ui/dialogs';
import {
    Frame,
    Page,
    ShownModallyData,
} from 'tns-core-modules/ui/frame/frame';

import { I18nService } from 'jslib/abstractions/i18n.service';

import { ErrorResponse } from 'jslib/models/response/errorResponse';

import { DeviceActionUtils } from './deviceActionUtils';

import { ServiceContainer } from '../../services/serviceContainer';

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

    static showModal(page: Page, moduleName: string, context: any, closedCallback: Function) {
        const frame = new Frame();
        const mergedArgs = { closeModal: null, modalClosed: null };
        frame.on('shownModally', (args: ShownModallyData) => {
            mergedArgs.closeModal = args.closeCallback;
            frame.navigate({
                moduleName: moduleName,
                context: Object.assign(mergedArgs, args.context == null ? {} : args.context),
                animated: false,
            });
        });
        page.showModal(frame, context, () => {
            if (closedCallback != null) {
                closedCallback();
            }
            if (mergedArgs != null && mergedArgs.modalClosed != null) {
                mergedArgs.modalClosed();
            }
        }, true, true);
    }

    static alertError(data: any) {
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

    static async doActionWithLoading<T>(action: () => Promise<T>, errorAction: (e: any) => void = null,
        message: string = null) {
        if (message == null) {
            message = MobileUtils.resolveService<I18nService>('i18nService').t('loading');
        }
        await DeviceActionUtils.showLoading(message);
        try {
            const result = await action();
            await DeviceActionUtils.hideLoading();
            return result;
        } catch (e) {
            await DeviceActionUtils.hideLoading();
            if (errorAction != null) {
                errorAction(e);
            } else if (e != null) {
                MobileUtils.alertError(e);
            }
        }
    }
}
