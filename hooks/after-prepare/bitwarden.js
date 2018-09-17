const xcode = require('xcode');
const pbxFile = require('xcode/lib/pbxFile');
const fs = require('fs');
const path = require('path');
const shell = require('child_process').execSync;

const DevTeamId = 'LTZ2PFU5D6';

module.exports = function (hookArgs) {
    if (hookArgs.platform !== 'iOS') {
        return;
    }

    // console.log(hookArgs);

    const mainProjPath = path.resolve(hookArgs.projectData.platformsDir,
        'ios/' + hookArgs.projectData.projectName + '.xcodeproj/project.pbxproj');
    const mainProj = xcode.project(mainProjPath);

    mainProj.parse((err) => {
        if (err) {
            console.error(err);
            return;
        }

        // Add NativeScript framework to main project
        mainProj.addFramework('$(SRCROOT)/internal/NativeScript.framework', {
            customFramework: true,
            embed: true,
            link: true,
        });

        addExtension(hookArgs, mainProj, 'ActionExtension', ['extension.js']);

        // Add build properties
        mainProj.addBuildProperty('"CODE_SIGN_IDENTITY[sdk=iphoneos*]"', '"iPhone Developer"');
        mainProj.addBuildProperty('DEVELOPMENT_TEAM', DevTeamId);
        mainProj.addBuildProperty('ENABLE_BITCODE', 'NO');

        // Add entitlements
        const appEntitlementsSrcPath = path.resolve(hookArgs.projectData.projectDir, 'app/ios/app.entitlements');
        const appEntitlementsDestPath = path.resolve(hookArgs.projectData.platformsDir, 'ios',
            hookArgs.projectData.projectName, 'app.entitlements');
        shell('cp ' + appEntitlementsSrcPath + ' ' + appEntitlementsDestPath);
        mainProj.addBuildProperty('CODE_SIGN_ENTITLEMENTS',
            hookArgs.projectData.projectName + '/app.entitlements');

        // Done
        fs.writeFileSync(mainProjPath, mainProj.writeSync());
        console.log('pbxproj modifications written.');
    });

    function addExtension(hookArgs, mainProj, extensionName, extensionResources) {
        extensionResources = extensionResources || [];

        // Copy extension assets
        const extensionSrcPath = path.resolve(hookArgs.projectData.projectDir, 'app/ios/' + extensionName);
        const extensionDestPath = path.resolve(hookArgs.projectData.platformsDir, 'ios/' + extensionName);

        shell('mkdir -p ' + extensionDestPath);
        shell('cp -r ' + extensionSrcPath + '/* ' + extensionDestPath);

        // Add new group with extension assets
        const aeGroup = mainProj.addPbxGroup([
            extensionName + '-Info.plist',
        ].concat(extensionResources), extensionName, extensionName);

        const groups = mainProj.getPBXObject('PBXGroup');
        for (let id in groups) {
            if (!groups.hasOwnProperty(id) || id.indexOf('_comment') > -1) {
                continue;
            }
            const group = groups[id];
            if (group.children && !group.name && !group.path) {
                group.children.push({ value: aeGroup.uuid, comment: aeGroup.pbxGroup.name });
                break;
            }
        }

        // Add extension target
        const aeTarget = mainProj.addTarget(extensionName, 'app_extension');

        // Add NativeScript PreBuild phase to extension
        addScriptBuildPhase(aeTarget.uuid, 'NativeScript PreBuild', '"$SRCROOT/internal/nativescript-pre-build"');

        // Add Source build phase to extension
        mainProj.addBuildPhase([], 'PBXSourcesBuildPhase', 'Sources', aeTarget.uuid);
        mainProj.addSourceFile('main.m', { target: aeTarget.uuid }, aeGroup.uuid);

        // Add NativeScript PreLink phase to extension
        addScriptBuildPhase(aeTarget.uuid, 'NativeScript PreLink', '"$SRCROOT/internal/nativescript-pre-link"');

        // Add Frameworks and Resources build phases to extension
        mainProj.addBuildPhase([], 'PBXFrameworksBuildPhase', 'Frameworks', aeTarget.uuid);
        mainProj.addBuildPhase([], 'PBXResourcesBuildPhase', 'Resources', aeTarget.uuid);

        const frameworks = [
            'TNSWidgets.framework',
            'NativeScript.framework',
        ];
        const resources = [
            'app',
        ].concat(extensionResources);
        const files = mainProj.pbxFileReferenceSection();
        for (let id in files) {
            if (!files.hasOwnProperty(id) || id.indexOf('_comment') > -1 || !files[id].path) {
                continue;
            }

            const cleanPath = files[id].path.replace(/"/g, '');
            const cleanName = files[id].name ? files[id].name.replace(/"/g, '') : null;

            let frameworksIndex = frameworks.indexOf(cleanPath);
            if (frameworksIndex === -1 && cleanName) {
                frameworksIndex = frameworks.indexOf(cleanName);
            }
            let resourcesIndex = resources.indexOf(cleanPath);
            if (resourcesIndex === -1 && cleanName) {
                resourcesIndex = resources.indexOf(cleanName);
            }

            let f = null;
            if (frameworksIndex > -1) {
                f = new pbxFile(cleanPath, { customFramework: true });
            } else if (resourcesIndex > -1) {
                f = new pbxFile(cleanPath);
            }
            if (f == null) {
                continue;
            }

            f.fileRef = id;
            f.uuid = mainProj.generateUuid();
            f.target = aeTarget.uuid;
            mainProj.addToPbxBuildFileSection(f);
            if (frameworksIndex > -1) {
                mainProj.addToPbxFrameworksBuildPhase(f);
                mainProj.addToFrameworkSearchPaths(f, { productName: extensionName });
            } else if (resourcesIndex > -1) {
                mainProj.addToPbxResourcesBuildPhase(f);
            }
        }

        // Add NativeScript PostBuild phase to extension
        addScriptBuildPhase(aeTarget.uuid, 'NativeScript PostBuild', '"$SRCROOT/internal/nativescript-post-build"');

        // Add other links flags to extension
        mainProj.addToOtherLinkerFlags('"-sectcreate"', { productName: extensionName });
        mainProj.addToOtherLinkerFlags('__DATA', { productName: extensionName });
        mainProj.addToOtherLinkerFlags('__TNSMetadata', { productName: extensionName });
        mainProj.addToOtherLinkerFlags('"\\"$(CONFIGURATION_BUILD_DIR)/metadata-$(CURRENT_ARCH).bin\\""',
            { productName: extensionName });

        // Add target attributes for extension
        mainProj.addTargetAttribute('DevelopmentTeam', DevTeamId, aeTarget);
        mainProj.addTargetAttribute('ProvisioningStyle', 'Automatic', aeTarget);
    }

    function addScriptBuildPhase(target, name, script) {
        mainProj.addBuildPhase([], 'PBXShellScriptBuildPhase', name, target, {
            shellPath: '/bin/sh',
            shellScript: script,
            showEnvVarsInLog: false,
        });
    }
}
