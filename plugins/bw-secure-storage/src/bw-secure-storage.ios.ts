export class BwSecureStorage {
    init(options: any) {
        // Nothing to do
    }

    get<T>(key: string): Promise<T> {
        return Promise.resolve(null);
    }

    save(key: string, obj: any): Promise<any> {
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        return Promise.resolve();
    }
}
