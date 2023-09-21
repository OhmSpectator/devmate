import argparse
import json
import os
import requests
import sys
from datetime import datetime, timezone
import humanize
from prettytable import PrettyTable
import warnings
import urllib3


# Class to handle the server address and port
class DevmateServer(object):
    def __init__(self, address, port):
        self.address = address if address else os.environ.get('DEVMATE_ADDRESS', 'localhost')
        self.port = port if port else os.environ.get('DEVMATE_PORT', '8080')
        self.protocol = os.environ.get('DEVMATE_PROTOCOL', 'http')

    @property
    def base_url(self):
        return f"{self.protocol}://{self.address}:{self.port}"


devmate_server = DevmateServer(None, None)


def save_config(protocol, addr, port):
    config_path = get_config_path()
    with open(config_path, 'w') as f:
        json.dump({'address': addr, 'port': port, 'protocol': protocol}, f)


def load_config():
    config_path = get_config_path()
    if os.path.exists(config_path):
        with open(config_path, 'r') as f:
            config = json.load(f)
            devmate_server.address = config.get('address')
            devmate_server.port = config.get('port')
            devmate_server.protocol = config.get('protocol')
            return True
    return None


def get_config_path():
    home = os.path.expanduser("~")
    config_folder = ".devmateconfg"
    if os.name == 'nt':  # For Windows
        config_folder = "devmateconfg"
    config_path = os.path.join(home, config_folder, 'config.json')
    if not os.path.exists(os.path.dirname(config_path)):
        os.makedirs(os.path.dirname(config_path))
    return config_path


def configure(protocol, address, port):
    save_config(protocol, address, port)
    print(f"Configuration saved. Port: {protocol}, Address: {address}, Port: {port}")


def handle_unexpected_status(response):
    print(f"Unexpected status code {response.status_code}")


def do_api_call(method, endpoint, payload=None):
    warnings.filterwarnings("ignore", category=urllib3.exceptions.InsecureRequestWarning)
    try:
        if method == 'get':
            return requests.get(f"{devmate_server.base_url}/{endpoint}", verify=False)
        elif method == 'post':
            return requests.post(f"{devmate_server.base_url}/{endpoint}", json=payload, verify=False)
        elif method == 'delete':
            return requests.delete(f"{devmate_server.base_url}/{endpoint}", verify=False)
        else:
            raise ValueError(f"Invalid method {method}")
    finally:
        warnings.resetwarnings()


def check_server_accessibility():
    try:
        response = do_api_call('get', 'health')
        if response.status_code != 200:
            # Check that it's not one of 5** errors
            if response.status_code // 100 == 5:
                return False
            print(f"Server is accessible, though returned status code {response.status_code}.")
        return True
    except requests.ConnectionError as e:
        print(f"Server is not accessible. Error: {e}")
        return False


# Use this function, so we can mock it in tests
# The problem is that datetime.now() is not mockable alone
def datetime_now():
    return datetime.now(timezone.utc)


def list_devices():
    response = do_api_call('get', 'devices/list')
    if response.status_code == 200:
        devices = response.json().get('devices', [])

        # Create a table object
        table = PrettyTable()
        table.field_names = ["Name", "Model", "Status", "Reserved By", "Reserved At", "Reserved For"]

        for device in devices:
            status = device.get('status')
            reserved_by = device.get('user')
            reserved_at = ""
            reserved_for = ""
            if status == 'reserved' and reserved_by:
                # Assuming that the reservation time is in UTC
                utc_time = datetime.fromisoformat(device.get('reservation_time')).replace(tzinfo=timezone.utc)
                # Convert to local time
                local_time = utc_time.astimezone()
                # Format as a string
                reserved_at = local_time.strftime("%d.%m.%Y %H:%M:%S")
                # For how long the device is reserved
                reserved_for = datetime_now() - utc_time
                reserved_for = humanize.naturaldelta(reserved_for) + " by now"

            table.add_row(
                [device.get('name'), device.get('model'), status, reserved_by or "", reserved_at, reserved_for])

        print(table)
    elif response.status_code == 204:
        print("No devices found.")
    else:
        handle_unexpected_status(response)


def reserve_device(device_name, username):
    payload = {'device': device_name, 'username': username}
    response = do_api_call('post', 'devices/reserve', payload=payload)
    if response.status_code == 200:
        print("Device successfully reserved.")
    elif response.status_code == 409:
        print(f"Device is already reserved by {response.json().get('reserved_by')}.")
    elif response.status_code == 404:
        print("The specified device does not exist.")
    elif response.status_code == 400:
        print("Bad request. Please check if the device and username parameters are correct.")
    else:
        handle_unexpected_status(response)


