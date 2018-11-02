import {
    Component,
    OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { RouterExtensions } from 'nativescript-angular/router';

import { CipherType } from 'jslib/enums/cipherType';

import { CipherView } from 'jslib/models/view/cipherView';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { SearchService } from 'jslib/abstractions/search.service';
import { SyncService } from 'jslib/abstractions/sync.service';

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
        private broadcasterService: BroadcasterService, private syncService: SyncService,
        private searchService: SearchService, private cipherService: CipherService,
        private routerExtensions: RouterExtensions, private route: ActivatedRoute) {
        super(collectionService, folderService);
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
                    if (message.successfully) {
                        setTimeout(() => {
                            this.load();
                        }, 500);
                    }
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
            { isType: true, name: 'Logins', type: CipherType.Login },
            { isType: true, name: 'Card', type: CipherType.Card },
            { isType: true, name: 'Identity', type: CipherType.Identity },
            { isType: true, name: 'Secure Note', type: CipherType.SecureNote },
        ]];
        if (this.folders != null && this.folders.length > 0) {
            this.items = [...this.items, { isHeader: true, name: 'Folders' }, ...this.folders];
        }
        if (this.collections != null && this.collections.length > 0) {
            this.items = [...this.items, { isHeader: true, name: 'Collections' }, ...this.collections];
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
        if (item.organizationId != null) {
            return 'collection';
        }
        return 'folder';
    }

    async selectType(type: CipherType) {
        super.selectType(type);
        this.routerExtensions.navigate(['../ciphers'],
            { queryParams: { type: type }, relativeTo: this.route });
    }

    async selectFolder(folder: FolderView) {
        super.selectFolder(folder);
        this.routerExtensions.navigate(['../ciphers'],
            { queryParams: { folderId: folder.id || 'none' }, relativeTo: this.route });
    }

    async selectCollection(collection: CollectionView) {
        super.selectCollection(collection);
        this.routerExtensions.navigate(['../ciphers'],
            { queryParams: { collectionId: collection.id }, relativeTo: this.route });
    }

    async selectCipher(cipher: CipherView) {
        this.routerExtensions.navigate(['view-cipher'],
            { queryParams: { cipherId: cipher.id }, relativeTo: this.route });
    }
}