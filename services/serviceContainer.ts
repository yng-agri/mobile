import { StateService } from 'jslib/services/state.service';

export class ServiceContainer {
    registeredServices: Map<string, any> = new Map<string, any>();
    inited = false;

    init() {
        if (this.inited) {
            return;
        }

        const stateService = new StateService();

        this.inited = true;
        this.register('serviceContainer', this);
        this.register('stateService', stateService);
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
