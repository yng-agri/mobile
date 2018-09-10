@JavaProxy('com.tns.MainApplication')
export class MainApplication extends android.app.Application {
    public onCreate(): void {
        super.onCreate();

        // At this point modules have already been initialized

        // Enter custom initialization code here
    }

    public attachBaseContext(baseContext: android.content.Context) {
        super.attachBaseContext(baseContext);

        // This code enables MultiDex support for the application (if needed)
        // android.support.multidex.MultiDex.install(this);
    }
}
