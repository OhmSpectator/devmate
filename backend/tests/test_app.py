import unittest

from devmateback.app import app, db
from devmateback.models import Device
from http import HTTPStatus
from datetime import datetime


class BaseTestCase(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///test.db'
        cls.client = app.test_client()

    @classmethod
    def tearDownClass(cls):
        pass

    def setUp(self):
        with app.app_context():
            db.create_all()

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()


class TestHealth(BaseTestCase):

    def test_health(self):
        response = self.client.get('/health')
        self.assertEqual(HTTPStatus.OK, response.status_code)


class TestListDevices(BaseTestCase):

    def test_list_devices_empty(self):
        response = self.client.get('/devices/list')
        self.assertEqual(HTTPStatus.NO_CONTENT, response.status_code)

    def test_list_devices_with_data(self):
        with app.app_context():
            current_time = datetime.utcnow()
            device1 = Device(name='Device1', model='Model1', status='free', reservation_time=current_time)
            device2 = Device(name='Device2', model='Model2', status='free', reservation_time=current_time)
            db.session.add(device1)
            db.session.add(device2)
            db.session.commit()

        response = self.client.get('/devices/list')
        self.assertEqual(response.status_code, HTTPStatus.OK)
        self.assertEqual(len(response.get_json()['devices']), 2)
        self.assertEqual(response.get_json()['devices'][0]['name'], 'Device1')
        self.assertEqual(response.get_json()['devices'][1]['name'], 'Device2')

        returned_time1 = datetime.fromisoformat(response.get_json()['devices'][0]['reservation_time'])
        returned_time2 = datetime.fromisoformat(response.get_json()['devices'][1]['reservation_time'])

        # Comparison
        self.assertEqual(current_time, returned_time1)
        self.assertEqual(current_time, returned_time2)

class TestAddDevice(BaseTestCase):
    
    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True
        with app.app_context():
            db.create_all()  # Create a temporary database for testing

    def tearDown(self):
        with app.app_context():
            db.session.remove()
            db.drop_all()  # Clean up the database
    
    def test_add_device_success(self):
        response = self.app.post('/devices/add', json={'device': 'Device1', 'model': 'Model1'})
        self.assertEqual(HTTPStatus.CREATED, response.status_code)
        self.assertEqual(response.json, {'message': 'Device added'})

    def test_add_existing_device(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='free')
            db.session.add(device)
            db.session.commit()

        response = self.app.post('/devices/add', json={'device': 'Device1', 'model': 'Model2'})
        self.assertEqual(HTTPStatus.CONFLICT, response.status_code)
        self.assertEqual(response.json, {'message': 'Device with this name already exists'})

    def test_add_device_missing_params(self):
        response = self.app.post('/devices/add', json={'device': 'Device1'})
        self.assertEqual(HTTPStatus.BAD_REQUEST, response.status_code)
        self.assertEqual(response.json, {'message': 'Missing parameters: model'})

    def test_add_device_empty_params(self):
        response = self.app.post('/devices/add', json={'device': '', 'model': ''})
        self.assertEqual(HTTPStatus.BAD_REQUEST, response.status_code)
        self.assertEqual(response.json, {'message': 'Empty parameters: '
                                                    'device, model'})


class TestReleaseDevice(BaseTestCase):

    def test_release_device_success(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='reserved')
            db.session.add(device)
            db.session.commit()

        response = self.client.post('/devices/release', json={'device': 'Device1'})
        self.assertEqual(HTTPStatus.OK, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device released'})

    def test_release_device_not_reserved(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='free')
            db.session.add(device)
            db.session.commit()

        response = self.client.post('/devices/release', json={'device': 'Device1'})
        self.assertEqual(HTTPStatus.NOT_MODIFIED, response.status_code)

    def test_release_device_not_found(self):
        response = self.client.post('/devices/release', json={'device': 'NonExistentDevice'})
        self.assertEqual(HTTPStatus.NOT_FOUND, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device not found'})

    def test_release_device_missing_parameters(self):
        response = self.client.post('/devices/release', json={})
        self.assertEqual(HTTPStatus.BAD_REQUEST, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'JSON body expected'})

    def test_release_device_empty_parameters(self):
        response = self.client.post('/devices/release', json={'device': ''})
        self.assertEqual(HTTPStatus.BAD_REQUEST, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Empty parameters: device'})


class TestReserveDevice(BaseTestCase):

    def test_reserve_device_success(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='free')
            db.session.add(device)
            db.session.commit()

        response = self.client.post('/devices/reserve', json={'device': 'Device1', 'username': 'Nikolay'})
        self.assertEqual(HTTPStatus.OK, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device reserved'})

    def test_reserve_device_already_reserved(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='reserved', user='SomeoneElse')
            db.session.add(device)
            db.session.commit()

        response = self.client.post('/devices/reserve', json={'device': 'Device1', 'username': 'Nikolay'})
        self.assertEqual(HTTPStatus.CONFLICT, response.status_code)
        self.assertEqual(response.get_json(),
                         {'message': 'Device not available for reservation', 'reserved_by': 'SomeoneElse'})

    def test_reserve_device_not_found(self):
        response = self.client.post('/devices/reserve',
                                    json={'device': 'NonExistentDevice', 'username': 'Nikolay'})
        self.assertEqual(HTTPStatus.NOT_FOUND, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device not found'})

    def test_reserve_device_missing_parameters(self):
        response = self.client.post('/devices/reserve', json={})
        self.assertEqual(HTTPStatus.BAD_REQUEST, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'JSON body expected'})

    def test_reserve_device_empty_parameters(self):
        response = self.client.post('/devices/reserve', json={'device': '', 'username': ''})
        self.assertEqual(HTTPStatus.BAD_REQUEST, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Empty parameters: device, username'})


class TestSetDeviceStatus(BaseTestCase):

    def test_set_device_to_offline(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='free')
            db.session.add(device)
            db.session.commit()

        response = self.client.post('/devices/offline', json={'device': 'Device1'})
        self.assertEqual(HTTPStatus.OK, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device set to offline'})

    def test_set_already_offline_device(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='offline')
            db.session.add(device)
            db.session.commit()

        response = self.client.post('/devices/offline', json={'device': 'Device1'})
        self.assertEqual(HTTPStatus.NOT_MODIFIED, response.status_code)

    def test_set_device_to_free(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='offline')
            db.session.add(device)
            db.session.commit()

        response = self.client.post('/devices/online', json={'device': 'Device1'})
        self.assertEqual(HTTPStatus.OK, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device set to available'})

    def test_set_already_free_device(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='free')
            db.session.add(device)
            db.session.commit()

        response = self.client.post('/devices/online', json={'device': 'Device1'})
        self.assertEqual(HTTPStatus.NOT_MODIFIED, response.status_code)

    def test_set_nonexistent_device_to_offline(self):
        response = self.client.post('/devices/offline', json={'device': 'NonExistentDevice'})
        self.assertEqual(HTTPStatus.NOT_FOUND, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device not found'})

    def test_set_nonexistent_device_to_free(self):
        response = self.client.post('/devices/online', json={'device': 'NonExistentDevice'})
        self.assertEqual(HTTPStatus.NOT_FOUND, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device not found'})


class TestDeleteDevice(BaseTestCase):

    def test_delete_device_missing_param(self):
        response = self.client.delete('/devices/delete/')
        self.assertEqual(HTTPStatus.BAD_REQUEST, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device name missing'})

    def test_delete_device_success(self):
        with app.app_context():
            device = Device(name='Device1', model='Model1', status='free')
            db.session.add(device)
            db.session.commit()

        response = self.client.delete('/devices/delete/Device1')
        self.assertEqual(HTTPStatus.NO_CONTENT, response.status_code)

    def test_delete_nonexistent_device(self):
        response = self.client.delete('/devices/delete/NonExistentDevice')
        self.assertEqual(HTTPStatus.NOT_FOUND, response.status_code)
        self.assertEqual(response.get_json(), {'message': 'Device not found'})


class TestValidation(unittest.TestCase):

    def setUp(self):
        self.app = app.test_client()
        self.app.testing = True

    def test_one_empty_one_missing_param(self):
        # Prepare the request payload with one empty and one missing field
        payload = {
            'device': '',  # Empty field
            # 'model' is missing
        }

        # Make the POST request
        response = self.app.post('/devices/add', json=payload)

        # Check the status code and the JSON response
        self.assertEqual(response.status_code, 400)
        expected_response = {
            'message': 'Missing parameters: model, Empty parameters: device'
        }
        self.assertEqual(response.get_json(), expected_response)


if __name__ == '__main__':
    unittest.main()
