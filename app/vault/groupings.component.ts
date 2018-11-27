import {
    Component,
    OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';
import { ItemEventData } from 'tns-core-modules/ui/list-view';

import { CipherType } from 'jslib/enums/cipherType';

import { CipherView } from 'jslib/models/view/cipherView';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { SearchService } from 'jslib/abstractions/search.service';
import { StorageService } from 'jslib/abstractions/storage.service';
import { SyncService } from 'jslib/abstractions/sync.service';
import { UserService } from 'jslib/abstractions/user.service';

import { BroadcasterService } from 'jslib/angular/services/broadcaster.service';

import { GroupingsComponent as BaseGroupingsComponent } from 'jslib/angular/components/groupings.component';

const ComponentId = 'GroupingsComponent';

@Component({
    selector: 'app-groupings',
    moduleId: module.id,
    templateUrl: './groupings.component.html',
})
export class GroupingsComponent extends BaseGroupingsComponent implements OnInit {
    items: any[] = [];
    ciphers: CipherView[];
    favoriteCiphers: CipherView[];
    noFolderCiphers: CipherView[];
    folderCounts = new Map<string, number>();
    collectionCounts = new Map<string, number>();
    typeCounts = new Map<CipherType, number>();
    searchText: string;
    searchPending = false;

    private loadedTimeout: any;
    private noFolderListSize = 100;
    private searchTimeout: any = null;
    private hasSearched = false;
    private hasLoadedAllCiphers = false;
    private allCiphers: CipherView[] = null;

    constructor(collectionService: CollectionService, folderService: FolderService,
        storageService: StorageService, userService: UserService,
        private broadcasterService: BroadcasterService, private syncService: SyncService,
        private searchService: SearchService, private cipherService: CipherService,
        private routerExtensions: RouterExtensions, private route: ActivatedRoute) {
        super(collectionService, folderService, storageService, userService);
    }

    get showNoFolderCiphers(): boolean {
        return this.noFolderCiphers != null && this.noFolderCiphers.length < this.noFolderListSize &&
            this.collections.length === 0;
    }

    get folderCount(): number {
        return this.folders.length - (this.showNoFolderCiphers ? 0 : 1);
    }

    async ngOnInit() {
        this.broadcasterService.subscribe(ComponentId, (message: any) => {
            switch (message.command) {
                case 'syncCompleted':
                    setTimeout(() => {
                        this.load();
                    }, 500);
                    break;
                default:
                    break;
            }
        });

        if (!this.syncService.syncInProgress) {
            this.load();
        } else {
            this.loadedTimeout = setTimeout(() => {
                if (!this.loaded) {
                    this.load();
                }
            }, 5000);
        }
    }

    async load() {
        await super.load(false);
        await this.loadCiphers();
        if (this.showNoFolderCiphers && this.folders.length > 0) {
            // Remove "No Folder" from folder listing
            this.folders = this.folders.slice(0, this.folders.length - 1);
        }

        this.items = [];
        if (this.favoriteCiphers != null && this.favoriteCiphers.length > 0) {
            this.items = [...this.items, { isHeader: true, name: 'Favorites' }, ...this.favoriteCiphers];
        }
        this.items = [...this.items, { isHeader: true, name: 'Types' }, ...[
            { isType: true, name: 'Logins', type: CipherType.Login, icon: String.fromCharCode(0xf0ac) },
            { isType: true, name: 'Card', type: CipherType.Card, icon: String.fromCharCode(0xf09d) },
            { isType: true, name: 'Identity', type: CipherType.Identity, icon: String.fromCharCode(0xf2c3) },
            { isType: true, name: 'Secure Note', type: CipherType.SecureNote, icon: String.fromCharCode(0xf24a) },
        ]];
        if (this.nestedFolders != null && this.nestedFolders.length > 0) {
            this.items = [...this.items, { isHeader: true, name: 'Folders' }, ...this.nestedFolders];
        }
        if (this.nestedCollections != null && this.nestedCollections.length > 0) {
            this.items = [...this.items, { isHeader: true, name: 'Collections' }, ...this.nestedCollections];
        }
        this.loaded = true;
    }

    async loadCiphers() {
        this.allCiphers = await this.cipherService.getAllDecrypted();
        if (!this.hasLoadedAllCiphers) {
            this.hasLoadedAllCiphers = !this.searchService.isSearchable(this.searchText);
        }
        await this.search(null);
        let favoriteCiphers: CipherView[] = null;
        let noFolderCiphers: CipherView[] = null;
        const folderCounts = new Map<string, number>();
        const collectionCounts = new Map<string, number>();
        const typeCounts = new Map<CipherType, number>();

        this.ciphers.forEach((c) => {
            if (c.favorite) {
                if (favoriteCiphers == null) {
                    favoriteCiphers = [];
                }
                favoriteCiphers.push(c);
            }

            if (c.folderId == null) {
                if (noFolderCiphers == null) {
                    noFolderCiphers = [];
                }
                noFolderCiphers.push(c);
            }

            if (typeCounts.has(c.type)) {
                typeCounts.set(c.type, typeCounts.get(c.type) + 1);
            } else {
                typeCounts.set(c.type, 1);
            }

            if (folderCounts.has(c.folderId)) {
                folderCounts.set(c.folderId, folderCounts.get(c.folderId) + 1);
            } else {
                folderCounts.set(c.folderId, 1);
            }

            if (c.collectionIds != null) {
                c.collectionIds.forEach((colId) => {
                    if (collectionCounts.has(colId)) {
                        collectionCounts.set(colId, collectionCounts.get(colId) + 1);
                    } else {
                        collectionCounts.set(colId, 1);
                    }
                });
            }
        });

        this.favoriteCiphers = favoriteCiphers;
        this.noFolderCiphers = noFolderCiphers;
        this.typeCounts = typeCounts;
        this.folderCounts = folderCounts;
        this.collectionCounts = collectionCounts;
    }

    async search(timeout: number = null) {
        this.searchPending = false;
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }
        if (timeout == null) {
            this.hasSearched = this.searchService.isSearchable(this.searchText);
            this.ciphers = await this.searchService.searchCiphers(this.searchText, null, this.allCiphers);
            return;
        }
        this.searchPending = true;
        this.searchTimeout = setTimeout(async () => {
            this.hasSearched = this.searchService.isSearchable(this.searchText);
            if (!this.hasLoadedAllCiphers && !this.hasSearched) {
                await this.loadCiphers();
            } else {
                this.ciphers = await this.searchService.searchCiphers(this.searchText, null, this.allCiphers);
            }
            this.searchPending = false;
        }, timeout);
    }

    templateSelector(item: any, index: number, items: any[]) {
        if (item.isHeader) {
            return 'header';
        }
        if (item.isType) {
            return 'type';
        }
        if (item.type != null) {
            return 'cipher';
        }
        if (item.node != null && item.node.organizationId != null) {
            return 'collection';
        }
        return 'folder';
    }

    async selectType(type: CipherType) {
        super.selectType(type);
        this.routerExtensions.navigate(['../ciphers'], {
            queryParams: { type: type },
            relativeTo: this.route,
            animated: true,
            transition: {
                name: 'slide',
                duration: 400
            }
        });
    }

    async selectFolder(folder: FolderView) {
        super.selectFolder(folder);
        this.routerExtensions.navigate(['../ciphers'], {
            queryParams: { folderId: folder.id || 'none' },
            relativeTo: this.route,
            animated: true,
            transition: {
                name: 'slide',
                duration: 400
            }
        });
    }

    async selectCollection(collection: CollectionView) {
        super.selectCollection(collection);
        this.routerExtensions.navigate(['../ciphers'], {
            queryParams: { collectionId: collection.id },
            relativeTo: this.route,
            animated: true,
            transition: {
                name: 'slide',
                duration: 400
            }
        });
    }

    async selectCipher(cipher: CipherView) {

    }

    onItemTap(args: ItemEventData) {
        const item: any = this.items[args.index];
        if (item.isHeader) {
            return;
        } else if (item.isType) {
            this.selectType(item.type);
        } else if (item.type != null) {
            this.selectCipher(item);
        } else if (item.organizationId != null) {
            this.selectCollection(item);
        } else {
            this.selectFolder(item);
        }
    }
}