import logging

from datetime import datetime, timezone
from flask import Blueprint, request, jsonify
from http import HTTPStatus

from devmateback.app import db
from devmateback.models import Device
from devmateback.validation import validate_request

devices_bp = Blueprint('devices', __name__)
logger = logging.getLogger(f"devmate.{__name__}")


@devices_bp.route('/list', methods=['GET'])
def list_devices():
    logger.debug('Listing devices')
    devices = Device.query.all()
    if not devices:
        logger.debug('No devices found')
        return '', HTTPStatus.NO_CONTENT
    logger.debug(f'Found {len(devices)} devices')
    return jsonify({"devices": [device.as_dict() for device in devices]}), HTTPStatus.OK


@devices_bp.route('/reserve', methods=['POST'])
def reserve_device():
    logger.debug('Reserving device')
    is_valid, error_response, status_code = validate_request(request, ['device', 'username'])
    if not is_valid:
        logger.error(f'Invalid request')
        return error_response, status_code

    device = request.json['device']
    username = request.json['username']

    device = Device.query.filter_by(name=device).first()
    if device:
        if device.status == Device.FREE:
            device.status = Device.RESERVED
            device.user = username
            device.reservation_time = datetime.utcnow().replace(tzinfo=timezone.utc).astimezone(timezone.utc)
            db.session.commit()
            logger.info(f'Device {device} reserved by {username}')
            return jsonify({'message': 'Device reserved'})
        else:
            logger.debug(f'Device {device} not available for reservation')
            return jsonify({'message': 'Device not available for reservation',
                            'reserved_by': device.user}), HTTPStatus.CONFLICT
    else:
        logger.error(f'Device {device} not found')
        return jsonify({'message': 'Device not found'}), HTTPStatus.NOT_FOUND


@devices_bp.route('/release', methods=['POST'])
def release_device():
    logger.debug('Releasing device')
    is_valid, error_response, status_code = validate_request(request, ['device'])
    if not is_valid:
        logger.error(f'Invalid request')
        return error_response, status_code

    device = request.json['device']
    device = Device.query.filter_by(name=device).first()
    if device:
        if device.status == Device.RESERVED:
            device.status = Device.FREE
            device.user = None
            device.reservation_time = None
            db.session.commit()
            logger.info(f'Device {device} released')
            return jsonify({'message': 'Device released'})
        else:
            logger.debug(f'Device {device} not reserved')
            return jsonify({'message': 'Device is not reserved'}), HTTPStatus.NOT_MODIFIED
    else:
        logger.error(f'Device {device} not found')
        return jsonify({'message': 'Device not found'}), HTTPStatus.NOT_FOUND


@devices_bp.route('/add', methods=['POST'])
def add_device():
    is_valid, error_response, status_code = validate_request(request, ['device', 'model'])
    if not is_valid:
        logger.error(f'Invalid request')
        return error_response, status_code

    device = request.json['device']
    model = request.json['model']

    existing_device = Device.query.filter_by(name=device).first()
    if existing_device:
        logger.debug(f'Device {device} already exists')
        return jsonify({"message": "Device with this name already exists"}), HTTPStatus.CONFLICT

    new_device = Device(name=device, model=model, status=Device.FREE)
    db.session.add(new_device)
    db.session.commit()
    logger.info(f'Device {device} added')
    return jsonify({'message': 'Device added'}), HTTPStatus.CREATED


@devices_bp.route('/offline', methods=['POST'])
def set_device_offline():
    is_valid, error_response, status_code = validate_request(request, ['device'])
    if not is_valid:
        logger.error(f'Invalid request')
        return error_response, status_code

    device = request.json['device']
    device = Device.query.filter_by(name=device).first()

    if device:
        if device.status != Device.OFFLINE:
            device.status = Device.OFFLINE
            device.user = None
            device.reservation_time = None
            db.session.commit()
            logger.info(f'Device {device} set to offline')
            return jsonify({'message': 'Device set to offline'}), HTTPStatus.OK
        else:
            logger.debug(f'Device {device} already offline')
            return '', HTTPStatus.NOT_MODIFIED
    else:
        logger.error(f'Device {device} not found')
        return jsonify({'message': 'Device not found'}), HTTPStatus.NOT_FOUND


@devices_bp.route('/online', methods=['POST'])
def set_device_free():
    is_valid, error_response, status_code = validate_request(request, ['device'])
    if not is_valid:
        logger.error(f'Invalid request')
        return error_response, status_code

    device = request.json['device']
    device = Device.query.filter_by(name=device).first()

    if device:
        if device.status == Device.OFFLINE:
            device.status = Device.FREE
            db.session.commit()
            logger.info(f'Device {device} set to available')
            return jsonify({'message': 'Device set to available'}), HTTPStatus.OK
        else:
            logger.debug(f'Device {device} already available')
            return '', HTTPStatus.NOT_MODIFIED
    else:
        logger.error(f'Device {device} not found')
        return jsonify({'message': 'Device not found'}), HTTPStatus.NOT_FOUND


@devices_bp.route('/delete/', defaults={'device': None}, methods=['DELETE'])
@devices_bp.route('/delete/<string:device>', methods=['DELETE'])
def delete_device(device):
    if not device:
        logger.error(f'Invalid request')
        return jsonify({"message": "Device name missing"}), HTTPStatus.BAD_REQUEST

    device = Device.query.filter_by(name=device).first()
    if device:
        db.session.delete(device)
        db.session.commit()
        logger.info(f'Device {device} deleted')
        return '', HTTPStatus.NO_CONTENT
    else:
        logger.error(f'Device {device} not found')
        return jsonify({'message': 'Device not found'}), HTTPStatus.NOT_FOUND
