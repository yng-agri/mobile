import { Utils } from 'jslib/misc/utils';

import { AutofillHelpers } from './autofillHelpers';
import { Field } from './field';
import { FieldCollection } from './fieldCollection';

export class Parser {
    fieldCollection = new FieldCollection();
    applicationContext: android.content.Context;

    private _uri: string;
    private _packageName: string;
    private _webDomain: string;

    private structure: android.app.assist.AssistStructure;
    private excludedPackageIds = new Set(['android']);

    constructor(structure: android.app.assist.AssistStructure, applicationContext: android.content.Context) {
        this.structure = structure;
        this.applicationContext = applicationContext;
    }

    get uri(): string {
        if (!Utils.isNullOrWhitespace(this._uri)) {
            return this._uri;
        }

        const webDomainNull = Utils.isNullOrWhitespace(this.webDomain);
        if (webDomainNull && Utils.isNullOrWhitespace(this.packageName)) {
            this._uri = null;
        } else if (!webDomainNull) {
            this._uri = 'http://' + this.webDomain;
        } else {
            this._uri = 'androidapp://' + this.packageName;
        }

        return this._uri;
    }

    get packageName(): string {
        return this._packageName;
    }

    set packageName(val: string) {
        if (Utils.isNullOrWhitespace(val)) {
            this._packageName = this._uri = null;
        }
        this._packageName = val;
    }

    get webDomain(): string {
        return this._webDomain;
    }

    set webDomain(val: string) {
        if (Utils.isNullOrWhitespace(val)) {
            this._webDomain = this._uri = null;
        }
        this._webDomain = val;
    }

    get shouldAutofill() {
        return !Utils.isNullOrWhitespace(this.uri) && !AutofillHelpers.blacklistedUris.has(this.uri) &&
            this.fieldCollection != null && this.fieldCollection.fillable;
    }

    parse(): void {
        for (let i = 0; i < this.structure.getWindowNodeCount(); i++) {
            const node = this.structure.getWindowNodeAt(i);
            this.parseNode(node.getRootViewNode());
        }
        if (!AutofillHelpers.trustedBrowsers.has(this.packageName) &&
            !AutofillHelpers.compatBrowsers.has(this.packageName)) {
            this.webDomain = null;
        }
    }

    private parseNode(node: android.app.assist.AssistStructure.ViewNode): void {
        this.setPackageAndDomain(node);
        const hints = node.getAutofillHints();
        const htmlInfo = node.getHtmlInfo();
        const isEditText = node.getClassName() === 'android.widget.EditText' ||
            (htmlInfo != null && htmlInfo.getTag() === 'input');
        if (isEditText || (hints != null && hints.length > 0)) {
            this.fieldCollection.add(new Field(node));
        } else {
            this.fieldCollection.ignoreAutofillIds.push(node.getAutofillId());
        }

        for (let i = 0; i < node.getChildCount(); i++) {
            this.parseNode(node.getChildAt(i));
        }
    }

    private setPackageAndDomain(node: android.app.assist.AssistStructure.ViewNode): void {
        if (Utils.isNullOrWhitespace(this.packageName) && !Utils.isNullOrWhitespace(node.getIdPackage()) &&
            !this.excludedPackageIds.has(node.getIdPackage())) {
            this.packageName = node.getIdPackage();
        }
        if (Utils.isNullOrWhitespace(this.webDomain) && !Utils.isNullOrWhitespace(node.getWebDomain())) {
            this.webDomain = node.getWebDomain();
        }
    }
}
