module.exports = async function({ github, context, core }) {
    const fs = require('fs');
    const path = require('path');

    // Construct a tag name in a format of YY.MM.dd.HASH
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString().substr(-2);
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, '0');
    const currentDay = currentDate.getDate().toString().padStart(2, '0');
    const commitHash = context.sha.substring(0, 4);  // Taking first 4 characters of commit hash
    const tagName = `${currentYear}.${currentMonth}.${currentDay}.${commitHash}`;

    let release;
    try {
        release = await github.rest.repos.createRelease({
            owner: context.repo.owner,
            repo: context.repo.repo,
            tag_name: tagName,
            name: `DevMate CLI - ${tagName}`,
        });
    } catch (e) {
        console.error("Failed to create release: ", e);
        // Force fail the action
        core.setFailed(e.message);
        return;
    }

    // List downloaded artifacts
    const artifactFolder = './artifacts';
    const filenames = fs.readdirSync(artifactFolder);

    // Loop over the files and upload them to the release
    for (const filename of filenames) {
        // Skip directories
        if (fs.lstatSync(path.join(artifactFolder, filename)).isDirectory()) {
            continue;
        }
        console.error(`Uploading ${filename}...`)
        const filePath = path.join(artifactFolder, filename);
        const fileData = fs.readFileSync(filePath);

        try {
            await github.rest.repos.uploadReleaseAsset({
                owner: context.repo.owner,
                repo: context.repo.repo,
                release_id: release.data.id,
                name: filename,
                data: fileData
            });
        } catch (e) {
            console.error(`Failed to upload asset ${filename}: `, e);
            core.setFailed(e.message);
            return;
        }
    }
};
