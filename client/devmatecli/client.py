import argparse
import os
import requests
import sys
from datetime import datetime, timezone
import humanize

DEVMATE_ADDRESS = os.environ.get('DEVMATE_ADDRESS', 'devmate.zededa.net')
DEVMATE_PORT = os.environ.get('DEVMATE_PORT', '8001')

BASE_URL = f"http://{DEVMATE_ADDRESS}:{DEVMATE_PORT}"


def handle_unexpected_status(response):
    print(f"Unexpected status code {response.status_code}")


def check_server_accessibility():
    try:
        response = requests.get(f"{BASE_URL}/health")
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
    response = requests.get(f"{BASE_URL}/devices/list")
    if response.status_code == 200:
        devices = response.json().get('devices', [])
        print(f"Found {len(devices)} device{'s' if len(devices) != 1 else ''}:")
        for device in devices:
            status = device.get('status')
            reserved_by = device.get('user')
            if status == 'reserved' and reserved_by:
                # Assuming that the reservation time is in UTC
                utc_time = datetime.fromisoformat(device.get('reservation_time')).replace(tzinfo=timezone.utc)
                # Convert to local time
                local_time = utc_time.astimezone()
                # Format as a string
                reserved_at = local_time.strftime("%d.%m.%Y %H:%M:%S")
                # For how long the device is reserved
                reserved_for = datetime_now() - utc_time
                reserved_for = humanize.naturaldelta(reserved_for)
                print(f"    {device.get('name')} ({device.get('model')}) is {status} by {reserved_by} {reserved_at} ({reserved_for} by now)")
            else:
                print(f"    {device.get('name')} ({device.get('model')}) is {status}")
    elif response.status_code == 204:
        print("No devices found.")
    else:
        handle_unexpected_status(response)


def reserve_device(device_name, username):
    payload = {'device': device_name, 'username': username}
    response = requests.post(f"{BASE_URL}/devices/reserve", json=payload)
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
    response = requests.post(f"{BASE_URL}/devices/release", json=payload)
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
    response = requests.post(f"{BASE_URL}/devices/add", json=payload)
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
    response = requests.post(f"{BASE_URL}/devices/offline", json=payload)
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
    response = requests.post(f"{BASE_URL}/devices/online", json=payload)
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
    response = requests.delete(f"{BASE_URL}/devices/delete/{device_name}")
    if response.status_code == 204:
        print("Device successfully deleted.")
    elif response.status_code == 404:
        print("The specified device does not exist.")
    elif response.status_code == 400:
        print("Bad request. Please check if the device parameter is correct.")
    else:
        handle_unexpected_status(response)


def main():
    if not check_server_accessibility():
        print("Server is not accessible. Please check your connection and try again.")
        sys.exit(1)

    parser = argparse.ArgumentParser(description="Device Management CLI")

    subparsers = parser.add_subparsers(dest="command", help="Available commands")

    # List Devices
    list_parser = subparsers.add_parser("list", help="List all devices")

    # Reserve Device
    reserve_parser = subparsers.add_parser("reserve", help="Reserve a device")
    reserve_parser.add_argument("device", help="Name of the device to reserve")
    # Set the default value for --user to the current username
    reserve_parser.add_argument("--user", default=os.getlogin(), help="Username of the user reserving the device")

    # Release Device
    release_parser = subparsers.add_parser("release", help="Release a reserved device")
    release_parser.add_argument("device", help="Name of the device to release")

    # Add Device
    add_parser = subparsers.add_parser("add", help="Add a new device")
    add_parser.add_argument("device", help="Name of the new device")
    add_parser.add_argument("--model", required=True, help="Model of the new device")

    # Set Device to Offline
    offline_parser = subparsers.add_parser("offline", help="Set a device to offline mode")
    offline_parser.add_argument("device", help="Name of the device to set to offline")

    # Return Device from Offline
    online_parser = subparsers.add_parser("online", help="Set a device back to free")
    online_parser.add_argument("device", help="Name of the device to set to available")

    # Delete Device
    delete_parser = subparsers.add_parser("delete", help="Delete a device")
    delete_parser.add_argument("device", help="Name of the device to delete")

    args = parser.parse_args()

    if args.command is None:
        parser.print_help()
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
