import { FilledItem } from './autofill/filledItem';
import { Helpers } from './autofill/helpers';
import { Parser } from './autofill/parser';

import { Utils } from 'jslib/misc/utils';

import { ServiceContainer } from '../../services/serviceContainer';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { LockService } from 'jslib/abstractions/lock.service';
import { CipherType } from 'jslib/enums';

// @JavaProxy('com.tns.AutofillService')
export class AutofillService extends android.service.autofill.AutofillService {
    private cipherService: CipherService;
    private lockService: LockService;
    private i18nService: I18nService;

    async onFillRequest(request: android.service.autofill.FillRequest,
        cancellationSignal: android.os.CancellationSignal, callback: android.service.autofill.FillCallback) {
        const fillContext = request.getFillContexts();
        if (fillContext == null) {
            return;
        }
        const lastContext: android.service.autofill.FillContext = fillContext[fillContext.size() - 1];
        if (lastContext == null) {
            return;
        }
        const structure = lastContext.getStructure();
        if (structure == null) {
            return;
        }

        const parser = new Parser(structure, this.getApplicationContext());
        parser.parse();

        if (Utils.isNullOrWhitespace(parser.uri) || parser.uri === 'androidapp://com.x8bit.bitwarden' ||
            parser.uri === 'androidapp://android' || !parser.fieldCollection.fillable) {
            return;
        }

        const serviceContainer: ServiceContainer = (this.getApplicationContext() as any).serviceContainer;
        if (this.lockService == null) {
            this.lockService = serviceContainer.resolve<LockService>('lockService');
        }

        let items: FilledItem[] = null;
        const locked = false; // TODO
        if (!locked) {
            if (this.cipherService == null) {
                this.cipherService = serviceContainer.resolve<CipherService>('cipherService');
            }
            items = await Helpers.getFillItems(parser, this.cipherService);
        }

        // build response
        const response = Helpers.buildFillResponse(parser, items, locked);
        callback.onSuccess(response);
    }

    onSaveRequest(request: android.service.autofill.SaveRequest, callback: android.service.autofill.SaveCallback) {
        const fillContext = request.getFillContexts();
        if (fillContext == null) {
            return;
        }
        const lastContext: android.service.autofill.FillContext = fillContext[fillContext.size() - 1];
        if (lastContext == null) {
            return;
        }
        const structure = lastContext.getStructure();
        if (structure == null) {
            return;
        }

        const parser = new Parser(structure, this.getApplicationContext());
        parser.parse();

        const savedItem = parser.fieldCollection.getSavedItem();
        if (savedItem == null) {
            android.widget.Toast.makeText(this.getApplicationContext(), 'Unable to save this form.',
                android.widget.Toast.LENGTH_SHORT).show();
            return;
        }

        const intent = new android.content.Intent(this.getApplicationContext(), null); // TODO
        intent.setFlags(android.content.Intent.FLAG_ACTIVITY_NEW_TASK | android.content.Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra('autofillFramework', true);
        intent.putExtra('autofillFrameworkSave', true);
        intent.putExtra('autofillFrameworkType', savedItem.type);
        switch (savedItem.type) {
            case CipherType.Login:
                const cleanUri = parser.uri.replace('androidapp://', '').replace('https://', '').replace('http://', '');
                intent.putExtra('autofillFrameworkName', cleanUri);
                intent.putExtra('autofillFrameworkUri', parser.uri);
                intent.putExtra('autofillFrameworkUsername', savedItem.login.username);
                intent.putExtra('autofillFrameworkPassword', savedItem.login.password);
                break;
            case CipherType.Card:
                intent.putExtra('autofillFrameworkCardName', savedItem.card.name);
                intent.putExtra('autofillFrameworkCardNumber', savedItem.card.number);
                intent.putExtra('autofillFrameworkCardExpMonth', savedItem.card.expMonth);
                intent.putExtra('autofillFrameworkCardExpYear', savedItem.card.expYear);
                intent.putExtra('autofillFrameworkCardCode', savedItem.card.code);
                break;
            default:
                android.widget.Toast.makeText(this.getApplicationContext(), 'Unable to save this type of form.',
                    android.widget.Toast.LENGTH_SHORT).show();
                return;
        }
        this.startActivity(intent);
    }
}
