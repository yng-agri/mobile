import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { Item } from "./item";
import { ItemService } from "./item.service";

import { StateService } from "jslib/abstractions/state.service";
import { I18nService } from "jslib/abstractions/i18n.service";
import { PlatformUtilsService } from "jslib/abstractions/platformUtils.service";
import { StorageService } from "jslib/abstractions/storage.service";

@Component({
    selector: "ns-details",
    moduleId: module.id,
    templateUrl: "./item-detail.component.html",
})
export class ItemDetailComponent implements OnInit {
    item: Item;

    constructor(
        private itemService: ItemService,
        private route: ActivatedRoute,
        private stateService: StateService,
        private i18nService: I18nService,
        private platformUtilsService: PlatformUtilsService,
        private storageService: StorageService,
    ) { }

    async ngOnInit() {
        const id = +this.route.snapshot.params["id"];
        this.item = this.itemService.getItem(id);
        await this.stateService.save('hello', 'world!');
        await this.storageService.save('hello', 'world!!!!!!!!!!!!!');
        console.log('state: ' + (await this.stateService.get<string>('hello')));
        console.log('i18n: ' + this.i18nService.t('hello'));
        console.log('platform: ' + this.platformUtilsService.getDevice());
        console.log('storage: ' + (await this.storageService.get<string>('hello')));
    }
}
