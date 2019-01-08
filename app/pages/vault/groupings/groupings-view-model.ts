import { Observable } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { Page } from 'tns-core-modules/ui/page/page';

import { ItemEventData } from 'tns-core-modules/ui/list-view';

import { CipherView } from 'jslib/models/view/cipherView';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

import { TreeNode } from 'jslib/models/domain/treeNode';

import { CipherType } from 'jslib/enums/cipherType';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';

export class GroupingsViewModel extends Observable {
    loaded = false;
    items = new ObservableArray([]);
    folderCounts = new Map<string, number>();
    collectionCounts = new Map<string, number>();
    typeCounts = new Map<CipherType, number>();

    private favoriteCiphers: CipherView[];
    private noFolderCiphers: CipherView[];

    private allCiphers: CipherView[] = null;
    private ciphers: CipherView[];
    private folders: FolderView[];
    private nestedFolders: Array<TreeNode<FolderView>>;
    private collections: CollectionView[];
    private nestedCollections: Array<TreeNode<CollectionView>>;

    constructor(private page: Page, private collectionService: CollectionService,
        private folderService: FolderService, private cipherService: CipherService) {
        super();
    }

    async load() {
        await this.loadFolders();
        await this.loadCollections();
        await this.loadCiphers();

        if (this.folders.length > 0) {
            // Remove "No Folder" from folder listing
            this.folders = this.folders.slice(0, this.folders.length - 1);
        }

        let items = [];
        if (this.favoriteCiphers != null && this.favoriteCiphers.length > 0) {
            items = [...items, { isHeader: true, name: 'Favorites' }, ...this.favoriteCiphers];
        }
        items = [...items, { isHeader: true, name: 'Types' }, ...[
            { isType: true, name: 'Logins', type: CipherType.Login, icon: String.fromCharCode(0xf0ac) },
            { isType: true, name: 'Card', type: CipherType.Card, icon: String.fromCharCode(0xf09d) },
            { isType: true, name: 'Identity', type: CipherType.Identity, icon: String.fromCharCode(0xf2c3) },
            { isType: true, name: 'Secure Note', type: CipherType.SecureNote, icon: String.fromCharCode(0xf24a) },
        ]];
        if (this.nestedFolders != null && this.nestedFolders.length > 0) {
            items = [...items, { isHeader: true, name: 'Folders' }, ...this.nestedFolders];
        }
        if (this.nestedCollections != null && this.nestedCollections.length > 0) {
            items = [...items, { isHeader: true, name: 'Collections' }, ...this.nestedCollections];
        }

        this.items.push(items);
        this.loaded = true;
    }

    async loadCollections() {
        this.collections = await this.collectionService.getAllDecrypted();
        this.nestedCollections = await this.collectionService.getAllNested(this.collections);
    }

    async loadFolders() {
        this.folders = await this.folderService.getAllDecrypted();
        this.nestedFolders = await this.folderService.getAllNested();
    }

    async loadCiphers() {
        this.allCiphers = await this.cipherService.getAllDecrypted();

        let favoriteCiphers: CipherView[] = null;
        let noFolderCiphers: CipherView[] = null;
        const folderCounts = new Map<string, number>();
        const collectionCounts = new Map<string, number>();
        const typeCounts = new Map<CipherType, number>();

        this.allCiphers.forEach((c) => {
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

    itemTapped(args: ItemEventData) {
        const item = this.items.getItem(args.index);
        if (item.isHeader) {
            return;
        } else if (item.isType) {

        } else if (item.type != null) {

        } else if (item.organizationId != null) {

        } else {

        }
    }
}
