import { Component } from '@angular/core';
import { RouterExtensions } from "nativescript-angular/router";
import { Page } from 'ui/page';
import { ActivatedRoute } from '@angular/router';

@Component({
    selector: 'app-tabs',
    templateUrl: 'tabs.component.html',
})

export class TabsComponent {
    constructor(private router: RouterExtensions, private page: Page,
        private route: ActivatedRoute) {
        this.page.actionBarHidden = true;
    }

    ngOnInit(): void {
        this.router.navigate([{ outlets: { vaultTab: ['groupings'] } }],
            { relativeTo: this.route });
    }
}
