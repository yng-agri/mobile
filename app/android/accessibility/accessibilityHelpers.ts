import { Browser } from './browser';
import { Credentials } from './credentials';

export class AccessibilityHelpers {
    static lastCredentials: Credentials;
    static systemUiPackage = 'com.android.systemui';
    static bitwardenTag = 'bw_access';

    static supportedBrowsers = new Map<string, Browser>([
        new Browser('com.android.chrome', 'url_bar'),
        new Browser('com.chrome.beta', 'url_bar'),
        new Browser('org.chromium.chrome', 'url_bar'),
        new Browser('com.android.browser', 'url'),
        new Browser('com.brave.browser', 'url_bar'),
        new Browser('com.opera.browser', 'url_field'),
        new Browser('com.opera.browser.beta', 'url_field'),
        new Browser('com.opera.mini.native', 'url_field'),
        new Browser('com.chrome.dev', 'url_bar'),
        new Browser('com.chrome.canary', 'url_bar'),
        new Browser('com.google.android.apps.chrome', 'url_bar'),
        new Browser('com.google.android.apps.chrome_dev', 'url_bar'),
        new Browser('org.codeaurora.swe.browser', 'url_bar'),
        new Browser('org.iron.srware', 'url_bar'),
        new Browser('com.sec.android.app.sbrowser', 'location_bar_edit_text'),
        new Browser('com.sec.android.app.sbrowser.beta', 'location_bar_edit_text'),
        new Browser('com.yandex.browser', 'bro_omnibar_address_title_text', (s) => {
            // 1st char = Regular Space, 2nd char = No-break space (00A0)
            const parts = s.split(/ | /);
            return parts.length > 0 ? parts[0] : null;
        }),
        new Browser('org.mozilla.firefox', 'url_bar_title'),
        new Browser('org.mozilla.firefox_beta', 'url_bar_title'),
        new Browser('org.mozilla.fennec_aurora', 'url_bar_title'),
        new Browser('org.mozilla.focus', 'display_url'),
        new Browser('org.mozilla.klar', 'display_url'),
        new Browser('com.ghostery.android.ghostery', 'search_field'),
        new Browser('org.adblockplus.browser', 'url_bar_title'),
        new Browser('com.htc.sense.browser', 'title'),
        new Browser('com.amazon.cloud9', 'url'),
        new Browser('mobi.mgeek.TunnyBrowser', 'title'),
        new Browser('com.nubelacorp.javelin', 'enterUrl'),
        new Browser('com.jerky.browser2', 'enterUrl'),
        new Browser('com.mx.browser', 'address_editor_with_progress'),
        new Browser('com.mx.browser.tablet', 'address_editor_with_progress'),
        new Browser('com.linkbubble.playstore', 'url_text'),
        new Browser('com.ksmobile.cb', 'address_bar_edit_text'),
        new Browser('acr.browser.lightning', 'search'),
        new Browser('acr.browser.barebones', 'search'),
        new Browser('com.microsoft.emmx', 'url_bar'),
        new Browser('com.duckduckgo.mobile.android', 'omnibarTextInput'),
        new Browser('mark.via.gp', 'aw'),
        new Browser('org.bromite.bromite', 'url_bar'),
        new Browser('com.kiwibrowser.browser', 'url_bar'),
        new Browser('com.ecosia.android', 'url_bar'),
        new Browser('com.qwant.liberty', 'url_bar_title'),
    ].map((i) => [i.packageName, i] as [string, Browser]));

    // Known packages to skip
    static filteredPackageNames = new Set<string>([
        AccessibilityHelpers.systemUiPackage,
        'com.google.android.googlequicksearchbox',
        'com.google.android.apps.nexuslauncher',
        'com.google.android.launcher',
        'com.computer.desktop.ui.launcher',
        'com.launcher.notelauncher',
        'com.anddoes.launcher',
        'com.actionlauncher.playstore',
        'ch.deletescape.lawnchair.plah',
        'com.microsoft.launcher',
        'com.teslacoilsw.launcher',
        'com.teslacoilsw.launcher.prime',
        'is.shortcut',
        'me.craftsapp.nlauncher',
        'com.ss.squarehome2',
    ]);

    static getUri(root: android.view.accessibility.AccessibilityNodeInfo): string {
        const rootPackageName = root.getPackageName();
        let uri = 'androidapp://' + rootPackageName;
        if (AccessibilityHelpers.supportedBrowsers.has(rootPackageName)) {
            const browser = AccessibilityHelpers.supportedBrowsers.get(rootPackageName);
            const nodeList = root.findAccessibilityNodeInfosByViewId(rootPackageName + ':id/' + browser.uriViewId);
            if (nodeList != null && nodeList.size() > 0) {
                let addressNode: android.view.accessibility.AccessibilityNodeInfo = nodeList.get(0);
                if (addressNode != null) {
                    uri = AccessibilityHelpers.extractUri(uri, addressNode, browser);
                    addressNode = null;
                }
            }
        }
        return uri;
    }

