from flask import jsonify
import logging
from http import HTTPStatus

logger = logging.getLogger(f"devmate.{__name__}")


def validate_request(req, required_fields):
    if not req.json:
        logger.error("JSON body expected")
        return (False, jsonify({"message": "JSON body expected"}),
                HTTPStatus.BAD_REQUEST)

    missing_fields = [field for field in required_fields if field not in req.json]
    empty_fields = [field for field in required_fields if field in req.json and not req.json[field]]

    error_messages = []
    if missing_fields:
        logger.error(f"Missing parameters: {', '.join(missing_fields)}")
        error_messages.append(f"Missing parameters: {', '.join(missing_fields)}")
    if empty_fields:
        logger.error(f"Empty parameters: {', '.join(empty_fields)}")
        error_messages.append(f"Empty parameters: {', '.join(empty_fields)}")

    if error_messages:
        return (False, jsonify({"message": ", ".join(error_messages)}),
                HTTPStatus.BAD_REQUEST)

    return True, None, None
