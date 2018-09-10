import { CryptoService } from 'jslib/abstractions/crypto.service';
import { CryptoFunctionService } from 'jslib/abstractions/cryptoFunction.service';
import { StorageService } from 'jslib/abstractions/storage.service';

export class MobileSecureStorageService implements StorageService {
    constructor(storageService: StorageService, cryptoFunctionService: CryptoFunctionService,
        cryptoService: CryptoService);
    get<T>(key: string): Promise<T>;
    save(key: string, obj: any): Promise<any>;
    remove(key: string): Promise<any>;
}
