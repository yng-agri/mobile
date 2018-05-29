@JavaProxy("com.tns.AccessibilityService")
export class AccessibilityService extends android.accessibilityservice.AccessibilityService {
    onAccessibilityEvent(e: android.view.accessibility.AccessibilityEvent) {
        console.log('onAccessibilityEvent : ' + e.getPackageName() + ' : ' + e.getEventType());
    }

    onInterrupt() {
        
    }
}
