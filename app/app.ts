import {
    android,
    AndroidActivityBackPressedEventData,
    AndroidActivityBundleEventData,
    AndroidActivityEventData,
    AndroidActivityResultEventData,
    AndroidApplication,
    ApplicationEventData,
    displayedEvent,
    exitEvent,
    ios,
    launchEvent,
    LaunchEventData,
    lowMemoryEvent, on as applicationOn,
    orientationChangedEvent,
    OrientationChangedEventData,
    resumeEvent, run as applicationRun,
    setResources,
    suspendEvent,
    uncaughtErrorEvent,
    UnhandledErrorEventData,
} from 'tns-core-modules/application';

import { ServiceContainer } from '../services/serviceContainer';

import { MobileUtils } from './misc/mobileUtils';

applicationOn(launchEvent, (args: LaunchEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android.content.Intent class.
        console.log('Launched Android application with the following intent: ' + args.android + '.');
    } else if (args.ios !== undefined) {
        // For iOS applications, args.ios is NSDictionary (launchOptions).
        console.log('Launched iOS application with options: ' + args.ios);
    }
});

applicationOn(suspendEvent, (args: ApplicationEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log('Activity: ' + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log('UIApplication: ' + args.ios);
    }
});

applicationOn(resumeEvent, (args: ApplicationEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log('Activity: ' + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log('UIApplication: ' + args.ios);
    }
});

applicationOn(displayedEvent, (args: ApplicationEventData) => {
    console.log('displayedEvent');
});

applicationOn(orientationChangedEvent, (args: OrientationChangedEventData) => {
    // 'portrait', 'landscape', 'unknown'
    console.log(args.newValue);
});

applicationOn(exitEvent, (args: ApplicationEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log('Activity: ' + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log('UIApplication: ' + args.ios);
    }
});

applicationOn(lowMemoryEvent, (args: ApplicationEventData) => {
    if (args.android) {
        // For Android applications, args.android is an android activity class.
        console.log('Activity: ' + args.android);
    } else if (args.ios) {
        // For iOS applications, args.ios is UIApplication.
        console.log('UIApplication: ' + args.ios);
    }
});

applicationOn(uncaughtErrorEvent, (args: UnhandledErrorEventData) => {
    console.log('Error: ' + args.error);
});

if (ios != null) {
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
    ios.delegate = BitwardenApplicationDelegate;
} else if (android != null) {
    android.on(AndroidApplication.activityCreatedEvent, (args: AndroidActivityBundleEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity + ', Bundle: ' + args.bundle);
    });

    android.on(AndroidApplication.activityDestroyedEvent, (args: AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.activityStartedEvent, (args: AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.activityPausedEvent, (args: AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.activityResumedEvent, (args: AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.activityStoppedEvent, (args: AndroidActivityEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.saveActivityStateEvent, (args: AndroidActivityBundleEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity + ', Bundle: ' + args.bundle);
    });

    android.on(AndroidApplication.activityResultEvent, (args: AndroidActivityResultEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity +
            ', requestCode: ' + args.requestCode + ', resultCode: ' + args.resultCode + ', Intent: ' + args.intent);
    });

    android.on(AndroidApplication.activityBackPressedEvent, (args: AndroidActivityBackPressedEventData) => {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
        // Set args.cancel = true to cancel back navigation and do something custom.
    });
}

setResources({
    resolveService: MobileUtils.resolveService,
    i18n: MobileUtils.i18n,
});

applicationRun({ moduleName: 'app-root' });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
