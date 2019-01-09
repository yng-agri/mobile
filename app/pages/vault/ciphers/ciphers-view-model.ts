import { Observable } from 'tns-core-modules/data/observable';
import { ObservableArray } from 'tns-core-modules/data/observable-array';
import { Page } from 'tns-core-modules/ui/page/page';

import { ItemEventData } from 'tns-core-modules/ui/list-view';

import { CipherType } from 'jslib/enums/cipherType';

import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { SearchService } from 'jslib/abstractions/search.service';

import { TreeNode } from 'jslib/models/domain/treeNode';

import { CipherView } from 'jslib/models/view/cipherView';
import { CollectionView } from 'jslib/models/view/collectionView';
import { FolderView } from 'jslib/models/view/folderView';

export class CiphersViewModel extends Observable {
    items = new ObservableArray([]);
    loaded: boolean = false;
    ciphers: CipherView[] = [];
    searchText: string;
    searchPlaceholder: string = null;
    filter: (cipher: CipherView) => boolean = null;
    folderId: string = null;
    collectionId: string = null;
    type: CipherType = null;
    pagedCiphers: CipherView[] = [];
    nestedFolders: Array<TreeNode<FolderView>>;
    nestedCollections: Array<TreeNode<CollectionView>>;
    groupingTitle: string;

    protected searchPending = false;

    private searchTimeout: any = null;

    constructor(private page: Page, private context: any,
        protected searchService: SearchService, protected i18nService: I18nService,
        protected folderService: FolderService, protected collectionService: CollectionService) {
        super();
    }

    async init() {
        if (this.context.type) {
            this.searchPlaceholder = this.i18nService.t('searchType');
            this.type = parseInt(this.context.type, null);
            switch (this.type) {
                case CipherType.Login:
                    this.groupingTitle = this.i18nService.t('logins');
                    break;
                case CipherType.Card:
                    this.groupingTitle = this.i18nService.t('cards');
                    break;
                case CipherType.Identity:
                    this.groupingTitle = this.i18nService.t('identities');
                    break;
                case CipherType.SecureNote:
                    this.groupingTitle = this.i18nService.t('secureNotes');
                    break;
                default:
                    break;
            }
            await this.load((c) => c.type === this.type);
        } else if (this.context.folderId) {
            this.folderId = this.context.folderId === 'none' ? null : this.context.folderId;
            this.searchPlaceholder = this.i18nService.t('searchFolder');
            if (this.folderId != null) {
                const folderNode = await this.folderService.getNested(this.folderId);
                if (folderNode != null && folderNode.node != null) {
                    this.groupingTitle = folderNode.node.name;
                    this.nestedFolders = folderNode.children != null && folderNode.children.length > 0 ?
                        folderNode.children : null;
                }
            } else {
                this.groupingTitle = this.i18nService.t('noneFolder');
            }
            await this.load((c) => c.folderId === this.folderId);
        } else if (this.context.collectionId) {
            this.collectionId = this.context.collectionId;
            this.searchPlaceholder = this.i18nService.t('searchCollection');
            const collectionNode = await this.collectionService.getNested(this.collectionId);
            if (collectionNode != null && collectionNode.node != null) {
                this.groupingTitle = collectionNode.node.name;
                this.nestedCollections = collectionNode.children != null && collectionNode.children.length > 0 ?
                    collectionNode.children : null;
            }
            await this.load((c) => c.collectionIds != null && c.collectionIds.indexOf(this.collectionId) > -1);
        } else {
            this.groupingTitle = this.i18nService.t('allItems');
            await this.load();
        }

        let items = [];
        if (this.nestedFolders != null && this.nestedFolders.length > 0) {
            items = [...items, { isHeader: true, name: this.i18nService.t('folders') }, ...this.nestedFolders];
        }
        if (this.nestedCollections != null && this.nestedCollections.length > 0) {
            items = [...items, { isHeader: true, name: this.i18nService.t('collections') }, ...this.nestedCollections];
        }
        if (this.ciphers != null && this.ciphers.length > 0) {
            items = [...items, { isHeader: true, name: this.groupingTitle }, ...this.ciphers];
        }
        this.items.push(items);
    }

    async load(filter: (cipher: CipherView) => boolean = null) {
        await this.applyFilter(filter);
        this.loaded = true;
    }

    async refresh() {
        this.loaded = false;
        this.ciphers = [];
        await this.load(this.filter);
    }

    async applyFilter(filter: (cipher: CipherView) => boolean = null) {
        this.filter = filter;
        await this.search(null);
    }

    async search(timeout: number = null) {
        this.searchPending = false;
        if (this.searchTimeout != null) {
            clearTimeout(this.searchTimeout);
        }
        if (timeout == null) {
            this.ciphers = await this.searchService.searchCiphers(this.searchText, this.filter);
            return;
        }
        this.searchPending = true;
        this.searchTimeout = setTimeout(async () => {
            this.ciphers = await this.searchService.searchCiphers(this.searchText, this.filter);
            this.searchPending = false;
        }, timeout);
    }

    itemTapped(args: ItemEventData) {
        const item = this.items.getItem(args.index);
        const context: any = {};
        if (item.isHeader) {
            return;
        } else if (item.type != null) {
            // cipher view
            return;
        } else if (item.node.organizationId != null) {
            context.collectionId = item.node.id;
        } else {
            context.folderId = item.node.id;
        }
        this.page.frame.navigate({
            moduleName: 'pages/vault/ciphers/ciphers-page',
            animated: true,
            context: context,
        });
    }
}
