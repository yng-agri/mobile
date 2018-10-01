export class BwSecureStorage {
    init(): void;
    get<T>(key: string): Promise<T>;
    save(key: string, obj: any): Promise<any>;
    remove(key: string): Promise<any>;
}
