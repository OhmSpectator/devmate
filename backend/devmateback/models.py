import datetime

from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class Device(db.Model):
    # Constants for device statuses
    FREE = 'free'
    RESERVED = 'reserved'
    OFFLINE = 'offline'
    STATUS_CHOICES = [FREE, RESERVED, OFFLINE]

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), unique=True, nullable=False)
    model = db.Column(db.String(50), nullable=False)
    status = db.Column(db.Enum(*STATUS_CHOICES), nullable=False, default=FREE)
    user = db.Column(db.String(50), nullable=True)
    reservation_time = db.Column(db.DateTime, nullable=True)

    def as_dict(self):
        result_dict = {}

        for column in self.__table__.columns:
            column_name = column.name
            column_value = getattr(self, column_name)

            if column_name == 'id':
                continue  # Skip the 'id' field

            if isinstance(column_value, datetime.datetime):
                # Convert datetime object to a string
                result_dict[column_name] = column_value.isoformat()
            else:
                # Keep other data types as they are
                result_dict[column_name] = column_value

        return result_dict
