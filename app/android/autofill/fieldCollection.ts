import { Field } from './field';
import {
    CardItem,
    LoginItem,
    SavedItem,
} from './savedItem';

import { AndroidUtils } from '../androidUtils';

import { CipherType } from 'jslib/enums/cipherType';

import { Utils } from 'jslib/misc/utils';

export class FieldCollection {
    autofillIds: android.view.autofill.AutofillId[] = [];
    hints = new Set<string>();
    focusedHints = new Set<string>();
    fieldTrackingIds = new Set<string>();
    fields: Field[] = [];
    hintToFieldsMap = new Map<string, Field[]>();
    ignoreAutofillIds: android.view.autofill.AutofillId[] = [];

    private _passwordFields: Field[];
    private _usernameFields: Field[];

    private ignoreSearchTerms = new Set(['search', 'find', 'recipient', 'edit']);
    private passwordTerms = new Set(['password', 'pswd']);

    get saveType(): number {
        if (this.fillableForLogin) {
            return android.service.autofill.SaveInfo.SAVE_DATA_TYPE_PASSWORD;
        }
        if (this.fillableForCard) {
            return android.service.autofill.SaveInfo.SAVE_DATA_TYPE_CREDIT_CARD;
        }
        return android.service.autofill.SaveInfo.SAVE_DATA_TYPE_GENERIC;
    }

    get passwordFields(): Field[] {
        if (this._passwordFields != null) {
            return this._passwordFields;
        }
        if (this.hints.size > 0) {
            this._passwordFields = [];
            if (this.hintToFieldsMap.has(android.view.View.AUTOFILL_HINT_PASSWORD)) {
                this._passwordFields.concat(this.hintToFieldsMap.get(android.view.View.AUTOFILL_HINT_PASSWORD));
            }
        } else {
            this._passwordFields = this.fields.filter((f) => this.fieldIsPassword(f));
            if (this._passwordFields.length === 0) {
                this._passwordFields = this.fields.filter((f) => this.fieldHasPasswordTerms(f));
            }
        }
        return this._passwordFields;
    }

    get usernameFields(): Field[] {
        if (this._usernameFields != null) {
            return this._usernameFields;
        }
        this._usernameFields = [];
        if (this.hints.size > 0) {
            if (this.hintToFieldsMap.has(android.view.View.AUTOFILL_HINT_EMAIL_ADDRESS)) {
                this._usernameFields.concat(this.hintToFieldsMap.get(android.view.View.AUTOFILL_HINT_EMAIL_ADDRESS));
            }
            if (this.hintToFieldsMap.has(android.view.View.AUTOFILL_HINT_USERNAME)) {
                this._usernameFields.concat(this.hintToFieldsMap.get(android.view.View.AUTOFILL_HINT_USERNAME));
            }
        } else {
            this.passwordFields.forEach((passwordField) => {
                let usernameField: Field = null;
                for (let i = 0; i < this.fields.length; i++) {
                    if (this.fields[i].autofillId.equals(passwordField.autofillId)) {
                        break;
                    }
                    usernameField = this.fields[i];
                }
                if (usernameField != null) {
                    this._usernameFields.push(usernameField);
                }
            });
        }
        return this._usernameFields;
    }

    get fillableForLogin(): boolean {
        return this.focusedHintsContain([
            android.view.View.AUTOFILL_HINT_USERNAME,
            android.view.View.AUTOFILL_HINT_EMAIL_ADDRESS,
            android.view.View.AUTOFILL_HINT_PASSWORD,
        ]) || this.usernameFields.some((f) => f.focused) || this.passwordFields.some((f) => f.focused);
    }

    get fillableForCard(): boolean {
        return this.focusedHintsContain([
            android.view.View.AUTOFILL_HINT_CREDIT_CARD_NUMBER,
            android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH,
            android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR,
            android.view.View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE,
        ]);
    }

