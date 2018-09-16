import * as fs from 'file-system';

import { I18nService as BaseI18nService } from 'jslib/services/i18n.service';

export class I18nService extends BaseI18nService {
    constructor(systemLanguage: string) {
        super(systemLanguage, fs.path.join(fs.knownFolders.currentApp().path, 'locales'),
            (formattedLocale: string) => {
                const localFile = fs.File.fromPath(
                    fs.path.join(this.localesDirectory, formattedLocale + '/messages.json'));
                const localesJson = localFile.readTextSync();
                const locales = JSON.parse(localesJson.replace(/^\uFEFF/, '')); // strip the BOM
                return Promise.resolve(locales);
            });

        this.supportedTranslationLocales = [
            'en', 'es',
        ];
    }
}
