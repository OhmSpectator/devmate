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

    // Add the devmate-cli.tar.gz file to the release
    const fileName = 'devmate-cli.tar.gz';
    // Check if the file exists
    if (!fs.existsSync(fileName)) {
        console.error(`File ${fileName} does not exist`);
        core.setFailed(`File ${fileName} does not exist`);
        return;
    }

    // read content of the file
    const fileData = fs.readFileSync(fileName);

    try {
        await github.rest.repos.uploadReleaseAsset({
            owner: context.repo.owner,
            repo: context.repo.repo,
            release_id: release.data.id,
            name: fileName,
            data: fileData
        });
    } catch (e) {
        console.error(`Failed to upload asset ${fileName}: `, e);
        core.setFailed(e.message);
    }
};
