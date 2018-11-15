import {
    Component,
    EventEmitter,
    Input,
    Output,
} from '@angular/core';

import { CipherView } from 'jslib/models/view/cipherView';

@Component({
    selector: 'app-cipher',
    templateUrl: './cipher.component.html',
})
export class CipherComponent {
    @Output() onSelected = new EventEmitter<CipherView>();
    @Output() onDoubleSelected = new EventEmitter<CipherView>();
    @Output() onView = new EventEmitter<CipherView>();
    @Input() cipher: CipherView;

    selectCipher(c: CipherView) {
        this.onSelected.emit(c);
    }

    doubleSelectCipher(c: CipherView) {
        this.onDoubleSelected.emit(c);
    }

    viewCipher(c: CipherView) {
        this.onView.emit(c);
    }
}
