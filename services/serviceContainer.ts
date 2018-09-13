export class ServiceContainer {
    static registeredServices: Map<string, any> = new Map<string, any>();
    static inited = false;

    static init() {
        if (ServiceContainer.inited) {
            return;
        }
        console.log('init service container');
        ServiceContainer.inited = true;
        ServiceContainer.register('serviceContainer', this);
        ServiceContainer.register('testString', 'hello world');
    }

    static register(serviceName: string, value: any) {
        if (ServiceContainer.registeredServices.has(serviceName)) {
            throw new Error('Service ' + serviceName + ' has already been registered.');
        }
        ServiceContainer.registeredServices.set(serviceName, value);
    }

    static resolve<T>(serviceName: string): T {
        if (!ServiceContainer.inited) {
            throw new Error('Service container has not been inited.');
        }
        if (ServiceContainer.registeredServices.has(serviceName)) {
            return ServiceContainer.registeredServices.get(serviceName) as T;
        }
        throw new Error('Service ' + serviceName + ' is not registered.');
    }
}
