import { ios as iosApp } from 'application';
import * as fs from 'file-system';
import * as lowdb from 'lowdb';
import * as AdapterBase from 'lowdb/adapters/Base';

import { StorageService } from 'jslib/abstractions/storage.service';

export class NativeScriptAdapter extends AdapterBase {
    read() {
        if (fs.File.exists(this.source)) {
            try {
                const dbFile = fs.File.fromPath(this.source);
                const data = dbFile.readTextSync();
                return data ? this.deserialize(data) : this.defaultValue;
            } catch (e) {
                if (e instanceof SyntaxError) {
                    e.message = `Malformed JSON in file: ${this.source}\n${e.message}`;
                }
                throw e;
            }
        } else {
            this.write(this.defaultValue);
            return this.defaultValue;
        }
    }

    write(data): void {
        const dbFile = fs.File.fromPath(this.source);
        dbFile.writeTextSync(this.serialize(data));
    }
}

export class LowdbStorageService implements StorageService {
    private db: lowdb.LowdbSync<any>;
    private defaults: any;
    private allowCache = true;

    constructor(defaults?: any) {
        this.defaults = defaults;

        let dir: string = null;
        if (iosApp) {
            this.allowCache = false;
            const fileManager = new NSFileManager();
            const appGroupContainer = fileManager.containerURLForSecurityApplicationGroupIdentifier(
                'group.com.8bit.bitwarden');
            dir = fs.path.join(appGroupContainer.path, 'Library'); // Library folder
        } else {
            dir = fs.knownFolders.documents().path;
        }

        const p = fs.path.join(dir, 'data.json');
        const adapter = new NativeScriptAdapter(p);
        this.db = lowdb<lowdb.AdapterSync>(adapter as any);
    }

    init() {
        if (this.defaults != null) {
            this.db.read();
            this.db.defaults(this.defaults).write();
        }
    }

    get<T>(key: string): Promise<T> {
        if (!this.allowCache) {
            this.db.read();
        }
        const val = this.db.get(key).value();
        if (val == null) {
            return Promise.resolve(null);
        }
        return Promise.resolve(val as T);
    }

    save(key: string, obj: any): Promise<any> {
        if (!this.allowCache) {
            this.db.read();
        }
        this.db.set(key, obj).write();
        return Promise.resolve();
    }

    remove(key: string): Promise<any> {
        if (!this.allowCache) {
            this.db.read();
        }
        this.db.unset(key).write();
        return Promise.resolve();
    }
}
