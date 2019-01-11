import * as app from 'tns-core-modules/application';

import { Frame } from 'tns-core-modules/ui/frame';

import { ServiceContainer } from '../services/serviceContainer';

import { MobileUtils } from './misc/mobileUtils';

app.on(app.launchEvent, (args: app.LaunchEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android.content.Intent class.
        console.log('Launched Android application with the following intent: ' + args.android + '.');
    } else if (args.ios !== undefined) {
        // For iOS applications, args.ios is NSDictionary (launchOptions).
        console.log('Launched iOS application with options: ' + args.ios);
    }
});

app.on(app.suspendEvent, (args: app.ApplicationEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log('Activity: ' + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log('UIApplication: ' + args.ios);
    }
});

app.on(app.resumeEvent, (args: app.ApplicationEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log('Activity: ' + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log('UIApplication: ' + args.ios);
    }
});

app.on(app.displayedEvent, (args: app.ApplicationEventData) => {
    console.log('displayedEvent');
});

app.on(app.orientationChangedEvent, (args: app.OrientationChangedEventData) => {
    // 'portrait', 'landscape', 'unknown'
    console.log(args.newValue);
});

app.on(app.exitEvent, (args: app.ApplicationEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log('Activity: ' + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log('UIApplication: ' + args.ios);
    }
});

app.on(app.lowMemoryEvent, (args: app.ApplicationEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log('Activity: ' + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log('UIApplication: ' + args.ios);
    }
});

app.on(app.uncaughtErrorEvent, (args: app.UnhandledErrorEventData) => {
    console.log('Error: ' + args.error);
});

if (app.ios != null) {
    class BitwardenApplicationDelegate extends UIResponder implements UIApplicationDelegate {
        static ObjCProtocols = [UIApplicationDelegate];
        static serviceContainer: ServiceContainer = null;

        applicationDidFinishLaunchingWithOptions(application: UIApplication,
            launchOptions: NSDictionary<any, any>): boolean {
            console.log('applicationWillFinishLaunchingWithOptions: ' + launchOptions);
            BitwardenApplicationDelegate.serviceContainer = new ServiceContainer();
            BitwardenApplicationDelegate.serviceContainer.init();
            BitwardenApplicationDelegate.serviceContainer.bootstrap();
            return true;
        }

        applicationDidBecomeActive(application: UIApplication): void {
            console.log('applicationDidBecomeActive: ' + application);
        }
    }
    app.ios.delegate = BitwardenApplicationDelegate;
} else if (app.android != null) {
    app.android.on(app.AndroidApplication.activityCreatedEvent, (args: app.AndroidActivityBundleEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity + ', Bundle: ' + args.bundle);
    });

    app.android.on(app.AndroidApplication.activityDestroyedEvent, (args: app.AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    app.android.on(app.AndroidApplication.activityStartedEvent, (args: app.AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    app.android.on(app.AndroidApplication.activityPausedEvent, (args: app.AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    app.android.on(app.AndroidApplication.activityResumedEvent, (args: app.AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    app.android.on(app.AndroidApplication.activityStoppedEvent, (args: app.AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    app.android.on(app.AndroidApplication.saveActivityStateEvent, (args: app.AndroidActivityBundleEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity + ', Bundle: ' + args.bundle);
    });

    app.android.on(app.AndroidApplication.activityResultEvent, (args: app.AndroidActivityResultEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity +
            ', requestCode: ' + args.requestCode + ', resultCode: ' + args.resultCode + ', Intent: ' + args.intent);
    });

    app.android.on(app.AndroidApplication.activityBackPressedEvent, (args: app.AndroidActivityBackPressedEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
        // Set args.cancel = true to cancel back navigation and do something custom.
    });
}

Frame.defaultTransition = {
    name: 'slide',
    duration: 400,
    curve: 'easeIn',
};

app.setResources({
    resolveService: MobileUtils.resolveService,
    i18n: MobileUtils.i18n,
});

app.run({ moduleName: 'app-root' });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
