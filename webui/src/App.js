import React, { useState, useEffect } from 'react';

import {Box, Snackbar, CssBaseline} from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';

import axios from 'axios';

import 'moment-duration-format';

import AddDeviceSection from "./AddDeviceSection";
import DevicesList from "./DevicesList";
import {calculateTimeDiff} from "./DeviceRow";


const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: "#1f1d1d",
      paper: "#1e1e1e",
    },
    primary: {
      main: "#4b86b4",  // Soft Blue
      contrastText: "#e8e8e8",
    },
    secondary: {
      main: "#d76f6f",  // Soft Pink
      contrastText: "#e8e8e8",
    },
    text: {
      primary: "#a4a4a4",  // Off-white
      secondary: "#7e7e7e",  // Gray
    },
    error: {
      main: "#ff1744",  // Bright Red
    },
    warning: {
      main: "#ff9800",  // Orange
    },
    success: {
      main: "#4caf50",  // Green
    },
  }
})

const backendUrl = process.env.REACT_APP_DEVMATE_BACKEND_URL || 'http://localhost:8000';


const App = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({device: '', model: ''});
  const [deviceUsernames, setDeviceUsernames] = useState({});
  const [statusMessage, setStatusMessage] = useState('');
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [backendAvailable, setBackendAvailable] = useState(true);

  const handleUsernameChange = (event, deviceName) => {
    setDeviceUsernames({
      ...deviceUsernames,
      [deviceName]: event.target.value,
    });
  };

  useEffect(() => {
    let isMounted = true; // Flag to prevent state update on an unmounted component

    const fetchDevicesRepeatedly = async () => {
      while (isMounted) {
        const newDevices = await handleList();
        if (newDevices && JSON.stringify(newDevices) !== JSON.stringify(devices)) {
          setDevices(newDevices);
        }

        await new Promise(resolve => setTimeout(resolve, 10000)); // Wait for 10 seconds
      }
    };
    fetchDevicesRepeatedly();
    return () => {
      isMounted = false
    }; // Cleanup function
  }, []);


  useEffect(() => {
    // Define a single interval ID
    let intervalId;

    // Function to update devices
    const updateDevices = () => {
      setDevices(prevDevices => {
        return prevDevices.map(device => {
          if (device.status === 'reserved') {
            device.duration = calculateTimeDiff(device.reservation_time); // Update the duration field
          }
          return device;
        });
      });
    };

    // Run once initially to set the timers for existing devices
    updateDevices();

    // Setup single interval for all devices
    intervalId = setInterval(updateDevices, 1000); // Update every second

    return () => {
      // Clear interval when component unmounts
      clearInterval(intervalId);
    };
  }, [devices]);

  const showSnackbar = (message) => {
    setStatusMessage(message);
    setOpenSnackbar(true);

  };

  const handleApiCall = async (endpoint, method, payload) => {
    const url = `${backendUrl}${endpoint}`
    return axios({method: method, url: url, data: payload})
  };

  const handleHealth = async () => {
    const handleError = (error) => {
      console.error('An error occurred:', error);
      if (backendAvailable) {
        showSnackbar('Backend is not available.');
        console.log("Backend URL:", backendUrl);
      }
      setBackendAvailable(false)
    }
    const handleSuccess = async (response) => {
      switch (response.status) {
        case 200:
          console.log("Backend is healthy.");
          setBackendAvailable(true);
          break;
        default:
          console.warn('Unexpected response status:', response.status);
      }
    }
    handleApiCall(`/health`, 'get', null).then(handleSuccess).catch(handleError)
  }

  const handleList = async () => {
    const handleError = (error) => {
      //console.error('An error occurred:', error);
      handleHealth();
    }

    const handleSuccess = async (response) => {
      switch (response.status) {
        case 200:
          console.log("Devices fetched successfully.");
          setDevices(response.data.devices);
          break;
        case 204:
          console.log('No devices to fetch, but the operation was successful.');
          setDevices([]);
          break;
        default:
          console.warn('Unexpected response status:', response.status);
      }
      setBackendAvailable(true);
    }
    handleApiCall(`/devices/list`, 'get', null).then(handleSuccess).catch(handleError)
  };

  const handleAddDevice = async () => {
    const handleError = (error) => {
      if (error.response) {
        const statusCode = error.response.status;
        switch (statusCode) {
          case 400:
            console.warn(`Bad request. Missing or empty device or model fields.`);
            break;
          case 409:
            console.warn(`Device ${newDevice.device} already exists.`);
            showSnackbar(`Device ${newDevice.device} already exists.`);
            break;
          default:
            console.error('An error occurred:', error);
        }
      } else {
        console.error('An error occurred:', error);
        handleHealth();
      }
    }

    const handleSuccess = async (response) => {
      switch (response.status) {
        case 201:
          console.log('Device added successfully.');
          break;
        default:
          console.warn('Unexpected response status:', response.status);
      }
      setNewDevice({device: '', model: ''});
      await handleList();
    }

    if (!newDevice.device || !newDevice.model) {
      console.warn('Device name and model are required to add a new device.');
      return;
    }


    const payload = {device: newDevice.device, model: newDevice.model};
    await handleApiCall(`/devices/add`, 'post', payload).then(handleSuccess).catch(handleError);
  };


  const handleReserve = async (deviceName) => {
    const handleError = (error) => {
      if (error.response) {
        const statusCode = error.response.status;
        switch (statusCode) {
          case 400:
            console.warn(`Bad request. Missing or empty device or username fields.`);
            break;
          case 404:
            console.warn(`Device ${deviceName} does not exist.`);
            showSnackbar(`Device ${deviceName} does not exist.`);
            break;
          case 409:
            const reservedBy = error.response.data.reserved_by;
            console.warn(`Device is already reserved by ${reservedBy}`);
            showSnackbar(`Device is already reserved by ${reservedBy}`);
            break;
          default:
            console.error('An error occurred:', error);
        }
      } else {
        console.error('An error occurred:', error);
        handleHealth();
      }
    }

    const handleSuccess = async (response) => {
      switch (response.status) {
        case 200:
            console.log('Device reserved successfully.');
            break;
        default:
            console.warn('Unexpected response status:', response.status);
      }
      await handleList();
    }

    const localUsername = deviceUsernames[deviceName];

    if (!localUsername) {
      console.warn('Username is required to reserve a device.');
      return;
    }

    const payload = {device: deviceName, username: localUsername};

    await handleApiCall(`/devices/reserve`, 'post', payload, handleSuccess, handleError).then(handleSuccess).catch(handleError);
  };

  const handleRelease = (deviceName) => {
    const handleError = (error) => {
      if (error.response) {
        const statusCode = error.response.status;
        switch (statusCode) {
          case 304:
            console.warn(`Device ${deviceName} is not reserved.`);
            showSnackbar(`Device ${deviceName} is not reserved.`);
            break;
          case 400:
            console.warn(`Bad request. Missing or empty device field.`);
            break;
          case 404:
            console.warn(`Device ${deviceName} does not exist.`);
            showSnackbar(`Device ${deviceName} does not exist.`);
            break;
          default:
            console.error('An error occurred:', error);
        }
      } else {
        console.error('An error occurred:', error);
        handleHealth();
      }
    }

    const handleSuccess = async (response) => {
      switch (response.status) {
        case 200:
          console.log('Device released successfully.');
          break;
        default:
          console.warn('Unexpected response status:', response.status);
      }
      await handleList();
    }

    handleUsernameChange({target: {value: ''}}, deviceName);

    const payload = {device: deviceName};
    handleApiCall(`/devices/release`, 'post', payload).then(handleSuccess).catch(handleError);
  }

  const handleOffline = (deviceName) => {
    const handleError = (error) => {
      if (error.response) {
        switch (error.response.status) {
          case 304:
            console.warn(`Device ${deviceName} is already offline.`);
            showSnackbar(`Device ${deviceName} is already offline.`);
            break;
          case 400:
            console.warn(`Bad request. Missing or empty device or username fields.`);
            break;
          case 404:
            console.warn(`Device ${deviceName} does not exist.`);
            showSnackbar(`Device ${deviceName} does not exist.`);
            break;
          default:
            console.error('An error occurred:', error);
        }
      } else {
        console.error('An error occurred:', error);
        handleHealth();
      }
    }

    const handleSuccess = async (response) => {
      switch (response.status) {
        case 200:
            console.log('Device set to offline successfully.');
            break;
        default:
            console.warn('Unexpected response status:', response.status);
      }
      await handleList();
    }

    const payload = {device: deviceName};

    handleApiCall(`/devices/offline`, 'post', payload).then(handleSuccess).catch(handleError);
  }

  const handleOnline = (deviceName) => {
    const handleError = (error) => {
      if (error.response) {
        switch (error.response.status) {
          case 304:
            console.warn(`Device ${deviceName} is already online.`);
            showSnackbar(`Device ${deviceName} is already online.`);
            break;
          case 400:
            console.warn(`Bad request. Missing or empty device or username fields.`);
            break;
          case 404:
            console.warn(`Device ${deviceName} does not exist.`);
            showSnackbar(`Device ${deviceName} does not exist.`);
            break;
          default:
            console.error('An error occurred:', error);
        }
      } else {
        console.error('An error occurred:', error);
        handleHealth();
      }
    }

    const handleSuccess = async (response) => {
      switch (response.status) {
        case 200:
          console.log('Device set to online successfully.');
          break;
        default:
          console.warn('Unexpected response status:', response.status);
      }
      await handleList();
    }

    handleUsernameChange({target: {value: ''}}, deviceName);

    const payload = {device: deviceName};
    handleApiCall(`/devices/online`, 'post', payload).then(handleSuccess).catch(handleError);
  }

  const handleDelete = async (deviceName) => {
    const handleError = (error) => {
      if (error.response) {
        switch (error.response.status) {
          case 400:
            console.warn(`Bad request. Missing or empty device field.`);
            break;
          case 404:
            console.warn(`Device ${deviceName} does not exist.`);
            showSnackbar(`Device ${deviceName} does not exist.`);
            break;
          default:
            console.error('An error occurred:', error);
        }
      } else {
        console.error('An error occurred:', error);
        handleHealth();
      }
    }

    const handleSuccess = async (response) => {
        switch (response.status) {
          case 204:
            console.log('Device deleted successfully.');
            break;
          default:
            console.warn('Unexpected response status:', response.status);
        }
        await handleList();
    }
    await handleApiCall(`/devices/delete/${deviceName}`, 'delete', null).then(handleSuccess).catch(handleError);
  };


  return (
      <Box m={3}>
        <div style={{position: 'relative'}}>
          <div className={backendAvailable ? '' : 'faded'}>
            <h1>Device Management System</h1>
            <h2>Available Devices</h2>
            <DevicesList
                devices={devices}
                deviceUsernames={deviceUsernames}
                handleUsernameChange={handleUsernameChange}
                handleReserve={handleReserve}
                handleRelease={handleRelease}
                handleOnline={handleOnline}
                handleOffline={handleOffline}
                handleDelete={handleDelete}
            />
            <AddDeviceSection
                newDevice={newDevice}
                setNewDevice={setNewDevice}
                handleAddDevice={handleAddDevice}
            />
          </div>
          {!backendAvailable && (
              <div className="overlay">
                <div>
                  Server is not available
                </div>
              </div>
          )}
        </div>
        <Snackbar
            open={openSnackbar}
            onClose={() => setOpenSnackbar(false)}
            message={<span>{statusMessage}</span>}
            autoHideDuration={5000}
        />
      </Box>
  );
};

// Wrap the App component with ThemeProvider
const WrappedApp = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline /> {/* Normalize CSS */}
    <div style={{ backgroundColor: theme.palette.background.default }}>
    <App />
    </div>
  </ThemeProvider>
);

export default WrappedApp;
