import { Browser } from './browser';

export class AccessibilityHelpers {
    static systemUiPackage = 'com.android.systemui';

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
}
