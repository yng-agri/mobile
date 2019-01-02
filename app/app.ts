import {
    ios,
    android,
    AndroidApplication,
    AndroidActivityBundleEventData,
    displayedEvent,
    exitEvent,
    launchEvent,
    lowMemoryEvent,
    orientationChangedEvent,
    resumeEvent,
    suspendEvent,
    uncaughtErrorEvent,
    ApplicationEventData,
    LaunchEventData,
    OrientationChangedEventData,
    UnhandledErrorEventData,
    on as applicationOn,
    run as applicationRun,
    AndroidActivityEventData,
    AndroidActivityResultEventData,
    AndroidActivityBackPressedEventData,
    setResources,
} from 'tns-core-modules/application';

import { ServiceContainer } from '../services/serviceContainer';

import { I18nService } from 'jslib/abstractions/i18n.service';

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
    console.log(args.newValue)
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

applicationOn(uncaughtErrorEvent, function (args: UnhandledErrorEventData) {
    console.log('Error: ' + args.error);
});

if (ios != null) {
    class BitwardenApplicationDelegate extends UIResponder implements UIApplicationDelegate {
        public static ObjCProtocols = [UIApplicationDelegate];
        public static serviceContainer: ServiceContainer = null

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
    android.on(AndroidApplication.activityCreatedEvent, function (args: AndroidActivityBundleEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity + ', Bundle: ' + args.bundle);
    });

    android.on(AndroidApplication.activityDestroyedEvent, function (args: AndroidActivityEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.activityStartedEvent, function (args: AndroidActivityEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.activityPausedEvent, function (args: AndroidActivityEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.activityResumedEvent, function (args: AndroidActivityEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.activityStoppedEvent, function (args: AndroidActivityEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
    });

    android.on(AndroidApplication.saveActivityStateEvent, function (args: AndroidActivityBundleEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity + ', Bundle: ' + args.bundle);
    });

    android.on(AndroidApplication.activityResultEvent, function (args: AndroidActivityResultEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity +
            ', requestCode: ' + args.requestCode + ', resultCode: ' + args.resultCode + ', Intent: ' + args.intent);
    });

    android.on(AndroidApplication.activityBackPressedEvent, function (args: AndroidActivityBackPressedEventData) {
        console.log('Event: ' + args.eventName + ', Activity: ' + args.activity);
        // Set args.cancel = true to cancel back navigation and do something custom.
    });
}

function getServiceContainer() {
    let serviceContainer: ServiceContainer = null;
    if (android != null) {
        serviceContainer = android.context.serviceContainer;
    } else if (ios != null) {
        serviceContainer = ios.delegate.serviceContainer;
    }
    if (serviceContainer == null) {
        throw new Error('Cannot resolve service container.');
    }
    return serviceContainer;
}

function resolveService<T>(service: string) {
    return getServiceContainer().resolve<T>(service);
}

function i18n(id: string, p1?: string, p2?: string, p3?: string) {
    return resolveService<I18nService>('i18nService').t(id, p1, p2, p3);
}

setResources({
    resolveService: resolveService,
    i18n: i18n,
});

applicationRun({ moduleName: 'app-root' });

/*
Do not place any code after the application has been started as it will not
be executed on iOS.
*/
