import logging
import os
from logging.handlers import RotatingFileHandler

from flask import Flask, request
from flask_cors import CORS

from devmateback.models import db
from devmateback.devices import devices_bp

# Set up logging
handler = RotatingFileHandler('devmate.log', maxBytes=1024 * 1024, backupCount=3)
formatter = logging.Formatter('[%(asctime)s.%(msecs)03d] [%(name)s] [%(levelname)s] :  %(message)s',
                              datefmt='%d.%m.%Y %H:%M:%S')
handler.setFormatter(formatter)
logger = logging.getLogger('devmate')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)


def init_db(app_to_setup):
    # Get the path to the database directory
    db_dir = os.environ.get('DB_DIR', os.getcwd())

    # Check that the database directory exists and is writable
    if not os.path.exists(db_dir):
        print("Database directory doesn't exist!")
        return None
    else:
        print("Database directory exists!")
        # check the permissions of the directory
        if not os.access(db_dir, os.W_OK):
            print("Database directory is not writable!")
            return None
        else:
            print("Database directory is writable!")

    # Set up the database
    db_path = os.path.join(db_dir, 'devices.db')
    print(f'Using database at {db_path}')
    app_to_setup.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'

    # Initialize the database
    db.init_app(app_to_setup)

    # Create the database tables
    with app_to_setup.app_context():
        db.create_all()

    return True


def create_app():
    # Create the Flask app
    new_app = Flask(__name__)

    # Enable CORS (Cross-Origin Resource Sharing). This is needed to allow the frontend to access the backend.
    CORS(new_app)

    if not init_db(new_app):
        return None

    # Register the blueprint
    new_app.register_blueprint(devices_bp, url_prefix='/devices')

    return new_app


app = create_app()
if app is None:
    print("Failed to create the Flask app!")
    exit(1)


@app.before_request
def before_request():
    # Log the request details, including the method, path and query string arguments
    logger.debug(f'REQUEST: {request.method} - {request.path} - {request.get_json(silent=True)} ')


@app.after_request
def after_request(response):
    logger.debug(f'HANDLED: {response.status}')
    return response


@app.route('/health', methods=['GET'])
def health_check():
    return '', 200


if __name__ == '__main__':
    app.run(debug=True)
