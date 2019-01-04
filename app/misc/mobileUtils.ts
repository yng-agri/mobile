import {
    android as androidApp,
    ios as iosApp,
} from 'tns-core-modules/application';

import { I18nService } from 'jslib/abstractions/i18n.service';

import { ServiceContainer } from '../../services/serviceContainer';

export class MobileUtils {

    static getServiceContainer(): ServiceContainer {
        let serviceContainer: ServiceContainer = null;
        if (android != null) {
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

    static showLoading(text: string) {
        if (android != null) {
            if (MobileUtils.androidProgressDialog != null) {
                MobileUtils.hideLoading();
            }
            MobileUtils.androidProgressDialog = new android.app.ProgressDialog(androidApp.foregroundActivity);
            MobileUtils.androidProgressDialog.setMessage(text);
            MobileUtils.androidProgressDialog.setCancelable(false);
            MobileUtils.androidProgressDialog.show();
        } else if (iosApp != null) {

        }
    }

    static hideLoading() {
        if (android != null) {
            if (MobileUtils.androidProgressDialog != null) {
                MobileUtils.androidProgressDialog.hide();
                MobileUtils.androidProgressDialog.dismiss();
                MobileUtils.androidProgressDialog = null;
            }
        } else if (iosApp != null) {

        }
    }

    private static androidProgressDialog: android.app.ProgressDialog;
}