    static extractUri(uri: string, addressNode: android.view.accessibility.AccessibilityNodeInfo,
        browser: Browser): string {
        if (addressNode == null) {
            return uri;
        }
        const text = addressNode.getText().toString();
        if (text == null) {
            return uri;
        }
        uri = browser.getUriFunction(text);
        if (uri != null && uri.indexOf('.') > -1) {
            uri = uri.trim();
            if (uri.indexOf('://') === -1 && uri.indexOf(' ') === -1) {
                uri = ('http://' + uri);
            } else if (android.os.Build.VERSION.SDK_INT <= android.os.Build.VERSION_CODES.KITKAT_WATCH) {
                const parts = uri.split('. ');
                if (parts.length > 1) {
                    const urlPart = parts.find((p) => p.indexOf('http') === 0);
                    if (urlPart != null) {
                        uri = urlPart.trim();
                    }
                }
            }
        }
        return uri;
    }

    // Check to make sure it is ok to autofill still on the current screen
    static needsToAutofill(credentials: Credentials, currentUriString: string): boolean {
        if (credentials == null) {
            return false;
        }
        try {
            const lastUri = new java.net.URL(credentials.lastUri);
            const currentUri = new java.net.URL(currentUriString);
            return lastUri.getHost() === currentUri.getHost();
        } catch { }
        return false;
    }

    static isEditText(n: android.view.accessibility.AccessibilityNodeInfo): boolean {
        if (n == null) {
            return false;
        }
        const className = n.getClassName();
        if (className == null) {
            return false;
        }
        return className.indexOf('EditText') > -1;
    }

    static fillCredentials(usernameNode: android.view.accessibility.AccessibilityNodeInfo,
        passwordNodes: android.view.accessibility.AccessibilityNodeInfo[]): void {
        if (AccessibilityHelpers.lastCredentials == null) {
            return;
        }
        AccessibilityHelpers.fillEditText(usernameNode, AccessibilityHelpers.lastCredentials.username);
        passwordNodes.forEach((n) =>
            AccessibilityHelpers.fillEditText(n, AccessibilityHelpers.lastCredentials.password));
    }

    static fillEditText(editTextNode: android.view.accessibility.AccessibilityNodeInfo, value: string): void {
        if (editTextNode == null || value == null) {
            return;
        }
        const bundle = new android.os.Bundle();
        bundle.putString(android.view.accessibility.AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, value);
        editTextNode.performAction(android.view.accessibility.AccessibilityNodeInfo.ACTION_SET_TEXT, bundle);
    }

    static getWindowNodes(
        n: android.view.accessibility.AccessibilityNodeInfo,
        e: android.view.accessibility.AccessibilityEvent,
        condition: (node: android.view.accessibility.AccessibilityNodeInfo) => boolean,
        disposeIfUnused: boolean,
        nodes: android.view.accessibility.AccessibilityNodeInfo[] = null,
        recursionDepth = 0): android.view.accessibility.AccessibilityNodeInfo[] {
        if (nodes == null) {
            nodes = [];
        }

        let dispose = disposeIfUnused;
        if (n != null && recursionDepth < 50) {
            const resource = n.getViewIdResourceName();
            const fromSystem = () => resource != null && resource.indexOf(AccessibilityHelpers.systemUiPackage) === 0;
            if (n.getWindowId() === e.getWindowId() && !fromSystem() && condition(n)) {
                dispose = false;
                nodes.push(n);
            }

            for (let i = 0; i < n.getChildCount(); i++) {
                const childNode = n.getChild(i);
                if (i > 100) {
                    android.util.Log.i(AccessibilityHelpers.bitwardenTag, 'Too many child iterations.');
                    break;
                } else if (childNode.hashCode() === n.hashCode()) {
                    android.util.Log.i(AccessibilityHelpers.bitwardenTag,
                        'Child node is the same as parent for some reason.');
                } else {
                    AccessibilityHelpers.getWindowNodes(childNode, e, condition, true, nodes, recursionDepth++);
                }
            }
        }

        if (dispose) {
            n = null;
        }
        return nodes;
    }

    static getNodesAndFill(root: android.view.accessibility.AccessibilityNodeInfo,
        e: android.view.accessibility.AccessibilityEvent,
        passwordNodes: android.view.accessibility.AccessibilityNodeInfo[]) {
        const allEditTexts = AccessibilityHelpers.getWindowNodes(root, e,
            (n) => AccessibilityHelpers.isEditText(n), false);
        let usernameEditText = AccessibilityHelpers.getUsernameEditText(allEditTexts);
        AccessibilityHelpers.fillCredentials(usernameEditText, passwordNodes);
        AccessibilityHelpers.disposeNodes(allEditTexts);
        usernameEditText = null;
    }

    static getUsernameEditText(allEditTexts: android.view.accessibility.AccessibilityNodeInfo[]):
        android.view.accessibility.AccessibilityNodeInfo {
        let usernameEditText: android.view.accessibility.AccessibilityNodeInfo = null;
        for (let i = 0; i < allEditTexts.length; i++) {
            if (allEditTexts[i].isPassword()) {
                break;
            } else {
                usernameEditText = allEditTexts[i];
            }
        }
        return usernameEditText;
    }

    static printTestData(root: android.view.accessibility.AccessibilityNodeInfo,
        e: android.view.accessibility.AccessibilityEvent): void {
        const testNodes = AccessibilityHelpers.getWindowNodes(root, e,
            (n) => n.getViewIdResourceName() != null && n.getText() != null, false);
        const testNodesData = testNodes.map((n) => {
            return { id: n.getViewIdResourceName().toString(), text: n.getText().toString() };
        });
        console.log(testNodesData);
    }

    static disposeNodes(nodes: android.view.accessibility.AccessibilityNodeInfo[]) {
        nodes.forEach((n) => n = null);
        nodes = null;
    }
}
