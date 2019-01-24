import {
    NavigatedData,
    Page,
} from 'tns-core-modules/ui/page';

import { ViewViewModel } from './view-view-model';

import { MobileUtils } from '~/misc/mobileUtils';

let model: ViewViewModel = null;

export async function onNavigatingTo(args: NavigatedData) {
    const page = args.object as Page;
    model = new ViewViewModel(page, args.context.closeModal, MobileUtils.resolveService('cipherService'),
        MobileUtils.resolveService('totpService'), MobileUtils.resolveService('userService'),
        MobileUtils.resolveService('platformUtilsService'), MobileUtils.resolveService('auditService'),
        MobileUtils.resolveService('i18nService'));
    model.cipherId = args.context.cipherId;
    page.bindingContext = model;
    args.context.modalClosed = () => {
        if (model != null) {
            model.cleanUp();
        }
    };
    await model.init();
}
