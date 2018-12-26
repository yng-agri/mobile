import {
    Component,
    ChangeDetectorRef,
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
export class IconComponent extends BaseIconComponent {
    constructor(environmentService: EnvironmentService, stateService: StateService,
        private changeDetectorRef: ChangeDetectorRef) {
        super(environmentService, stateService);
    }

    async ngOnChanges() {
        await super.ngOnChanges();
        this.changeDetectorRef.detectChanges();
    }
}
