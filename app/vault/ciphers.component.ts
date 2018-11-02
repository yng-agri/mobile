import {
    Component,
    OnInit,
} from '@angular/core';
import { RouterExtensions } from 'nativescript-angular/router';

@Component({
    selector: 'app-ciphers',
    moduleId: module.id,
    templateUrl: './ciphers.component.html',
})
export class CiphersComponent implements OnInit {
    ciphers: any[] = [];

    constructor(private routerExtensions: RouterExtensions) { }

    ngOnInit(): void {
        for (let i = 0; i < 100; i++) {
            this.ciphers.push({ id: i, name: 'Item #' + (i + 1) });
        }
    }

    close() {
        this.routerExtensions.back();
    }
}