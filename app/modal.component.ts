import {
    Component,
    OnInit,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalDialogParams } from 'nativescript-angular/directives/dialogs';
import { RouterExtensions } from "nativescript-angular/router";

@Component({
    selector: 'app-modal',
    template: '<page-router-outlet></page-router-outlet>',
})

export class ModalComponent implements OnInit {
    constructor(private routerExtensions: RouterExtensions, private activatedRoute: ActivatedRoute,
        private modalDialogParams: ModalDialogParams) {
    }

    ngOnInit() {
        this.routerExtensions.navigate([this.modalDialogParams.context.path], { relativeTo: this.activatedRoute });
    }
}
