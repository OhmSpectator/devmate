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

    def as_dict(self):
        return {c.name: getattr(self, c.name) for c in self.__table__.columns if c.name != 'id'}
