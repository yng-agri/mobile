import {
    Component,
    OnInit,
} from '@angular/core';
import { Cache } from 'tns-core-modules/ui/image-cache';
import { fromFile, fromNativeSource, fromResource, ImageSource } from 'tns-core-modules/image-source';

import { EnvironmentService } from 'jslib/abstractions/environment.service';
import { StateService } from 'jslib/abstractions/state.service';

import { ConstantsService } from 'jslib/services/constants.service';

import { IconComponent as BaseIconComponent } from 'jslib/angular/components/icon.component';

@Component({
    selector: 'app-vault-icon',
    templateUrl: './icon.component.html',
})
export class IconComponent extends BaseIconComponent implements OnInit {
    constructor(environmentService: EnvironmentService, stateService: StateService) {
        super(environmentService, stateService);
    }

    async ngOnInit() {
        this.imageEnabled = !(await this.stateService.get<boolean>(ConstantsService.disableFaviconKey));
    }

    ngOnChanges() {
        this.load();
        return Promise.resolve();
    }
}
