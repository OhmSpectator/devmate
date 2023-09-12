import io
import sys
import unittest
from unittest.mock import patch, Mock
from http import HTTPStatus
from datetime import datetime, timezone

import requests

import devmatecli.client as device_management


class TestServerAccess(unittest.TestCase):

    @patch('requests.get')
    def test_check_server_accessibility(self, mock_get):
        mock_get.return_value.status_code = 200
        self.assertTrue(device_management.check_server_accessibility())

    @patch('requests.get')
    def test_check_server_accessibility_non_200_status(self, mock_get):
        mock_get.return_value.status_code = 400  # Simulating an Internal Server Error
        self.assertTrue(device_management.check_server_accessibility())
        
    @patch('requests.get')
    def test_check_server_accessibility_500_status(self, mock_get):
        mock_get.return_value.status_code = 500  # Simulating an Internal Server Error
        self.assertFalse(device_management.check_server_accessibility())  # Function should return False

    @patch('requests.get')
    def test_check_server_accessibility_not_responding(self, mock_get):
        mock_get.side_effect = requests.ConnectionError()  # Simulating a connection error
        self.assertFalse(device_management.check_server_accessibility())
        

class TestListDevices(unittest.TestCase):

    @patch('requests.get')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_list_devices_found(self, mock_stdout, mock_get):
        mock_get.return_value.status_code = HTTPStatus.OK
        mock_get.return_value.json.return_value = {'devices': [{'name': 'Device1', 'model': 'Model1', 'status': 'free'}]}
        device_management.list_devices()
        expected_output = "Found 1 device:\n    Device1 (Model1) is free\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.get')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_list_devices_not_found(self, mock_stdout, mock_get):
        mock_get.return_value.status_code = HTTPStatus.NO_CONTENT
        device_management.list_devices()
        expected_output = "No devices found.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('devmatecli.client.datetime_now')
    @patch('requests.get')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_list_devices_reserved_by(self, mock_stdout, mock_get, mock_datetime_now):
        mock_datetime_now.return_value = datetime(2021, 1, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
        mock_get.return_value.status_code = HTTPStatus.OK
        mock_get.return_value.json.return_value = {
            'devices': [
                {'name': 'Device1', 'model': 'Model1', 'status': 'reserved', 'user': 'User1',
                'reservation_time': '2021-01-01T00:00:00.000000+00:00'}
            ]
        }
        device_management.list_devices()

        # Match the output including the date and duration strings
        expected_output = "Found 1 device:\n    Device1 (Model1) is reserved by User1 01.01.2021 01:00:00 (an hour by now)\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.get')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_list_devices_handle_unexpected(self, mock_stdout, mock_get):
        mock_get.return_value.status_code = 418  # An unexpected status code
        device_management.list_devices()
        expected_output = "Unexpected status code 418\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)


class TestReserveDevice(unittest.TestCase):

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_reserve_device_success(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.OK
        device_management.reserve_device('Device1', 'User1')
        expected_output = "Device successfully reserved.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_reserve_device_already_reserved(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.CONFLICT
        mock_post.return_value.json.return_value = {'reserved_by': 'User2'}
        device_management.reserve_device('Device1', 'User1')
        expected_output = "Device is already reserved by User2.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_reserve_device_not_found(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.NOT_FOUND
        device_management.reserve_device('Device1', 'User1')
        expected_output = "The specified device does not exist.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_reserve_device_missing_params(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.BAD_REQUEST
        device_management.reserve_device(None, 'User1')
        expected_output = "Bad request. Please check if the device and username parameters are correct.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_reserve_device_empty_username(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.BAD_REQUEST
        device_management.reserve_device('Device1', '')
        expected_output = "Bad request. Please check if the device and username parameters are correct.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_reserve_device_unexpected_status(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = 418  # An unexpected status code
        device_management.reserve_device('Device1', 'User1')
        expected_output = "Unexpected status code 418\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)


class TestReleaseDevice(unittest.TestCase):

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_release_device_success(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.OK
        device_management.release_device('Device1')
        expected_output = "Device successfully released.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_release_device_not_reserved(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.NOT_MODIFIED
        device_management.release_device('Device1')
        expected_output = "Device is not currently reserved.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_release_device_not_found(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.NOT_FOUND
        device_management.release_device('Device1')
        expected_output = "The specified device does not exist.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_release_device_missing_params(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.BAD_REQUEST
        device_management.release_device(None)
        expected_output = "Bad request. Please check if the device parameter is correct.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_release_device_unexpected_status(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = 418  # An unexpected status code
        device_management.release_device('Device1')
        expected_output = "Unexpected status code 418\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)


class TestAddDevice(unittest.TestCase):

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_add_device_success(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.CREATED
        device_management.add_device('Device1', 'Model1')
        expected_output = "Device successfully added.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_add_device_already_exists(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.CONFLICT
        device_management.add_device('Device1', 'Model1')
        expected_output = "A device with this name already exists.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_add_device_missing_params(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.BAD_REQUEST
        device_management.add_device(None, 'Model1')
        expected_output = "Bad request. Please check if the device and model parameters are correct.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_add_device_empty_model(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.BAD_REQUEST
        device_management.add_device('Device1', '')
        expected_output = "Bad request. Please check if the device and model parameters are correct.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_add_device_unexpected_status(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = 418  # An unexpected status code
        device_management.add_device('Device1', 'Model1')
        expected_output = "Unexpected status code 418\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)


class TestSetDeviceOffline(unittest.TestCase):

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_offline_success(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.OK
        device_management.set_device_offline('Device1')
        expected_output = "Device successfully set to offline.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_offline_already_offline(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.NOT_MODIFIED
        device_management.set_device_offline('Device1')
        expected_output = "Device is already offline.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_offline_not_found(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.NOT_FOUND
        device_management.set_device_offline('Device1')
        expected_output = "The specified device does not exist.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_offline_missing_params(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.BAD_REQUEST
        device_management.set_device_offline(None)
        expected_output = "Bad request. Please check if the device parameter is correct.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_offline_unexpected_status(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = 418  # An unexpected status code
        device_management.set_device_offline('Device1')
        expected_output = "Unexpected status code 418\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)


class TestSetDeviceOnline(unittest.TestCase):

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_online_success(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.OK
        device_management.set_device_online('Device1')
        expected_output = "Device successfully set to online.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_online_already_online(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.NOT_MODIFIED
        device_management.set_device_online('Device1')
        expected_output = "Device is already online.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_online_not_found(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.NOT_FOUND
        device_management.set_device_online('Device1')
        expected_output = "The specified device does not exist.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_online_missing_params(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = HTTPStatus.BAD_REQUEST
        device_management.set_device_online(None)
        expected_output = "Bad request. Please check if the device parameter is correct.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.post')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_set_device_online_unexpected_status(self, mock_stdout, mock_post):
        mock_post.return_value.status_code = 418  # An unexpected status code
        device_management.set_device_online('Device1')
        expected_output = "Unexpected status code 418\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)


class TestDeleteDevice(unittest.TestCase):

    @patch('requests.delete')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_delete_device_success(self, mock_stdout, mock_delete):
        mock_delete.return_value.status_code = HTTPStatus.NO_CONTENT
        device_management.delete_device('Device1')
        expected_output = "Device successfully deleted.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.delete')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_delete_device_not_found(self, mock_stdout, mock_delete):
        mock_delete.return_value.status_code = HTTPStatus.NOT_FOUND
        device_management.delete_device('Device1')
        expected_output = "The specified device does not exist.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.delete')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_delete_device_missing_params(self, mock_stdout, mock_delete):
        mock_delete.return_value.status_code = HTTPStatus.BAD_REQUEST
        device_management.delete_device(None)
        expected_output = "Bad request. Please check if the device parameter is correct.\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)

    @patch('requests.delete')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_delete_device_unexpected_status(self, mock_stdout, mock_delete):
        mock_delete.return_value.status_code = 418  # An unexpected status code
        device_management.delete_device('Device1')
        expected_output = "Unexpected status code 418\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)


class TestHandleUnexpectedStatus(unittest.TestCase):

    @patch('sys.stdout', new_callable=io.StringIO)
    def test_handle_unexpected_status(self, mock_stdout):
        mock_response = Mock()
        mock_response.status_code = 418  # An unexpected status code
        device_management.handle_unexpected_status(mock_response)
        expected_output = "Unexpected status code 418\n"
        self.assertEqual(mock_stdout.getvalue(), expected_output)


class TestClient(unittest.TestCase):

    @patch('sys.exit')
    @patch('devmatecli.client.check_server_accessibility')
    @patch('sys.stdout', new_callable=io.StringIO)
    def test_server_not_accessible(self, mock_stdout, mock_check_server_accessibility, mock_exit):
        mock_check_server_accessibility.return_value = False
        mock_exit.side_effect = SystemExit(1)
        with patch.object(sys, 'argv', ['client.py']):
            try:
                device_management.main()
            except SystemExit:
                pass

        mock_exit.assert_called_once_with(1)
        self.assertEqual(mock_stdout.getvalue(),
                         "Server is not accessible. Please check your connection and try again.\n")

    @patch('devmatecli.client.check_server_accessibility')
    @patch('sys.exit')
    @patch('sys.stdout', new_callable=io.StringIO)
    @patch('devmatecli.client.argparse.ArgumentParser.parse_args')
    def test_no_command_provided(self, mock_parse_args, mock_stdout, mock_exit, mock_check_server_accessibility):
        mock_check_server_accessibility.return_value = True
        mock_parse_args.return_value = Mock(command=None)  # Simulate no command provided
        with patch.object(sys, 'argv', ['client.py']):
            device_management.main()
        mock_exit.assert_called_once_with(1)
        self.assertTrue("Device Management CLI" in mock_stdout.getvalue())  # Check that help message is printed



class TestClientCommands(unittest.TestCase):
    @patch('devmatecli.client.check_server_accessibility')
    @patch('devmatecli.client.list_devices')
    def test_list_command(self, mock_list_devices, mock_check_server_accessibility):
        mock_check_server_accessibility.return_value = True
        with patch.object(sys, 'argv', ['client.py', 'list']):
            device_management.main()  # Assuming your main part is in a function called main
        mock_list_devices.assert_called_once()

    @patch('devmatecli.client.reserve_device')
    @patch('devmatecli.client.check_server_accessibility')
    def test_reserve_command(self, mock_check_server_accessibility, mock_reserve_device):
        mock_check_server_accessibility.return_value = True
        with patch.object(sys, 'argv', ['client.py', 'reserve', 'device1', '--user', 'user1']):
            device_management.main()
        mock_reserve_device.assert_called_once_with('device1', 'user1')

    @patch('os.getlogin')
    @patch('devmatecli.client.reserve_device')
    @patch('devmatecli.client.check_server_accessibility')
    def test_reserve_command_no_user(self, mock_check_server_accessibility, mock_reserve_device, mock_getlogin):
        mock_check_server_accessibility.return_value = True
        mock_getlogin.return_value = 'os_user'
        with patch.object(sys, 'argv', ['client.py', 'reserve', 'device1']):
            device_management.main()
        mock_reserve_device.assert_called_once_with('device1', 'os_user')

    @patch('devmatecli.client.release_device')
    @patch('devmatecli.client.check_server_accessibility')
    def test_release_command(self, mock_check_server_accessibility, mock_release_device):
        mock_check_server_accessibility.return_value = True
        with patch.object(sys, 'argv', ['client.py', 'release', 'device1']):
            device_management.main()
        mock_release_device.assert_called_once_with('device1')

    @patch('devmatecli.client.add_device')
    @patch('devmatecli.client.check_server_accessibility')
    def test_add_command(self, mock_check_server_accessibility, mock_add_device):
        mock_check_server_accessibility.return_value = True
        with patch.object(sys, 'argv', ['client.py', 'add', 'device1', '--model', 'model1']):
            device_management.main()
        mock_add_device.assert_called_once_with('device1', 'model1')
        
    @patch('devmatecli.client.delete_device')
    @patch('devmatecli.client.check_server_accessibility')
    def test_delete_command(self, mock_check_server_accessibility, mock_delete_device):
        mock_check_server_accessibility.return_value = True
        with patch.object(sys, 'argv', ['client.py', 'delete', 'device1']):
            device_management.main()
        mock_delete_device.assert_called_once_with('device1')

    @patch('devmatecli.client.set_device_offline')
    @patch('devmatecli.client.check_server_accessibility')
    def test_offline_command(self, mock_check_server_accessibility, mock_set_device_offline):
        mock_check_server_accessibility.return_value = True
        with patch.object(sys, 'argv', ['client.py', 'offline', 'device1']):
            device_management.main()
        mock_set_device_offline.assert_called_once_with('device1')

    @patch('devmatecli.client.set_device_online')
    @patch('devmatecli.client.check_server_accessibility')
    def test_online_command(self, mock_check_server_accessibility, mock_set_device_online):
        mock_check_server_accessibility.return_value = True
        with patch.object(sys, 'argv', ['client.py', 'online', 'device1']):
            device_management.main()
        mock_set_device_online.assert_called_once_with('device1')


if __name__ == '__main__':
    unittest.main()
