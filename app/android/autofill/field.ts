export class Field {
    saveType = android.service.autofill.SaveInfo.SAVE_DATA_TYPE_GENERIC;
    hint: string;
    id: number;
    trackingId: string;
    idEntry: string;
    autofillId: android.view.autofill.AutofillId;
    autofillType: number;
    inputType: number;
    focused: boolean;
    selected: boolean;
    clickable: boolean;
    visible: boolean;
    autofillOptions: native.Array<string>;
    textValue: string;
    dateValue: number;
    listValue: number;
    toggleValue: boolean;
    htmlInfo: android.view.ViewStructure.HtmlInfo;
    node: android.app.assist.AssistStructure.ViewNode;

    private _hints: string[];

    constructor(node: android.app.assist.AssistStructure.ViewNode) {
        this.node = node;
        this.id = node.getId();
        this.trackingId = this.id + '_' + node.hashCode();
        this.idEntry = node.getIdEntry();
        this.autofillId = node.getAutofillId();
        this.autofillType = node.getAutofillType();
        this.inputType = node.getInputType();
        this.focused = node.isFocused();
        this.selected = node.isSelected();
        this.clickable = node.isClickable();
        this.visible = node.getVisibility() === 0;
        this.hints = this.filterForSupportedHints(node.getAutofillHints());
        this.hint = node.getHint();
        this.autofillOptions = node.getAutofillOptions();
        this.htmlInfo = node.getHtmlInfo();

        const autofillVal = node.getAutofillValue();
        if (autofillVal != null) {
            if (autofillVal.isList()) {
                const options = this.node.getAutofillOptions();
                if (options != null && options.length > 0) {
                    this.listValue = autofillVal.getListValue();
                    this.textValue = options[this.listValue];
                }
            } else if (autofillVal.isDate()) {
                this.dateValue = autofillVal.getDateValue();
            } else if (autofillVal.isText()) {
                this.textValue = autofillVal.getTextValue();
            } else if (autofillVal.isToggle()) {
                this.toggleValue = autofillVal.getToggleValue();
            }
        }
    }

    get hints(): string[] {
        return this._hints;
    }

    set hints(val: string[]) {
        this._hints = val;
        this.updateSaveTypeForHints();
    }

    valueIsNull(): boolean {
        return this.textValue == null && this.dateValue == null && this.toggleValue == null;
    }

    private filterForSupportedHints(hints: native.Array<string>): string[] {
        if (hints == null) {
            return [];
        }
        const filteredHints: string[] = [];
        for (let i = 0; i < hints.length; i++) {
            if (this.isValidHint(hints[i])) {
                filteredHints.push(hints[i]);
            }
        }
        return filteredHints;
    }

    private isValidHint(hint: string): boolean {
        switch (hint) {
            case android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE:
            case android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DAY:
            case android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH:
            case android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR:
            case android.view.View.AUTOFILL_HINT_CREDIT_CARD_NUMBER:
            case android.view.View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE:
            case android.view.View.AUTOFILL_HINT_EMAIL_ADDRESS:
            case android.view.View.AUTOFILL_HINT_PHONE:
            case android.view.View.AUTOFILL_HINT_NAME:
            case android.view.View.AUTOFILL_HINT_PASSWORD:
            case android.view.View.AUTOFILL_HINT_POSTAL_ADDRESS:
            case android.view.View.AUTOFILL_HINT_POSTAL_CODE:
            case android.view.View.AUTOFILL_HINT_USERNAME:
                return true;
            default:
                return false;
        }
    }

    private updateSaveTypeForHints(): void {
        this.saveType = android.service.autofill.SaveInfo.SAVE_DATA_TYPE_GENERIC;
        if (this._hints == null) {
            return;
        }

        this._hints.forEach((hint: string) => {
            switch (hint) {
                case android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DATE:
                case android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_DAY:
                case android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_MONTH:
                case android.view.View.AUTOFILL_HINT_CREDIT_CARD_EXPIRATION_YEAR:
                case android.view.View.AUTOFILL_HINT_CREDIT_CARD_NUMBER:
                case android.view.View.AUTOFILL_HINT_CREDIT_CARD_SECURITY_CODE:
                    this.saveType |= android.service.autofill.SaveInfo.SAVE_DATA_TYPE_CREDIT_CARD;
                    break;
                case android.view.View.AUTOFILL_HINT_EMAIL_ADDRESS:
                    this.saveType |= android.service.autofill.SaveInfo.SAVE_DATA_TYPE_EMAIL_ADDRESS;
                    break;
                case android.view.View.AUTOFILL_HINT_PHONE:
                case android.view.View.AUTOFILL_HINT_NAME:
                    this.saveType |= android.service.autofill.SaveInfo.SAVE_DATA_TYPE_GENERIC;
                    break;
                case android.view.View.AUTOFILL_HINT_PASSWORD:
                    this.saveType |= android.service.autofill.SaveInfo.SAVE_DATA_TYPE_PASSWORD;
                    this.saveType |= android.service.autofill.SaveInfo.SAVE_DATA_TYPE_EMAIL_ADDRESS;
                    this.saveType |= android.service.autofill.SaveInfo.SAVE_DATA_TYPE_USERNAME;
                    break;
                case android.view.View.AUTOFILL_HINT_POSTAL_ADDRESS:
                case android.view.View.AUTOFILL_HINT_POSTAL_CODE:
                    this.saveType |= android.service.autofill.SaveInfo.SAVE_DATA_TYPE_ADDRESS;
                    break;
                case android.view.View.AUTOFILL_HINT_USERNAME:
                    this.saveType |= android.service.autofill.SaveInfo.SAVE_DATA_TYPE_USERNAME;
                    break;
            }
        });
    }
}
