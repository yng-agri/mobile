export class ExtensionViewController extends UIViewController {
    viewDidAppear(animated: boolean) {
        console.log('my view did appear');
        super.viewDidAppear(animated);
    }

    viewDidLoad() {
        console.log('my view did load');
        super.viewDidLoad();
    }
}
