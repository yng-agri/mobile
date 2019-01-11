import { Observable } from 'tns-core-modules/data/observable';

export function ObservableProperty(additionalProperties: string[] = null) {
    return (target: Observable | any, propertyKey: string) => {
        Object.defineProperty(target, propertyKey, {
            // tslint:disable-next-line
            get() {
                return this['_' + propertyKey];
            },
            // tslint:disable-next-line
            set(value) {
                if (this['_' + propertyKey] === value) {
                    return;
                }

                this['_' + propertyKey] = value;
                this.notifyPropertyChange(propertyKey, value);

                if (additionalProperties != null) {
                    additionalProperties.forEach((k) => this.notifyPropertyChange(k, this[k]));
                }
            },
            enumerable: true,
            configurable: true,
        });
    };
}
