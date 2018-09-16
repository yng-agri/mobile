const fs = require('fs');
const path = require('path');

module.exports = function (hookArgs) {
    if (hookArgs.shouldPrepareInfo.platformInfo.platform !== 'Android') {
        return;
    }
    const appPath = path.resolve(hookArgs.shouldPrepareInfo.platformInfo.projectData.platformsDir,
        'android/app/src/main/assets/app/application.js');
    if (fs.existsSync(appPath)) {
        const content = fs.readFileSync(appPath, 'utf8');
        fs.writeFileSync(appPath, 'require("./vendor");\n' + content);
    }
}
