import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalDialogParams } from 'nativescript-angular/modal-dialog';

import { AuditService } from 'jslib/abstractions/audit.service';
import { CipherService } from 'jslib/abstractions/cipher.service';
import { CollectionService } from 'jslib/abstractions/collection.service';
import { FolderService } from 'jslib/abstractions/folder.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';
import { StateService } from 'jslib/abstractions/state.service';
import { UserService } from 'jslib/abstractions/user.service';

import { AddEditComponent as BaseAddEditComponent } from 'jslib/angular/components/add-edit.component';

@Component({
    selector: 'app-vault-add-edit',
    templateUrl: 'add-edit.component.html',
})
export class AddEditComponent extends BaseAddEditComponent {
    showAttachments = true;

    constructor(cipherService: CipherService, folderService: FolderService,
        i18nService: I18nService, platformUtilsService: PlatformUtilsService,
        auditService: AuditService, stateService: StateService,
        userService: UserService, collectionService: CollectionService,
        private route: ActivatedRoute, private params: ModalDialogParams) {
        super(cipherService, folderService, i18nService, platformUtilsService, auditService, stateService,
            userService, collectionService);
    }

    async ngOnInit() {
        await super.ngOnInit();
        if (this.params.context.cipherId) {
            this.cipherId = this.params.context.cipherId;
        }
        if (this.params.context.folderId) {
            this.folderId = this.params.context.folderId;
        }
        if (this.params.context.collectionId) {
            const collection = this.writeableCollections.filter((c) => c.id === this.params.context.collectionId);
            if (collection != null && collection.length > 0) {
                this.collectionIds = [collection[0].id];
                this.organizationId = collection[0].organizationId;
            }
        }
        if (this.params.context.type) {
            const type = parseInt(this.params.context.type, null);
            this.type = type;
        }
        this.editMode = !this.params.context.cipherId;
        await this.load();

        if (!this.editMode) {
            if (this.params.context.name && (this.cipher.name == null || this.cipher.name === '')) {
                this.cipher.name = this.params.context.name;
            }
            if (this.params.context.uri && (this.cipher.login.uris[0].uri == null ||
                this.cipher.login.uris[0].uri === '')) {
                this.cipher.login.uris[0].uri = this.params.context.uri;
            }

            if (this.cipher.name != null && this.cipher.name !== '') {
                // TODO: focus username
            } else {
                // TODO: focus name
            }
        }
    }

    async submit(): Promise<boolean> {
        if (await super.submit()) {
            this.params.closeCallback();
            return true;
        }

        return false;
    }

    attachments() {
        super.attachments();
        // this.router.navigate(['/attachments'], { queryParams: { cipherId: this.cipher.id } });
    }

    share() {
        super.share();
        if (this.cipher.organizationId == null) {
            // this.router.navigate(['/share-cipher'], { queryParams: { cipherId: this.cipher.id } });
        }
    }

    editCollections() {
        super.editCollections();
        if (this.cipher.organizationId != null) {
            // this.router.navigate(['/collections'], { queryParams: { cipherId: this.cipher.id } });
        }
    }

    cancel() {
        super.cancel();
        this.params.closeCallback();
    }

    async generatePassword(): Promise<boolean> {
        const confirmed = await super.generatePassword();
        if (confirmed) {
            // this.router.navigate(['generator']);
        }
        return confirmed;
    }

    async delete(): Promise<boolean> {
        const confirmed = await super.delete();
        if (confirmed) {
            this.params.closeCallback();
        }
        return confirmed;
    }
}
