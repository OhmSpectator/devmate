import logging

from flask import Blueprint, request, jsonify, send_from_directory, current_app
from http import HTTPStatus

cli_bp = Blueprint('cli', __name__)
logger = logging.getLogger(f"devmate.{__name__}")


@cli_bp.route('/get', methods=['GET'])
def download_cli():
    cli_dir = current_app.config.get('CLI_BINARY_PATH', None)
    if not cli_dir:
        logger.error("CLI getting interface not set up!")
        return jsonify({"message": "CLI binary directory doesn't exist!"}), HTTPStatus.INTERNAL_SERVER_ERROR

    platform = request.args.get('platform')
    logger.debug(f"Platform from request: {platform}")

    file_name = "devmate"
    if not platform:
        logger.debug("No platform specified, trying to guess from user agent")
        user_agent = request.headers.get('User-Agent', '').lower()
        platform = None
        if 'windows' in user_agent.lower():
            platform = 'windows'
        elif 'mac' in user_agent.lower():
            platform = 'macos'
        elif 'linux' in user_agent.lower():
            platform = 'linux'

    if platform not in ['linux', 'macos', 'windows']:
        return jsonify({"message": "Invalid platform"}), HTTPStatus.BAD_REQUEST

    if platform == 'windows':
        file_name += '.exe'

    logger.debug(f"Platform: {platform}")
    logger.debug(f"File name: {file_name}")

    platform_path = f"{cli_dir}/devmatecli-{platform}-latest/"

    try:
        return send_from_directory(platform_path, file_name, as_attachment=True)
    except FileNotFoundError:
        return jsonify({"message": "CLI binary not found"}), HTTPStatus.NOT_FOUND
    except Exception as e:
        logger.error(f"Failed to send CLI binary: {str(e)}")
        return jsonify({"message": "Failed to download CLI binary"}), HTTPStatus.INTERNAL_SERVER_ERROR
