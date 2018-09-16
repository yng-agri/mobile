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

    init() {
        if (this.inited) {
            return;
        }

        const stateService = new StateService();
        const i18nService = new I18nService('en');
        const platformUtilsService = new MobilePlatformUtilsService(i18nService);
        //const cryptoFunctionService = new NodeCryptoFunctionService();
        const storageService = new LowdbStorageService();
        //let cryptoService: CryptoService = null;
        //const secureStorageService = new MobileSecureStorageService(storageService, cryptoFunctionService,
        //    () => cryptoService);
        //cryptoService = new CryptoService(storageService, secureStorageService, cryptoFunctionService);

        this.inited = true;
        this.register('serviceContainer', this);
        this.register('stateService', stateService);
        this.register('i18nService', i18nService);
        this.register('platformUtilsService', platformUtilsService);
        //this.register('cryptoFunctionService', cryptoFunctionService);
        this.register('storageService', storageService);
        //this.register('secureStorageService', secureStorageService);
        //this.register('cryptoService', cryptoService);
    }

    register(serviceName: string, value: any) {
        if (this.registeredServices.has(serviceName)) {
            throw new Error('Service ' + serviceName + ' has already been registered.');
        }
        this.registeredServices.set(serviceName, value);
    }

    resolve<T>(serviceName: string): T {
        if (!this.inited) {
            throw new Error('Service container has not been inited.');
        }
        if (this.registeredServices.has(serviceName)) {
            return this.registeredServices.get(serviceName) as T;
        }
        throw new Error('Service ' + serviceName + ' is not registered.');
    }
}
