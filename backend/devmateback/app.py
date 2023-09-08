import logging
from logging.handlers import RotatingFileHandler

from flask import Flask, request

from devmateback.models import db
from devmateback.devices import devices_bp

# Set up logging
handler = RotatingFileHandler('devmate.log', maxBytes=1024*1024, backupCount=3)
formatter = logging.Formatter('[%(asctime)s.%(msecs)03d] [%(name)s] [%(levelname)s] :  %(message)s',
                              datefmt='%d.%m.%Y %H:%M:%S')
handler.setFormatter(formatter)
logger = logging.getLogger('devmate')
logger.setLevel(logging.DEBUG)
logger.addHandler(handler)


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///devices.db'


@app.before_request
def before_request():
    # Log the request details, including the method, path and query string arguments
    logger.debug(f'REQUEST: {request.method} - {request.path} - {request.get_json(silent=True)} ')


@app.after_request
def after_request(response):
    logger.debug(f'HANDLED: {response.status_code} - {response.status}')
    return response


@app.route('/health', methods=['GET'])
def health_check():
    return '', 200


# Initialize the database with the app
db.init_app(app)

# Register the blueprint
app.register_blueprint(devices_bp, url_prefix='/devices')

with app.app_context():
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)
