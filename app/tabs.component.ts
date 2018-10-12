import { Page } from 'ui/page';
import {
    Component,
    OnInit,
} from '@angular/core';
import { RouterExtensions } from "nativescript-angular/router";
import {
    OnTabPressedEventData,
    OnTabSelectedEventData,
} from 'nativescript-bottom-navigation';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.component.html',
})

export class TabsComponent {
    constructor(private router: RouterExtensions, private page: Page) {
        this.page.actionBarHidden = true;
    }

    ngOnInit(): void {
        this.router.navigate(['/tabs/vault/groupings']);
    }

    onTabPressed(args: OnTabPressedEventData): void {
        console.log(`Tab pressed:  ${args.index}`);
    }

    onTabSelected(args: OnTabSelectedEventData): void {
        console.log(`Tab selected:  ${args.oldIndex}`);
    }
}
