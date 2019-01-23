import * as app from 'tns-core-modules/application';

import { BroadcasterService } from 'jslib/abstractions/broadcaster.service';

import { MobileUtils } from './misc/mobileUtils';

export class AppMain {
    inited = false;

    constructor() {
        this.setup();
    }

    init() {
        if (this.inited) {
            return;
        }
        this.inited = true;
        const broadcasterService = MobileUtils.resolveService<BroadcasterService>('broadcasterService');
        broadcasterService.subscribe('AppMain', (message: any) => {
            console.log('Got message in AppMain');
            console.log(message);
        });
    }

    private setup() {
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
    }
}