    get fillableForIdentity(): boolean {
        return this.focusedHintsContain([
            android.view.View.AUTOFILL_HINT_NAME,
            android.view.View.AUTOFILL_HINT_PHONE,
            android.view.View.AUTOFILL_HINT_POSTAL_ADDRESS,
            android.view.View.AUTOFILL_HINT_POSTAL_CODE,
        ]);
    }

    get fillable(): boolean {
        return this.fillableForLogin || this.fillableForCard || this.fillableForIdentity;
    }

    add(field: Field): void {
        if (field == null || this.fieldTrackingIds.has(field.trackingId)) {
            return;
        }

        this._passwordFields = this._usernameFields = null;
        this.fieldTrackingIds.add(field.trackingId);
        this.fields.push(field);
        this.autofillIds.push(field.autofillId);

        if (field.hints != null) {
            field.hints.forEach((hint) => {
                this.hints.add(hint);
                if (field.focused) {
                    this.focusedHints.add(hint);
                }
                if (!this.hintToFieldsMap.has(hint)) {
                    this.hintToFieldsMap.set(hint, []);
                }
                this.hintToFieldsMap.get(hint).push(field);
            });
        }
    }

    getSavedItem(): SavedItem {
        if (this.saveType === android.service.autofill.SaveInfo.SAVE_DATA_TYPE_PASSWORD) {
            const passwordField = this.passwordFields.find((f) => !Utils.isNullOrWhitespace(f.textValue));
            if (passwordField == null) {
                return null;
            }

            const savedItem = new SavedItem();
            savedItem.type = CipherType.Login;
            savedItem.login = new LoginItem();
            savedItem.login.password = this.getFieldValue(passwordField);

            let usernameField: Field = null;
            for (let i = 0; i < this.fields.length; i++) {
                if (this.fields[i].autofillId.equals(passwordField.autofillId)) {
                    break;
                }
                usernameField = this.fields[i];
            }
            savedItem.login.username = this.getFieldValue(usernameField);
            return savedItem;
        } else if (this.saveType === android.service.autofill.SaveInfo.SAVE_DATA_TYPE_CREDIT_CARD) {
            const savedItem = new SavedItem();
            savedItem.type = CipherType.Card;
            savedItem.card = new CardItem();
            savedItem.card.number = this.getFieldValue(android.view.View.AUTOFILL_HINT_CREDIT_CARD_NUMBER);
            savedItem.card.name = this.getFieldValue(android.view.View.AUTOFILL_HINT_NAME);
            savedItem.card.expMonth = this.getFieldValue(android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH);
            savedItem.card.expYear = this.getFieldValue(android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR);
            savedItem.card.code = this.getFieldValue(android.view.View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE);
            return savedItem;
        }

        return null;
    }

    getOptionalSaveIds(): native.Array<android.view.autofill.AutofillId> {
        let arr: android.view.autofill.AutofillId[] = [];
        if (this.saveType === android.service.autofill.SaveInfo.SAVE_DATA_TYPE_PASSWORD) {
            arr = this.usernameFields.map((f) => f.autofillId);
        } else if (this.saveType === android.service.autofill.SaveInfo.SAVE_DATA_TYPE_CREDIT_CARD) {
            const fieldList: Field[] = [];
            if (this.hintToFieldsMap.has(android.view.View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE)) {
                fieldList.concat(this.hintToFieldsMap.get(android.view.View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE));
            }
            if (this.hintToFieldsMap.has(android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR)) {
                fieldList.concat(this.hintToFieldsMap.get(android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR));
            }
            if (this.hintToFieldsMap.has(android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH)) {
                fieldList.concat(this.hintToFieldsMap.get(
                    android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH));
            }
            if (this.hintToFieldsMap.has(android.view.View.AUTOFILL_HINT_NAME)) {
                fieldList.concat(this.hintToFieldsMap.get(android.view.View.AUTOFILL_HINT_NAME));
            }
            arr = fieldList.map((f) => f.autofillId);
        }
        return AndroidUtils.toNativeArr(arr, android.view.autofill.AutofillId);
    }

