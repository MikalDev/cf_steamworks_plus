const { exec, execSync } = require('child_process');
const fs = require('fs');

function findMSBuildPath() {
    // Common paths for various versions of Visual Studio
    const potentialPaths = [
        'C:\\Program Files\\Microsoft Visual Studio\\2022\\Community\\MSBuild\\Current\\Bin\\',
        'C:/Program Files/Microsoft Visual Studio/2019/Community/MSBuild/Current/Bin/',
        'C:/Program File/Microsoft Visual Studio/2017/Community/MSBuild/15.0/Bin/',
        // Add more paths as necessary
    ];

    for (const path of potentialPaths) {
        console.log('Checking ' + path);
        if (fs.existsSync(path + 'MSBuild.exe')) {
            console.log('Found MSBuild at ' + path);
            return path + 'MSBuild.exe';
        }
    }

    // If none of the paths work, try using the 'where' command (Windows)
    try {
        return execSync('where MSBuild.exe', { encoding: 'utf8', stdio: 'pipe' }).trim();
    } catch (e) {
        console.warn('MSBuild path not found in common directories. Please add it manually to the system PATH.');
        return null;
    }
}

const msbuildPath = findMSBuildPath();
const projectPath = "wrapper-extension\\SteamExt.sln"

if (msbuildPath) {
    exec(`"${msbuildPath}" ${projectPath} /t:Build /p:Configuration=Release`, (error, stdout, stderr) => {
        if (error) {
            console.error(`exec error: ${error}`);
            console.error(`stdout: ${stdout}`);
            console.error(`stderr: ${stderr}`);
            return;
        }

        console.log(`stdout: ${stdout}`);
        if (stderr) {
            console.error(`stderr: ${stderr}`);
        }
    });
}