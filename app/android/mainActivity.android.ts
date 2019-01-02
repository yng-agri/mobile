import {
    AndroidActivityCallbacks,
    setActivityCallbacks,
} from 'ui/frame';

@JavaProxy('com.tns.MainActivity')
export class MainActivity extends android.support.v7.app.AppCompatActivity {
    isNativeScriptActivity: boolean;

    private callbacks: AndroidActivityCallbacks;

    onCreate(savedInstanceState: android.os.Bundle): void {
        // Set the isNativeScriptActivity in onCreate (as done in the original NativeScript activity code)
        // The JS constructor might not be called because the activity is created from Android.
        this.isNativeScriptActivity = true;
        if (!this.callbacks) {
            setActivityCallbacks(this);
        }
        this.callbacks.onCreate(this, savedInstanceState, super.onCreate);
    }

    onSaveInstanceState(outState: android.os.Bundle): void {
        this.callbacks.onSaveInstanceState(this, outState, super.onSaveInstanceState);
    }

    onStart(): void {
        this.callbacks.onStart(this, super.onStart);
    }

    onStop(): void {
        this.callbacks.onStop(this, super.onStop);
    }

    onDestroy(): void {
        this.callbacks.onDestroy(this, super.onDestroy);
    }

    onBackPressed(): void {
        this.callbacks.onBackPressed(this, super.onBackPressed);
    }

    onRequestPermissionsResult(requestCode: number, permissions: string[], grantResults: number[]): void {
        this.callbacks.onRequestPermissionsResult(this, requestCode, permissions,
            grantResults, undefined /*TODO: Enable if needed*/);
    }

    onActivityResult(requestCode: number, resultCode: number, data: android.content.Intent): void {
        this.callbacks.onActivityResult(this, requestCode, resultCode, data, super.onActivityResult);
    }
}
