export class ApplicationDelegate extends UIResponder implements UIApplicationDelegate {
    public static ObjCProtocols = [UIApplicationDelegate];

    applicationDidFinishLaunchingWithOptions(application: UIApplication,
        launchOptions: NSDictionary<any, any>): boolean {
        console.log('applicationWillFinishLaunchingWithOptions: ' + launchOptions);
        return true;
    }

    applicationDidBecomeActive(application: UIApplication): void {
        console.log('applicationDidBecomeActive: ' + application);
    }
}
