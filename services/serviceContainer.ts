import { StateService } from 'jslib/services/state.service';

import { I18nService } from './i18n.service';
import { LowdbStorageService } from './lowdbStorage.service';
import { MobileSecureStorageService } from './mobileSecureStorage.service';
import { MobileCryptoFunctionService } from './mobileCryptoFunction.service';
import { MobilePlatformUtilsService } from './mobilePlatformUtils.service';

import { ApiService } from 'jslib/services/api.service';
import { CryptoService } from 'jslib/services/crypto.service';
import { TokenService } from 'jslib/services/token.service';

export class ServiceContainer {
    registeredServices: Map<string, any> = new Map<string, any>();
    inited = false;
    bootstrapped = false;

    private bootstrapPromise: Promise<void> = null;
    private options: any;

    init(options: any = null) {
        if (this.inited) {
            return;
        }
        this.inited = true;

        const stateService = new StateService();
        const i18nService = new I18nService('en');
        const platformUtilsService = new MobilePlatformUtilsService(i18nService);
        const cryptoFunctionService = new MobileCryptoFunctionService();
        const storageService = new LowdbStorageService();
        const secureStorageService = new MobileSecureStorageService();
        const cryptoService = new CryptoService(storageService, secureStorageService, cryptoFunctionService);
        const tokenService = new TokenService(storageService);
        const apiService = new ApiService(tokenService, platformUtilsService,
            (expired) => { return Promise.resolve(); });

        this.options = options;
        if (this.options != null) {
            if (this.options.androidAppContext != null) {
                this.register('androidAppContext', this.options.androidAppContext);
            }
        }
        this.register('serviceContainer', this);
        this.register('stateService', stateService);
        this.register('i18nService', i18nService);
        this.register('platformUtilsService', platformUtilsService);
        this.register('cryptoFunctionService', cryptoFunctionService);
        this.register('storageService', storageService);
        this.register('secureStorageService', secureStorageService);
        this.register('cryptoService', cryptoService);
        this.register('tokenService', tokenService);
        this.register('apiService', apiService);
    }

    bootstrap() {
        if (this.bootstrapped) {
            return Promise.resolve();
        }
        if (this.bootstrapPromise == null) {
            this.bootstrapPromise = this.resolve<I18nService>('i18nService').init().then(() => {
                this.resolve<MobileSecureStorageService>('secureStorageService').init(
                    this.options != null ? this.options.androidAppContext : null);
                this.bootstrapped = true;
                this.bootstrapPromise = null;
            });
        }
        return this.bootstrapPromise;
    }

    register(serviceName: string, value: any) {
        this.init();
        if (this.registeredServices.has(serviceName)) {
            throw new Error('Service ' + serviceName + ' has already been registered.');
        }
        this.registeredServices.set(serviceName, value);
    }

    resolve<T>(serviceName: string, dontThrow = false): T {
        this.init();
        if (this.registeredServices.has(serviceName)) {
            return this.registeredServices.get(serviceName) as T;
        }
        if (dontThrow) {
            return null;
        }
        throw new Error('Service ' + serviceName + ' is not registered.');
    }
}
