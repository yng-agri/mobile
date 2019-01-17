import { AccessibilityHelpers } from './accessibility/accessibilityHelpers';
import { Credentials } from './accessibility/credentials';

declare let com: any;

@JavaProxy('com.tns.AccessibilityActivity')
export class AccessibilityActivity extends android.app.Activity {
    private lastLaunch: number;
    private lastQueriedUri: string;

    onCreate(bundle: android.os.Bundle): void {
        super.onCreate(bundle);
        this.launchMainActivity(this.getIntent(), 932473);
    }

    onNewIntent(intent: android.content.Intent): void {
        super.onNewIntent(intent);
        this.launchMainActivity(this.getIntent(), 489729);
    }

    onDestroy(): void {
        super.onDestroy();
    }

    onResume(): void {
        super.onResume();
        const intent = this.getIntent();
        if (!intent.hasExtra('uri')) {
            this.finish();
            return;
        }
        intent.removeExtra('uri');
    }

    onActivityResult(requestCode: number, resultCode: number, data: android.content.Intent): void {
        super.onActivityResult(requestCode, resultCode, data);
        if (data == null) {
            AccessibilityHelpers.lastCredentials = null;
        } else {
            try {
                if (data.getStringExtra('canceled') != null) {
                    AccessibilityHelpers.lastCredentials = null;
                } else {
                    const uri = data.getStringExtra('uri');
                    const username = data.getStringExtra('username');
                    const password = data.getStringExtra('password');
                    AccessibilityHelpers.lastCredentials = new Credentials();
                    AccessibilityHelpers.lastCredentials.uri = uri;
                    AccessibilityHelpers.lastCredentials.username = username;
                    AccessibilityHelpers.lastCredentials.password = password;
                    AccessibilityHelpers.lastCredentials.lastUri = this.lastQueriedUri;
                }
            } catch {
                AccessibilityHelpers.lastCredentials = null;
            }
        }
        this.finish();
    }

    private launchMainActivity(callingIntent: android.content.Intent, requestCode: number): void {
        this.lastQueriedUri = callingIntent != null ? callingIntent.getStringExtra('uri') : null;
        if (this.lastQueriedUri == null) {
            this.finish();
            return;
        }
        const now = new Date().getTime();
        if (this.lastLaunch != null && (now - this.lastLaunch) <= 2000) {
            return;
        }
        this.lastLaunch = now;
        const intent = new android.content.Intent(this.getApplicationContext(), com.tns.MainActivity.class);
        if ((callingIntent.getFlags() & android.content.Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) !==
            android.content.Intent.FLAG_ACTIVITY_LAUNCHED_FROM_HISTORY) {
            intent.putExtra('uri', this.lastQueriedUri);
        }
        this.startActivityForResult(intent, requestCode);
    }
}