    getRequiredSaveFields(): native.Array<android.view.autofill.AutofillId> {
        let arr: android.view.autofill.AutofillId[] = [];
        if (this.saveType === android.service.autofill.SaveInfo.SAVE_DATA_TYPE_PASSWORD) {
            arr = this.passwordFields.map((f) => f.autofillId);
        } else if (this.saveType === android.service.autofill.SaveInfo.SAVE_DATA_TYPE_CREDIT_CARD) {
            arr = this.hintToFieldsMap.get(
                android.view.View.AUTOFILL_HINT_CREDIT_CARD_NUMBER).map((f) => f.autofillId);
        }
        return AndroidUtils.toNativeArr(arr, android.view.autofill.AutofillId);
    }

    private focusedHintsContain(hints: string[]): boolean {
        return hints.some((h) => this.focusedHints.has(h));
    }

    private getFieldValue(field: string | Field, monthValue = false): string {
        if (typeof field === 'string') {
            if (this.hintToFieldsMap.has(field)) {
                const fields = this.hintToFieldsMap.get(field);
                for (let i = 0; i < fields.length; i++) {
                    const val = this.getFieldValue(fields[i], monthValue);
                    if (!Utils.isNullOrWhitespace(val)) {
                        return val;
                    }
                }
            }
            return null;
        }

        if (field == null) {
            return null;
        }
        if (!Utils.isNullOrWhitespace(field.textValue)) {
            if (field.autofillType === android.view.View.AUTOFILL_TYPE_LIST && field.listValue != null && monthValue) {
                if (field.autofillOptions.length === 13) {
                    return field.listValue.toString();
                } else if (field.autofillOptions.length === 12) {
                    return (field.listValue + 1).toString();
                }
            }
            return field.textValue;
        } else if (field.dateValue != null) {
            return field.dateValue.toString();
        } else if (field.toggleValue != null) {
            return field.toggleValue.toString();
        }
        return null;
    }

    private fieldIsPassword(f: Field): boolean {
        let inputTypePassword = !!(f.inputType & android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD) ||
            !!(f.inputType & android.text.InputType.TYPE_TEXT_VARIATION_VISIBLE_PASSWORD) ||
            !!(f.inputType & android.text.InputType.TYPE_TEXT_VARIATION_WEB_PASSWORD);

        // For whatever reason, multi-line input types are coming through with TextVariationPassword flags
        if (inputTypePassword && !!(f.inputType & android.text.InputType.TYPE_TEXT_VARIATION_PASSWORD) &&
            !!(f.inputType & android.text.InputType.TYPE_TEXT_FLAG_MULTI_LINE)) {
            inputTypePassword = false;
        }

        if (!inputTypePassword && f.htmlInfo != null && f.htmlInfo.getTag() === 'input' &&
            f.htmlInfo.getAttributes() != null && f.htmlInfo.getAttributes().size() > 0) {
            const attrs = f.htmlInfo.getAttributes();
            for (let i = 0; i < attrs.size(); i++) {
                const attr: android.util.Pair<string, string> = attrs.get(i);
                const key = attr.first;
                const val = attr.second;
                if (key != null && val != null && key === 'type' && val === 'password') {
                    return true;
                }
            }
        }

        return inputTypePassword && !this.valueContainsAnyTerms(f.idEntry, this.ignoreSearchTerms) &&
            !this.valueContainsAnyTerms(f.hint, this.ignoreSearchTerms);
    }

    private fieldHasPasswordTerms(f: Field): boolean {
        return this.valueContainsAnyTerms(f.idEntry, this.passwordTerms) ||
            this.valueContainsAnyTerms(f.hint, this.passwordTerms);
    }

    private valueContainsAnyTerms(value: string, terms: Set<string>): boolean {
        if (Utils.isNullOrWhitespace(value)) {
            return false;
        }
        const lowerValue = value.toLowerCase();
        return Array.from(terms).some((t) => lowerValue.indexOf(t) > -1);
    }
}
