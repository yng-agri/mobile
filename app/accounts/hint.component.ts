import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { ModalDialogParams } from "nativescript-angular/modal-dialog";
import { RouterExtensions } from "nativescript-angular/router";

import { ApiService } from 'jslib/abstractions/api.service';
import { I18nService } from 'jslib/abstractions/i18n.service';
import { PlatformUtilsService } from 'jslib/abstractions/platformUtils.service';

import { HintComponent as BaseHintComponent } from 'jslib/angular/components/hint.component';

@Component({
    selector: 'app-hint',
    templateUrl: 'hint.component.html',
})
export class HintComponent extends BaseHintComponent {
    constructor(params: ModalDialogParams, platformUtilsService: PlatformUtilsService,
        i18nService: I18nService, apiService: ApiService) {
        super(null, i18nService, apiService, platformUtilsService);
        this.onSuccessfulSubmit = () => params.closeCallback();
    }
}
