import {
    EventData,
    Observable,
} from 'tns-core-modules/data/observable';

import { StackLayout } from 'tns-core-modules/ui/layouts/stack-layout';

import { CipherView } from 'jslib/models/view/cipherView';

export class CipherViewModel extends Observable {
    cipher: CipherView;

    constructor(private layout: StackLayout) {
        super();
        this.cipher = (layout as any).cipher;
    }
}
