import { StateService } from 'jslib/services/state.service';

import { I18nService } from './i18n.service';
import { LowdbStorageService } from './lowdbStorage.service';
//import { MobileSecureStorageService } from './mobileSecureStorage.service';
//import { NodeCryptoFunctionService } from 'jslib/services/nodeCryptoFunction.service';
//import { CryptoService } from 'jslib/services';
import { MobilePlatformUtilsService } from './mobilePlatformUtils.service';

export class ServiceContainer {
    registeredServices: Map<string, any> = new Map<string, any>();
    inited = false;
    bootstrapped = false;

    private bootstrapPromise: Promise<void> = null;

    init() {
        if (this.inited) {
            return;
        }
        this.inited = true;

        const stateService = new StateService();
        const i18nService = new I18nService('en');
        const platformUtilsService = new MobilePlatformUtilsService(i18nService);
        //const cryptoFunctionService = new NodeCryptoFunctionService();
        const storageService = new LowdbStorageService();
        //let cryptoService: CryptoService = null;
        //const secureStorageService = new MobileSecureStorageService(storageService, cryptoFunctionService,
        //    () => cryptoService);
        //cryptoService = new CryptoService(storageService, secureStorageService, cryptoFunctionService);

        this.register('serviceContainer', this);
        this.register('stateService', stateService);
        this.register('i18nService', i18nService);
        this.register('platformUtilsService', platformUtilsService);
        //this.register('cryptoFunctionService', cryptoFunctionService);
        this.register('storageService', storageService);
        //this.register('secureStorageService', secureStorageService);
        //this.register('cryptoService', cryptoService);
    }

    async bootstrap() {
        if (this.bootstrapped) {
            return Promise.resolve();
        }
        if (this.bootstrapPromise == null) {
            this.bootstrapPromise = this.resolve<I18nService>('i18nService').init().then(() => {
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

    resolve<T>(serviceName: string): T {
        this.init();
        if (this.registeredServices.has(serviceName)) {
            return this.registeredServices.get(serviceName) as T;
        }
        throw new Error('Service ' + serviceName + ' is not registered.');
    }
}
