export class Browser {
    packageName: string;
    uriViewId: string;

    constructor(packageName: string, uriViewId: string, getUriFunction: (s: string) => string = null) {
        this.packageName = packageName;
        this.uriViewId = uriViewId;
        if (getUriFunction != null) {
            this.getUriFunction = getUriFunction;
        }
    }

    getUriFunction = (s: string): string => s;
}
