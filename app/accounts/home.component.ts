import {
    Component,
    ViewContainerRef,
} from '@angular/core';
import { ModalDialogService } from 'nativescript-angular/directives/dialogs';
import { Page } from 'ui/page';

import { ModalComponent } from '../modal.component';

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
})
export class HomeComponent {
    constructor(private page: Page, private modalDialogService: ModalDialogService,
        private vcRef: ViewContainerRef) {
        this.page.actionBarHidden = true;
    }

    login() {
        this.modalDialogService.showModal(ModalComponent, {
            context: { path: 'login' },
            fullscreen: true,
            viewContainerRef: this.vcRef,
        }).then((res) => {
            console.log(res);
        });
    }

    register() {
        this.modalDialogService.showModal(ModalComponent, {
            context: { path: 'register' },
            fullscreen: true,
            viewContainerRef: this.vcRef,
        }).then((res) => {
            console.log(res);
        });
    }

    environment() {
        this.modalDialogService.showModal(ModalComponent, {
            context: { path: 'environment' },
            fullscreen: true,
            viewContainerRef: this.vcRef,
        }).then((res) => {
            console.log(res);
        });
    }
}
