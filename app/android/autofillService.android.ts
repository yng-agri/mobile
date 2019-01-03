// @JavaProxy('com.tns.AutofillService')
export class AutofillService extends android.service.autofill.AutofillService {
    onFillRequest(request: android.service.autofill.FillRequest, cancellationSignal: android.os.CancellationSignal,
        callback: android.service.autofill.FillCallback) {
        console.log('onFillRequest');
    }

    onSaveRequest(request: android.service.autofill.SaveRequest, callback: android.service.autofill.SaveCallback) {
        console.log('onSaveRequest');
    }
}