def release_device(device_name):
    payload = {'device': device_name}
    response = do_api_call('post', 'devices/release', payload=payload)
    if response.status_code == 200:
        print("Device successfully released.")
    elif response.status_code == 304:
        print("Device is not currently reserved.")
    elif response.status_code == 404:
        print("The specified device does not exist.")
    elif response.status_code == 400:
        print("Bad request. Please check if the device parameter is correct.")
    else:
        handle_unexpected_status(response)


def add_device(device_name, model):
    payload = {'device': device_name, 'model': model}
    response = do_api_call('post', 'devices/add', payload=payload)
    if response.status_code == 201:
        print("Device successfully added.")
    elif response.status_code == 409:
        print("A device with this name already exists.")
    elif response.status_code == 400:
        print("Bad request. Please check if the device and model parameters are correct.")
    else:
        handle_unexpected_status(response)


def set_device_offline(device_name):
    payload = {'device': device_name}
    response = do_api_call('post', 'devices/offline', payload=payload)
    if response.status_code == 200:
        print("Device successfully set to offline.")
    elif response.status_code == 304:
        print("Device is already offline.")
    elif response.status_code == 404:
        print("The specified device does not exist.")
    elif response.status_code == 400:
        print("Bad request. Please check if the device parameter is correct.")
    else:
        handle_unexpected_status(response)


def set_device_online(device_name):
    payload = {'device': device_name}
    response = do_api_call('post', 'devices/online', payload=payload)
    if response.status_code == 200:
        print("Device successfully set to online.")
    elif response.status_code == 304:
        print("Device is already online.")
    elif response.status_code == 400:
        print("Bad request. Please check if the device parameter is correct.")
    elif response.status_code == 404:
        print("The specified device does not exist.")
    else:
        handle_unexpected_status(response)


def delete_device(device_name):
    response = do_api_call('delete', f'devices/delete/{device_name}')
    if response.status_code == 204:
        print("Device successfully deleted.")
    elif response.status_code == 404:
        print("The specified device does not exist.")
    elif response.status_code == 400:
        print("Bad request. Please check if the device parameter is correct.")
    else:
        handle_unexpected_status(response)


def main():
    parser = argparse.ArgumentParser(
        description="Device Management CLI: A tool for managing, reserving, and monitoring devices."
    )
    subparsers = parser.add_subparsers(
        dest="command",
        help="Available commands. Use '<command> --help' for more information on each command."
    )

    list_parser = subparsers.add_parser(
        "list",
        help="Lists all available and reserved devices.",
        usage="list"
    )

    reserve_parser = subparsers.add_parser(
        "reserve",
        help="Reserve a device for use.",
        usage="reserve <device> [--user]",
    )
    reserve_parser.add_argument("device")
    reserve_parser.add_argument("--user", default=os.getlogin())

    release_parser = subparsers.add_parser(
        "release",
        help="Release a previously reserved device.",
        usage="release <device>"
    )
    release_parser.add_argument("device")

    add_parser = subparsers.add_parser(
        "add",
        help="Add a new device to the management system.",
        usage="add <device> --model"
    )
    add_parser.add_argument("device")
    add_parser.add_argument("--model", required=True)

    offline_parser = subparsers.add_parser(
        "offline",
        help="offline <device>. Set a device to offline mode.",
        usage="offline <device>"
    )
    offline_parser.add_argument("device")

    online_parser = subparsers.add_parser(
        "online",
        help="Set an offline device back to available mode.",
        usage="online <device>"
    )
    online_parser.add_argument("device")

    delete_parser = subparsers.add_parser(
        "delete",
        help="Permanently remove a device from the management system.",
        usage="delete <device>"
    )
    delete_parser.add_argument("device")

    config_parser = subparsers.add_parser(
        'configure',
        help='Configure the server protocol, address, and port. Must be run before using other commands.',
        usage='configure --protocol --address --port'
    )
    config_parser.add_argument('--protocol', required=True)
    config_parser.add_argument('--address', required=True)
    config_parser.add_argument('--port', required=True)

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
        sys.exit(1)

    if args.command == 'configure':
        configure(args.protocol, args.address, args.port)

    if not load_config():
        print("Server protocol, address, and port are not configured. Please run 'devmate configure' first.")
        sys.exit(1)

    if not check_server_accessibility():
        print("Server is not accessible. Please check your connection and try again.")
        sys.exit(1)

    if args.command == "list":
        list_devices()
    elif args.command == "reserve":
        reserve_device(args.device, args.user)
    elif args.command == "release":
        release_device(args.device)
    elif args.command == "add":
        add_device(args.device, args.model)
    elif args.command == "offline":
        set_device_offline(args.device)
    elif args.command == "online":
        set_device_online(args.device)
    elif args.command == "delete":
        delete_device(args.device)


if __name__ == "__main__":
    main()
