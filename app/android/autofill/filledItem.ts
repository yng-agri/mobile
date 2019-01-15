import { CipherType } from 'jslib/enums/cipherType';

import { CipherView } from 'jslib/models/view/cipherView';

import { Utils } from 'jslib/misc/utils';

import { Field } from './field';
import { FieldCollection } from './fieldCollection';

export class FilledItem {
    name: string;
    subTitle: string;
    icon: number;
    type: CipherType;

    private password: string;
    private cardNumber: string;
    private cardName: string;
    private cardCode: string;
    private cardExpMonth: string;
    private cardExpYear: string;
    private idPhone: string;
    private idEmail: string;
    private idUsername: string;
    private idAddress: string;
    private idPostalCode: string;

    constructor(cipher: CipherView, private context: android.content.Context) {
        this.name = cipher.name;
        this.type = cipher.type;
        this.subTitle = cipher.subTitle;

        switch (this.type) {
            case CipherType.Login:
                this.icon = this.getIcon('login');
                this.password = cipher.login.password;
                break;
            case CipherType.Card:
                this.icon = this.getIcon('card');
                this.cardNumber = cipher.card.number;
                this.cardName = cipher.card.cardholderName;
                this.cardCode = cipher.card.code;
                this.cardExpMonth = cipher.card.expMonth;
                this.cardExpYear = cipher.card.expYear;
                break;
            case CipherType.Identity:
                this.icon = this.getIcon('id');
                this.idPhone = cipher.identity.phone;
                this.idEmail = cipher.identity.email;
                this.idUsername = cipher.identity.username;
                this.idPostalCode = cipher.identity.postalCode;
                this.idAddress = cipher.identity.fullAddress;
                break;
            default:
                this.icon = this.getIcon('login');
                break;
        }
    }

    applyToFields(fieldCollection: FieldCollection, datasetBuilder: android.service.autofill.Dataset.Builder): boolean {
        if (fieldCollection == null || fieldCollection.fields.length === 0) {
            return false;
        }

        let setValues = false;
        if (this.type === CipherType.Login) {
            if (fieldCollection.passwordFields.length > 0 && !Utils.isNullOrWhitespace(this.password)) {
                fieldCollection.passwordFields.forEach((f) => {
                    const val = this.applyValue(f, this.password);
                    if (val != null) {
                        setValues = true;
                        datasetBuilder.setValue(f.autofillId, val);
                    }
                });
            }
            if (fieldCollection.usernameFields.length > 0 && !Utils.isNullOrWhitespace(this.subTitle)) {
                fieldCollection.usernameFields.forEach((f) => {
                    const val = this.applyValue(f, this.subTitle);
                    if (val != null) {
                        setValues = true;
                        datasetBuilder.setValue(f.autofillId, val);
                    }
                });
            }
        } else if (this.type === CipherType.Card) {
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_CREDIT_CARD_NUMBER, this.cardNumber)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE, this.cardCode)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH, this.cardExpMonth, true)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR, this.cardExpYear)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_NAME, this.cardName)) {
                setValues = true;
            }
        } else if (this.type === CipherType.Identity) {
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_PHONE, this.idPhone)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_EMAIL_ADDRESS, this.idEmail)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_USERNAME, this.idUsername)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_POSTAL_ADDRESS, this.idAddress)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_POSTAL_CODE, this.idPostalCode)) {
                setValues = true;
            }
            if (this.applyValueWithBuilder(datasetBuilder, fieldCollection,
                android.view.View.AUTOFILL_HINT_NAME, this.subTitle)) {
                setValues = true;
            }
        }
        return setValues;
    }

    private applyValueWithBuilder(builder: android.service.autofill.Dataset.Builder,
        fieldCollection: FieldCollection, hint: string, value: string, monthValue = false): boolean {
        let setValues = false;
        if (fieldCollection.hintToFieldsMap.has(hint) && !Utils.isNullOrWhitespace(value)) {
            fieldCollection.hintToFieldsMap.get(hint).forEach((f) => {
                const val = this.applyValue(f, value, monthValue);
                if (val != null) {
                    setValues = true;
                    builder.setValue(f.autofillId, val);
                }
            });
        }
        return setValues;
    }

    private applyValue(field: Field, value: string, monthValue = false): android.view.autofill.AutofillValue {
        switch (field.autofillType) {
            case android.view.View.AUTOFILL_TYPE_DATE:
                try {
                    const dateVal = parseInt(value, null);
                    return android.view.autofill.AutofillValue.forDate(dateVal);
                } catch { }
                break;
            case android.view.View.AUTOFILL_TYPE_LIST:
                if (field.autofillOptions != null) {
                    if (monthValue) {
                        try {
                            const monthIndex = parseInt(value, null);
                            if (field.autofillOptions.length === 13) {
                                return android.view.autofill.AutofillValue.forList(monthIndex);
                            } else if (field.autofillOptions.length >= monthIndex) {
                                return android.view.autofill.AutofillValue.forList(monthIndex - 1);
                            }
                        } catch { }
                    }
                    for (let i = 0; i < field.autofillOptions.length; i++) {
                        if (field.autofillOptions[i] === value) {
                            return android.view.autofill.AutofillValue.forList(i);
                        }
                    }
                }
                break;
            case android.view.View.AUTOFILL_TYPE_TEXT:
                return android.view.autofill.AutofillValue.forText(value);
            case android.view.View.AUTOFILL_TYPE_TOGGLE:
                return android.view.autofill.AutofillValue.forToggle(value.toLowerCase() === 'true' || value === '1');
            default:
                break;
        }
        return null;
    }

    private getIcon(name: string): number {
        return this.context.getResources().getIdentifier(name, 'drawable', this.context.getPackageName());
    }
}
