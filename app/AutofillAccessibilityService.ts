@JavaProxy("com.tns.autofill.AutofillAccessibilityService")
export class AutofillAccessibilityService extends android.accessibilityservice.AccessibilityService {
    onAccessibilityEvent(e: android.view.accessibility.AccessibilityEvent) {
        console.log('onAccessibilityEvent : ' + e.getPackageName() + ' : ' + e.getEventType());
    }

    onInterrupt() {
        
    }
}
