import {
    android as androidApp,
    ios as iosApp,
} from 'tns-core-modules/application';

import {
    ios as iosUtils,
} from 'utils/utils';

export class DeviceActionUtils {
    static copyToClipboard(text: string) {
        if (text == null) {
            return;
        }
        if (androidApp != null) {
            const clipboard = androidApp.context.getSystemService(
                android.content.Context.CLIPBOARD_SERVICE) as android.content.ClipboardManager;
            clipboard.setText(text);
        } else if (iosApp != null) {
            const pasteboard = iosUtils.getter(UIPasteboard, UIPasteboard.generalPasteboard);
            pasteboard.string = text;
        }
    }

    static async toast(text: string, longDuration = false) {
        if (androidApp != null) {
            if (DeviceActionUtils._androidToast != null) {
                DeviceActionUtils._androidToast.cancel();
                DeviceActionUtils._androidToast = null;
            }
            DeviceActionUtils._androidToast = android.widget.Toast.makeText(androidApp.context, text,
                longDuration ? android.widget.Toast.LENGTH_LONG : android.widget.Toast.LENGTH_SHORT);
            DeviceActionUtils._androidToast.show();
        } else if (iosApp != null) {
            class IOSToast extends UIView {
                // tslint:disable-next-line
                static ObjCExposedMethods = {
                    dismissAnimated: { returns: interop.types.void, params: [UIGestureRecognizer] },
                    dismissNotAnimated: { returns: interop.types.void, params: [UIGestureRecognizer] },
                };

                messageLabel: UILabel;
                dismissed = false;
                dismissCallback: Function = null;
                duration = 3;
                leftMargin = 5;
                rightMargin = 5;
                bottomMargin = 5;
                height = 38;

                private dismissTimer: NSTimer;
                private heightConstraint: NSLayoutConstraint;
                private leftMarginConstraint: NSLayoutConstraint;
                private rightMarginConstraint: NSLayoutConstraint;
                private bottomMarginConstraint: NSLayoutConstraint;

                constructor(text: string) {
                    super({
                        frame: {
                            origin: { x: 0, y: 0 },
                            size: { width: 320, height: 38 },
                        },
                    });
                    this.translatesAutoresizingMaskIntoConstraints = false;
                    this.backgroundColor = UIColor.darkGrayColor.colorWithAlphaComponent(0.9);
                    this.layer.cornerRadius = 15;
                    this.layer.masksToBounds = true;

                    this.messageLabel = UILabel.alloc();
                    this.messageLabel.translatesAutoresizingMaskIntoConstraints = false;
                    this.messageLabel.textColor = UIColor.whiteColor;
                    this.messageLabel.font = UIFont.systemFontOfSize(14);
                    this.messageLabel.backgroundColor = UIColor.clearColor;
                    this.messageLabel.lineBreakMode = NSLineBreakMode.ByWordWrapping;
                    this.messageLabel.textAlignment = NSTextAlignment.Center;
                    this.messageLabel.numberOfLines = 0;
                    this.messageLabel.text = text;

                    this.addSubview(this.messageLabel);

                    const hMessageConstraints = NSLayoutConstraint.constraintsWithVisualFormatOptionsMetricsViews(
                        'H:|-5-[messageLabel]-5-|', 0, NSDictionary.alloc(),
                        NSDictionary.dictionaryWithObjectsForKeys([this.messageLabel], ['messageLabel']));
                    const vMessageConstraints = NSLayoutConstraint.constraintsWithVisualFormatOptionsMetricsViews(
                        'V:|-0-[messageLabel]-0-|', 0, NSDictionary.alloc(),
                        NSDictionary.dictionaryWithObjectsForKeys([this.messageLabel], ['messageLabel']));

                    this.addConstraints(hMessageConstraints);
                    this.addConstraints(vMessageConstraints);

                    this.addGestureRecognizer(new UIGestureRecognizer({
                        target: this,
                        action: 'dismissNotAnimated',
                    }));
                }

                show() {
                    if (this.superview != null) {
                        return;
                    }

                    this.dismissTimer = NSTimer.scheduledTimerWithTimeIntervalTargetSelectorUserInfoRepeats(
                        this.duration, this, 'dismissAnimated', null, false);
                    this.layoutIfNeeded();

                    const localSuperView = UIApplication.sharedApplication.keyWindow;
                    if (localSuperView != null) {
                        localSuperView.addSubview(this);

                        this.heightConstraint =
                            NSLayoutConstraint.constraintWithItemAttributeRelatedByToItemAttributeMultiplierConstant(
                                this, NSLayoutAttribute.Height, NSLayoutRelation.GreaterThanOrEqual, null,
                                NSLayoutAttribute.NotAnAttribute, 1, this.height);

                        this.leftMarginConstraint =
                            NSLayoutConstraint.constraintWithItemAttributeRelatedByToItemAttributeMultiplierConstant(
                                this, NSLayoutAttribute.Left, NSLayoutRelation.Equal, localSuperView,
                                NSLayoutAttribute.Left, 1, this.leftMargin);

                        this.rightMarginConstraint =
                            NSLayoutConstraint.constraintWithItemAttributeRelatedByToItemAttributeMultiplierConstant(
                                this, NSLayoutAttribute.Right, NSLayoutRelation.Equal, localSuperView,
                                NSLayoutAttribute.Right, 1, -this.rightMargin);

                        this.bottomMarginConstraint =
                            NSLayoutConstraint.constraintWithItemAttributeRelatedByToItemAttributeMultiplierConstant(
                                this, NSLayoutAttribute.Bottom, NSLayoutRelation.Equal, localSuperView,
                                NSLayoutAttribute.Bottom, 1, -this.bottomMargin);

                        this.leftMarginConstraint.priority = 999;
                        this.rightMarginConstraint.priority = 999;

                        this.addConstraint(this.heightConstraint);
                        localSuperView.addConstraint(this.leftMarginConstraint);
                        localSuperView.addConstraint(this.rightMarginConstraint);
                        localSuperView.addConstraint(this.bottomMarginConstraint);

                        this.showWithAnimation();
                    }
                }

                dismissAnimated(recognizer: UIGestureRecognizer) {
                    this.dismiss(false);
                }

                dismissNotAnimated(recognizer: UIGestureRecognizer) {
                    this.dismiss(true);
                }

                dismiss(animated = true) {
                    if (this.dismissed) {
                        return;
                    }
                    this.dismissed = true;

                    if (this.dismissTimer != null) {
                        this.dismissTimer.invalidate();
                        this.dismissTimer = null;
                    }

                    if (!animated) {
                        this.removeFromSuperview();
                        if (this.dismissCallback != null) {
                            this.dismissCallback();
                        }
                        return;
                    }

                    this.setNeedsLayout();
                    UIView.animateWithDurationDelayOptionsAnimationsCompletion(0.3, 0,
                        UIViewAnimationOptions.CurveEaseInOut,
                        () => this.alpha = 0, () => {
                            this.removeFromSuperview();
                            if (this.dismissCallback != null) {
                                this.dismissCallback();
                            }
                        });
                }

                private showWithAnimation() {
                    this.alpha = 0;
                    this.setNeedsLayout();
                    this.bottomMarginConstraint.constant = -this.bottomMargin;
                    this.leftMarginConstraint.constant = this.leftMargin;
                    this.rightMarginConstraint.constant = -this.rightMargin;
                    UIView
                    .animateWithDurationDelayUsingSpringWithDampingInitialSpringVelocityOptionsAnimationsCompletion(
                        0.3, 0, 0.7, 5, UIViewAnimationOptions.CurveEaseInOut, () => this.alpha = 1, null);
                }
            }

            if (this._iosToast != null && !this._iosToast.dismissed) {
                this._iosToast.dismiss(false);
            }

            this._iosToast = new IOSToast(text);
            // TODO: if tab bar visible on screen, this._iosToast.bottomMargin = 55;
            this._iosToast.duration = longDuration ? 5 : 3;
            this._iosToast.dismissCallback = () => {
                this._iosToast = null;
            };
            this._iosToast.show();
        }
    }

