import subprocess
import re
import requests
import os

# Fetch the remote URL from git config
try:
    remote_url = subprocess.check_output(["git", "config", "--get", "remote.origin.url"], text=True).strip()
except subprocess.CalledProcessError:
    print("Could not get git remote URL.")
    exit(1)

# Extract owner and repo from the URL
match = re.search(r'github\.com[/:]([^/]+)/(.+)\.git', remote_url)
if not match:
    print("Could not parse git remote URL.")
    exit(1)

owner, repo = match.groups()

print(f"Fetching the latest release from GitHub ({owner}/{repo})")

# Set the asset file type
asset_file_type = 'tar.gz'

# Fetch the latest release info
response = requests.get(f'https://api.github.com/repos/{owner}/{repo}/releases/latest')
release_data = response.json()

# Extract the asset download URL
asset_url = None
target_asset_name = 'devmate-cli.tar.gz'
for asset in release_data['assets']:
    if asset['name'] == target_asset_name:
        asset_url = asset['browser_download_url']
        break

if asset_url is None:
    print('Asset not found.')
    exit(1)

print(f'Found asset: {asset_url}')

# Download and save the asset to a directory
download_directory = '.'
file_name = asset_url.split('/')[-1]
file_path = os.path.join(download_directory, file_name)

response = requests.get(asset_url)
with open(file_path, 'wb') as file:
    file.write(response.content)

print(f'Downloaded {file_name} to {download_directory}')
