const xcode = require('xcode');
const pbxFile = require('xcode/lib/pbxFile');
const fs = require('fs');
const path = require('path');
const shell = require('child_process').execSync;

module.exports = function (hookArgs) {
    if (hookArgs.platform !== 'iOS') {
        return;
    }

    // console.log(hookArgs);

    const actionExtensionSrcPath = path.resolve(hookArgs.projectData.projectDir,
        'app/ios/ActionExtension');
    const actionExtensionDestPath = path.resolve(hookArgs.projectData.platformsDir,
        'ios/ActionExtension');

    shell('mkdir -p ' + actionExtensionDestPath);
    shell('cp -r ' + actionExtensionSrcPath + '/* ' + actionExtensionDestPath);

    const mainProjPath = path.resolve(hookArgs.projectData.platformsDir,
        'ios/' + hookArgs.projectData.projectName + '.xcodeproj/project.pbxproj');
    const mainProj = xcode.project(mainProjPath);

    mainProj.parse((err) => {
        if (err) {
            console.error(err);
            return;
        }

        // Add NativeScript framework to project
        const nsFrameworkPath = path.resolve(hookArgs.projectData.platformsDir,
            'ios/internal/NativeScript.framework');
        const nsFrameworkEmbedded = mainProj.addFramework(nsFrameworkPath, {
            customFramework: true,
            embed: true,
            link: true,
        });

        // Add new group with extension assets
        const aeGroup = mainProj.addPbxGroup([
            'ActionExtension-Info.plist',
            'extension.js',
        ], 'ActionExtension', 'ActionExtension');

        const groups = mainProj.getPBXObject('PBXGroup');
        for (let key in groups) {
            if (!groups.hasOwnProperty(key)) {
                continue;
            }
            const group = groups[key];
            if (group.children && !group.name && !group.path) {
                group.children.push({ value: aeGroup.uuid, comment: aeGroup.pbxGroup.name });
                break;
            }
        }

        // Add extension target
        const aeTarget = mainProj.addTarget('ActionExtension', 'app_extension');

        // Add NativeScript PreBuild phase to extension
        mainProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'NativeScript PreBuild', aeTarget.uuid, {
            shellPath: '/bin/sh',
            shellScript: '"$SRCROOT/internal/nativescript-pre-build"',
            showEnvVarsInLog: false,
        });

        // Add Source build phase to extension
        mainProj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', aeTarget.uuid);
        mainProj.addSourceFile(actionExtensionDestPath + '/main.m', { target: aeTarget.uuid }, aeGroup.uuid);

        // Add NativeScript PreLink phase to extension
        mainProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'NativeScript PreLink', aeTarget.uuid, {
            shellPath: '/bin/sh',
            shellScript: '"$SRCROOT/internal/nativescript-pre-link"',
            showEnvVarsInLog: false,
        });

        // Add Frameworks build phase to extension
        mainProj.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', aeTarget.uuid);
        const nsFramework = new pbxFile(nsFrameworkPath, { customFramework: true });
        nsFramework.fileRef = nsFrameworkEmbedded.fileRef;
        nsFramework.uuid = mainProj.generateUuid();
        nsFramework.target = aeTarget.uuid;
        mainProj.addToPbxBuildFileSection(nsFramework);
        mainProj.addToPbxFrameworksBuildPhase(nsFramework);
        mainProj.addToFrameworkSearchPaths(nsFramework, { productName: 'ActionExtension' });

        // Add Resources build phase to extension
        mainProj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', aeTarget.uuid);
        const files = mainProj.pbxFileReferenceSection();
        for (let id in files) {
            if (!files.hasOwnProperty(id) || id.indexOf('_comment') > -1) {
                continue;
            }
            let f = null;
            if (files[id].path == 'app' || files[id].path == ('"app"')) {
                f = new pbxFile('app');
            } else if (files[id].path == 'extension.js' || files[id].path == ('"extension.js"')) {
                f = new pbxFile('extension.js');
            }
            if (f != null) {
                f.fileRef = id;
                f.uuid = mainProj.generateUuid();
                f.target = aeTarget.uuid;
                mainProj.addToPbxBuildFileSection(f);
                mainProj.addToPbxResourcesBuildPhase(f);
            }
        }

        // Add NativeScript PostBuild phase to extension
        mainProj.addBuildPhase([], 'PBXShellScriptBuildPhase', 'NativeScript PostBuild', aeTarget.uuid, {
            shellPath: '/bin/sh',
            shellScript: '"$SRCROOT/internal/nativescript-post-build"',
            showEnvVarsInLog: false,
        });

        // Add other links flags to extension
        mainProj.addToOtherLinkerFlags('"-sectcreate"', { productName: 'ActionExtension' });
        mainProj.addToOtherLinkerFlags('__DATA', { productName: 'ActionExtension' });
        mainProj.addToOtherLinkerFlags('__TNSMetadata', { productName: 'ActionExtension' });
        mainProj.addToOtherLinkerFlags('"\\"$(CONFIGURATION_BUILD_DIR)/metadata-$(CURRENT_ARCH).bin\\""', { productName: 'ActionExtension' });

        // Done
        fs.writeFileSync(mainProjPath, mainProj.writeSync());
        console.log('pbxproj modifications written.');
    });
}