    static async showLoading(text: string): Promise<any> {
        if (androidApp != null) {
            if (DeviceActionUtils._androidProgressDialog != null) {
                await DeviceActionUtils.hideLoading();
            }
            DeviceActionUtils._androidProgressDialog = new android.app.ProgressDialog(androidApp.foregroundActivity);
            DeviceActionUtils._androidProgressDialog.setMessage(text);
            DeviceActionUtils._androidProgressDialog.setCancelable(false);
            DeviceActionUtils._androidProgressDialog.show();
        } else if (iosApp != null) {
            if (DeviceActionUtils._iosProgressAlert != null) {
                await DeviceActionUtils.hideLoading();
            }
            const loadingIndicator = new UIActivityIndicatorView(
                { activityIndicatorStyle: UIActivityIndicatorViewStyle.Gray });
            loadingIndicator.frame = {
                origin: { x: 10, y: 5 },
                size: { width: 50, height: 50 },
            };
            loadingIndicator.hidesWhenStopped = true;
            loadingIndicator.startAnimating();

            DeviceActionUtils._iosProgressAlert = UIAlertController.alertControllerWithTitleMessagePreferredStyle(
                null, text, UIAlertControllerStyle.Alert);
            DeviceActionUtils._iosProgressAlert.view.tintColor = UIColor.blackColor;
            DeviceActionUtils._iosProgressAlert.view.addSubview(loadingIndicator);

            return new Promise((resolve) => {
                DeviceActionUtils.getPresentedViewController().presentViewControllerAnimatedCompletion(
                    DeviceActionUtils._iosProgressAlert, false, () => resolve());
            });
        }
    }

    static hideLoading(): Promise<any> {
        if (androidApp != null) {
            if (DeviceActionUtils._androidProgressDialog != null) {
                DeviceActionUtils._androidProgressDialog.hide();
                DeviceActionUtils._androidProgressDialog.dismiss();
                DeviceActionUtils._androidProgressDialog = null;
            }
            return Promise.resolve();
        } else if (iosApp != null) {
            if (DeviceActionUtils._iosProgressAlert == null) {
                return Promise.resolve();
            }
            return new Promise((resolve) => {
                DeviceActionUtils._iosProgressAlert.dismissViewControllerAnimatedCompletion(false, () => resolve());
                DeviceActionUtils._iosProgressAlert = null;
            });
        }
    }

    private static _androidProgressDialog: android.app.ProgressDialog;
    private static _androidToast: android.widget.Toast;
    private static _iosProgressAlert: UIAlertController;
    private static _iosToast: any;

    private static getPresentedViewController(): UIViewController {
        if (iosApp == null) {
            throw new Error('Only iOS apps can use this function.');
        }
        const window = UIApplication.sharedApplication.keyWindow;
        let vc = window.rootViewController;
        while (vc.presentedViewController != null) {
            vc = vc.presentedViewController;
        }
        return vc;
    }
}
