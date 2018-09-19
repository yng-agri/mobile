import { CryptoService } from 'jslib/abstractions/crypto.service';
import { StorageService } from 'jslib/abstractions/storage.service';

export class MobileSecureStorageService extends StorageService {
    constructor(storageService: StorageService, cryptoService: () => CryptoService);
    init(): Promise<void>;
}
