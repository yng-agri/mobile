import { Component } from '@angular/core';
import { Page } from 'ui/page';

@Component({
    selector: 'app-home',
    templateUrl: 'home.component.html',
})
export class HomeComponent {
    constructor(private page: Page) {
        this.page.actionBarHidden = true;
    }
}
