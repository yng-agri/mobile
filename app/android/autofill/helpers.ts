import { FieldCollection } from './fieldCollection';
import { FilledItem } from './filledItem';
import { Parser } from './parser';

import { CipherType } from 'jslib/enums/cipherType';

import { CipherService } from 'jslib/abstractions/cipher.service';
import { I18nService } from 'jslib/abstractions/i18n.service';

declare let com: any;

export class Helpers {
    // These browser work natively with the autofill framework
    static trustedBrowsers = new Set<string>([
        'org.mozilla.focus', 'org.mozilla.klar', 'com.duckduckgo.mobile.android',
    ]);
    // These browsers work using the compatibility shim for the autofill framework
    static compatBrowsers = new Set<string>([
        'org.mozilla.firefox', 'org.mozilla.firefox_beta', 'com.microsoft.emmx', 'com.android.chrome',
        'com.chrome.beta', 'com.android.browser', 'com.brave.browser', 'com.opera.browser',
        'com.opera.browser.beta', 'com.opera.mini.native', 'com.chrome.dev', 'com.chrome.canary',
        'com.google.android.apps.chrome', 'com.google.android.apps.chrome_dev', 'com.yandex.browser',
        'com.sec.android.app.sbrowser', 'com.sec.android.app.sbrowser.beta', 'org.codeaurora.swe.browser',
        'com.amazon.cloud9', 'mark.via.gp', 'org.bromite.bromite', 'org.chromium.chrome', 'com.kiwibrowser.browser',
        'com.ecosia.android', 'com.opera.mini.native.beta', 'org.mozilla.fennec_aurora', 'com.qwant.liberty',
    ]);

    static async getFillItems(parser: Parser, cipherService: CipherService): Promise<FilledItem[]> {
        if (parser.fieldCollection.fillableForLogin) {
            const ciphers = await cipherService.getAllDecryptedForUrl(parser.uri);
            if (ciphers != null && ciphers.length > 0) {
                return ciphers.map((c) => new FilledItem(c, parser.applicationContext));
            }
        } else if (parser.fieldCollection.fillableForCard) {
            const ciphers = await cipherService.getAllDecrypted();
            if (ciphers != null && ciphers.length > 0) {
                return ciphers.filter((c) => c.type === CipherType.Card).map(
                    (c) => new FilledItem(c, parser.applicationContext));
            }
        }
        return [];
    }

    static buildFillResponse(parser: Parser, items: FilledItem[],
        locked: boolean, i18nService: I18nService): android.service.autofill.FillResponse {
        const responseBuilder = new android.service.autofill.FillResponse.Builder();
        if (items != null && items.length > 0) {
            items.forEach((item) => {
                const dataset = Helpers.buildDataset(parser.applicationContext, parser.fieldCollection, item);
                if (dataset != null) {
                    responseBuilder.addDataset(dataset);
                }
            });
        }
        responseBuilder.addDataset(
            Helpers.buildVaultDataset(parser.applicationContext, parser.fieldCollection, parser.uri,
                locked, i18nService));
        Helpers.addSaveInfo(parser, responseBuilder, parser.fieldCollection);
        responseBuilder.setIgnoredIds(parser.fieldCollection.ignoreAutofillIds);
        return responseBuilder.build();
    }

    static buildDataset(context: android.content.Context, fields: FieldCollection,
        filledItem: FilledItem): android.service.autofill.Dataset {
        const datasetBuilder = new android.service.autofill.Dataset.Builder(
            this.buildListView(filledItem.name, filledItem.subTitle, filledItem.icon, context));
        if (filledItem.applyToFields(fields, datasetBuilder)) {
            return datasetBuilder.build();
        }
        return null;
    }

    static buildVaultDataset(context: android.content.Context, fields: FieldCollection, uri: string,
        locked: boolean, i18nService: I18nService): android.service.autofill.Dataset {
        const intent = new android.content.Intent(context, com.tns.MainActivity.class);
        intent.putExtra('autofillFramework', true);
        if (fields.fillableForLogin) {
            intent.putExtra('autofillFrameworkFillType', CipherType.Login);
        } else if (fields.fillableForCard) {
            intent.putExtra('autofillFrameworkFillType', CipherType.Card);
        } else if (fields.fillableForIdentity) {
            intent.putExtra('autofillFrameworkFillType', CipherType.Identity);
        } else {
            return null;
        }
        intent.putExtra('autofillFrameworkUri', uri);
        const pendingIntent = android.app.PendingIntent.getActivity(context, ++Helpers.pendingIntentId, intent,
            android.app.PendingIntent.FLAG_CANCEL_CURRENT);
        const iconId = context.getResources().getIdentifier(name, 'icon', context.getPackageName());
        const subText = i18nService.t(locked ? 'vaultIsLocked' : 'goToMyVault');
        const view = Helpers.buildListView(i18nService.t('autofillWithBitwarden'), subText, iconId, context);
        const datasetBuilder = new android.service.autofill.Dataset.Builder(view);
        datasetBuilder.setAuthentication(pendingIntent.getIntentSender());

        // Dataset must have a value set. We will reset this in the main activity when the real item is chosen.
        fields.autofillIds.forEach((autofillId) => {
            datasetBuilder.setValue(autofillId, android.view.autofill.AutofillValue.forText('PLACEHOLDER'));
        });

        return datasetBuilder.build();
    }

    static buildListView(text: string, subtext: string, iconId: number,
        context: android.content.Context): android.widget.RemoteViews {
        const view = new android.widget.RemoteViews(context.getPackageName(),
            context.getResources().getIdentifier('autofill_listitem', 'layout', context.getPackageName()));
        view.setTextViewText(android.R.id.text1, text);
        view.setTextViewText(android.R.id.text2, subtext);
        view.setImageViewResource(android.R.id.icon, iconId);
        return view;
    }

    static addSaveInfo(parser: Parser, responseBuilder: android.service.autofill.FillResponse.Builder,
        fields: FieldCollection): void {
        // Docs state that password fields cannot be reliably saved in Compat mode since they will show as
        // masked values.
        const compatBrowser = Helpers.compatBrowsers.has(parser.packageName);
        if (compatBrowser && fields.saveType === android.service.autofill.SaveInfo.SAVE_DATA_TYPE_PASSWORD) {
            return;
        }

        const requiredIds = fields.getRequiredSaveFields();
        if (fields.saveType === android.service.autofill.SaveInfo.SAVE_DATA_TYPE_GENERIC || requiredIds.length === 0) {
            return;
        }

        const saveBuilder = new android.service.autofill.SaveInfo.Builder(fields.saveType, requiredIds);
        const optionalIds = fields.getOptionalSaveIds();
        if (optionalIds.length > 0) {
            saveBuilder.setOptionalIds(optionalIds);
        }
        if (compatBrowser) {
            saveBuilder.setFlags(android.service.autofill.SaveInfo.FLAG_SAVE_ON_ALL_VIEWS_INVISIBLE);
        }
        responseBuilder.setSaveInfo(saveBuilder.build());
    }

    private static pendingIntentId = 0;
}
