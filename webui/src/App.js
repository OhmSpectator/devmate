import React, { useState, useEffect } from 'react';

import { Box, Snackbar } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import axios from 'axios';

import moment from 'moment';
import 'moment-duration-format';

import AddDeviceSection from "./AddDeviceSection";
import DevicesList from "./DevicesList";


const theme = createTheme({});

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ device: '', model: '' });
  const [deviceUsernames, setDeviceUsernames] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);

  const showSnackbar = (message) => {
    setStatusMessage(message);
    setOpenSnackbar(true);
  };

  const fetchDevices = async () => {
    try {
      const response = await axios.get(`${backendUrl}/devices/list`);

      if (response.status === 200) {
        console.log("Devices fetched successfully.");
        setDevices(response.data.devices);
      } else if (response.status === 204) {
        console.log('No devices to fetch, but the operation was successful.');
        setDevices([]);
      }

    } catch (error) {
      console.error('Failed to fetch devices:', error);
    }
  };

  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on an unmounted component

    const fetchDevicesRepeatedly = async () => {
      while (isMounted) {
        const newDevices = await fetchDevices();
        if (newDevices && JSON.stringify(newDevices) !== JSON.stringify(devices)) {
          setDevices(newDevices);
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds
      }
    };

    fetchDevicesRepeatedly();

    return () => { isMounted = false }; // Cleanup function
  }, []); // Empty dependency array


  useEffect(() => {
    // Define the interval IDs for each device
    const intervalIds = {};

    // Run once initially to set the timers for existing devices
    devices.forEach(device => {
      if (device.status === 'reserved') {
        intervalIds[device.name] = setInterval(() => {
          setDevices(prevDevices => {
            return prevDevices.map(d => {
              if (d.name === device.name) {
                d.duration = calculateTimeDifference(device.reservation_time); // Update the duration field
              }
              return d;
            });
          });
        }, 1000); // Update every second
      }
    });

    return () => {
      // Clear all intervals when component unmounts
      Object.values(intervalIds).forEach(clearInterval);
    };
  }, [devices]);

  const handleApiCall = async (url, method, payload, successCallback) => {
    try {
      const response = await axios({ method, url, data: payload });
      successCallback(response);
    } catch (error) {
      if (error.response) {
        const errorMessage = `Error: ${error.response.data.message}`;
        console.warn(errorMessage);
        showSnackbar(errorMessage);
      } else {
        const generalError = 'A network error occurred.';
        console.error(generalError, error)
      }
    }
  };

  const handleReserve = async (deviceName) => {
    const localUsername = deviceUsernames[deviceName];
    if(!localUsername) {
      console.warn('Username is required to reserve a device.');
      return;
    }

    try {
      const payload = { device: deviceName, username: localUsername };
      const response = await axios.post(`${backendUrl}/devices/reserve`, payload);

      if (response.status === 200) {
        await fetchDevices();
      }
    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;
        if (statusCode === 409) {
          const reservedBy = error.response.data.reserved_by;
          console.warn(`Device is already reserved by ${reservedBy}`);
        } else if (statusCode === 404) {
          console.warn(`Device ${deviceName} does not exist.`);
        } else if (statusCode === 400) {
          console.error(`Bad request. Missing or empty device or username fields.`);
        }
      } else {
        console.error('An error occurred:', error);
      }
    }
  };

  const handleAction = (actionType, deviceName) => {
    const payload = { device: deviceName };
    handleApiCall(`${backendUrl}/devices/${actionType}`, 'post', payload, fetchDevices).then(r => console.log('Device action performed successfully.'));
  };

  const handleDelete = (deviceName) => {
    handleApiCall(`${backendUrl}/devices/delete/${deviceName}`, 'delete', null, fetchDevices).then(r => console.log('Device deleted successfully.'));
  };


  const handleAddDevice = async () => {
    if (!newDevice.device || !newDevice.model) {
      const errorMessage = 'Device name and model are required to add a new device.';
      console.warn(errorMessage);
      return;
    }

    try {
      const addDeviceResult = await handleApiCall(`${backendUrl}/devices/add`, 'post', {device: newDevice.device, model: newDevice.model}, fetchDevices);
      if (addDeviceResult && addDeviceResult.status === 201) {
        console.log('Device added successfully.');
      }
      setNewDevice({device: '', model: ''});
    } catch (error) {
      console.error("An error occurred:", error);
    }
  };

  const handleUsernameChange = (event, deviceName) => {
    setDeviceUsernames({
      ...deviceUsernames,
      [deviceName]: event.target.value,
    });
  };

  const handleRelease = (deviceName) => {
    handleUsernameChange({target: {value: ''}}, deviceName);
    handleAction('release', deviceName);
  }

  const handleOnline = (deviceName) => {
    handleUsernameChange({target: {value: ''}}, deviceName);
    handleAction('online', deviceName);
  }

  const calculateTimeDifference = (reservation_time) => {
    const now = moment(); // local time
    const reservedTime = moment.utc(reservation_time).local(); // convert UTC to local time
    const duration = moment.duration(now.diff(reservedTime));

    return duration.format("d [days] h [hrs] m [min] s [sec]");
  };

  return (
      <>
        <Box m={3}>
          <h1>Device Management System</h1>
          <h2>Available Devices</h2>
          <DevicesList
                devices={devices}
                deviceUsernames={deviceUsernames}
                handleUsernameChange={handleUsernameChange}
                handleReserve={handleReserve}
                handleRelease={handleRelease}
                handleOnline={handleOnline}
                handleDelete={handleDelete}
                handleAction={handleAction}
          />
          <AddDeviceSection
                newDevice={newDevice}
                setNewDevice={setNewDevice}
                handleAddDevice={handleAddDevice}
          />
          <Snackbar
              open={openSnackbar}
              onClose={() => setOpenSnackbar(false)}
              message={<span>{statusMessage}</span>}
              autoHideDuration={5000}
          />
        </Box>
      </>
  );
};

// Wrap the App component with ThemeProvider
const WrappedApp = () => (
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);

export default WrappedApp;
