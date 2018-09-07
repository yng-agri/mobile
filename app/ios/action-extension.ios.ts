export class ActionExtensionViewController extends UIViewController {
    viewDidAppear(animated: boolean) {
        console.log('my view did appear');
        super.viewDidAppear(animated);
    }

    viewDidLoad() {
        console.log('my view did load: ' + this.extensionContext.inputItems.count);

        for (let i = 0; i < this.extensionContext.inputItems.count; i++) {
            const item: NSExtensionItem = this.extensionContext.inputItems[i];
            for (let j = 0; j < item.attachments.count; j++) {
                const itemProvider: NSItemProvider = item.attachments[j];

                console.log(itemProvider);

                if (itemProvider.hasItemConformingToTypeIdentifier('com.apple.property-list')) {
                    itemProvider.loadItemForTypeIdentifierOptionsCompletionHandler(
                        'com.apple.property-list', null, (list, error) => {
                            
                            console.log('loaded item');
                            console.log(list);
                        });
                }
            }
        }
        super.viewDidLoad();
    }
}
