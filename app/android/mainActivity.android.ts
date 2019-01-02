import {
    AndroidActivityCallbacks,
    setActivityCallbacks,
} from 'ui/frame';

@JavaProxy('com.tns.MainActivity')
export class MainActivity extends android.support.v7.app.AppCompatActivity {
    isNativeScriptActivity: boolean;

    // callbacks must have underscore prefix for whatever reason
    private _callbacks: AndroidActivityCallbacks;

    onCreate(savedInstanceState: android.os.Bundle): void {
        // Set the isNativeScriptActivity in onCreate (as done in the original NativeScript activity code)
        // The JS constructor might not be called because the activity is created from Android.
        this.isNativeScriptActivity = true;
        if (!this._callbacks) {
            setActivityCallbacks(this);
        }
        this._callbacks.onCreate(this, savedInstanceState, super.onCreate);
    }

    onSaveInstanceState(outState: android.os.Bundle): void {
        this._callbacks.onSaveInstanceState(this, outState, super.onSaveInstanceState);
    }

    onStart(): void {
        this._callbacks.onStart(this, super.onStart);
    }

    onStop(): void {
        this._callbacks.onStop(this, super.onStop);
    }

    onDestroy(): void {
        this._callbacks.onDestroy(this, super.onDestroy);
    }

    onBackPressed(): void {
        this._callbacks.onBackPressed(this, super.onBackPressed);
    }

    onRequestPermissionsResult(requestCode: number, permissions: string[], grantResults: number[]): void {
        this._callbacks.onRequestPermissionsResult(this, requestCode, permissions,
            grantResults, undefined /*TODO: Enable if needed*/);
    }

    onActivityResult(requestCode: number, resultCode: number, data: android.content.Intent): void {
        this._callbacks.onActivityResult(this, requestCode, resultCode, data, super.onActivityResult);
    }
}
