import React, { useState, useEffect } from 'react';
import {
  Button,
  Box,
  Collapse,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
} from '@mui/material';

import axios from 'axios';

import { ThemeProvider, createTheme } from '@mui/material/styles';

const theme = createTheme({
});

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ device: '', model: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [showAddDevice, setShowAddDevice] = useState(false); // New state to handle the collapse
  const [showStatus, setShowStatus] = useState(false);
  const [deviceUsernames, setDeviceUsernames] = useState({});




  const customSetStatusMessage = (message, shouldShow) => {
    setStatusMessage(message);
    setShowStatus(shouldShow);
  };

  const fetchDevices = async () => {
  try {
    const response = await axios.get(`${backendUrl}/devices/list`);

    if (response.status === 200) {
      setDevices(response.data.devices);
      customSetStatusMessage('Devices fetched successfully.', false);
    } else if (response.status === 204) {
      console.log('No devices to fetch, but the operation was successful.');
      customSetStatusMessage('No devices available.', false);
      setDevices([]); // Optionally set devices to an empty array
    }

  } catch (error) {
    console.error('Failed to fetch devices:', error);
    customSetStatusMessage('Failed to fetch devices.', true);
  }
};

  useEffect(() => {
    fetchDevices();
  }, []);

  const handleApiCall = async (url, method, payload, successCallback) => {
    try {
      const response = await axios({ method, url, data: payload });
      successCallback(response);
      customSetStatusMessage(`Operation successful: ${url}`, false);
    } catch (error) {
      if (error.response) {
        const errorMessage = `Error: ${error.response.status} - ${error.response.data.message}`;
        console.warn(errorMessage);
        customSetStatusMessage(errorMessage, true);
      } else {
        const generalError = 'A network error occurred.';
        console.error(generalError);
        customSetStatusMessage(generalError, true);
      }
    }
  };

  const handleReserve = async (deviceName) => {
    const localUsername = deviceUsernames[deviceName];
    if(!localUsername) {
      const errorMessage = 'Username is required to reserve a device.';
      customSetStatusMessage(errorMessage, true);
      return;
    }

    try {
      const payload = { device: deviceName, username: localUsername };
      console.log("username: " + localUsername + " device: " + deviceName);
      const response = await axios.post(`${backendUrl}/devices/reserve`, payload);

      if (response.status === 200) {
        await fetchDevices();
        customSetStatusMessage('Device successfully reserved.', false);
      }
    } catch (error) {
      if (error.response) {
        const statusCode = error.response.status;

        if (statusCode === 409) {
          const reservedBy = error.response.data.reserved_by;
          customSetStatusMessage(`Device is already reserved by ${reservedBy}`, true);
        } else if (statusCode === 404) {
          customSetStatusMessage('Specified device does not exist.', true);
        } else if (statusCode === 400) {
          customSetStatusMessage('Bad request. Missing or empty device or username fields.', true);
        }
      } else {
        customSetStatusMessage(`A network error occurred}`, true);
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

  const handleAddDevice = () => {
    if (!newDevice.device || !newDevice.model) {
      const errorMessage = 'Device name and model are required to add a new device.';
      console.warn(errorMessage);
      customSetStatusMessage(errorMessage, true);
      return;
    }
    handleApiCall(`${backendUrl}/devices/add`, 'post', {device: newDevice.device, model: newDevice.model}, () => {
      setNewDevice({device: '', model: ''});
      fetchDevices().then(r => console.log('Devices fetched successfully.'));
    }).then(r => console.log('Device added successfully.'));
   };

  const handleUsernameChange = (event, deviceName) => {
    setDeviceUsernames({
      ...deviceUsernames,
      [deviceName]: event.target.value,
    });
  };

  const handleRelease = (deviceName) => {
    if (!deviceUsernames[deviceName]) {
      const errorMessage = 'Username is required to release a device.';
      customSetStatusMessage(errorMessage, true);
      return;
    }
    handleUsernameChange({target: {value: ''}}, deviceName);
    handleAction('release', deviceName);
  }

  const handleOnline = (deviceName) => {
    handleUsernameChange({target: {value: ''}}, deviceName);
    handleAction('online', deviceName);
  }

  return (
      <div>
        <Box m={3}>
          <h1>Device Management System</h1>
          <h2>Available Devices</h2>
          <TableContainer component={Paper}>
            <Table style={{tableLayout: "fixed"}}>
              <TableHead>
                <TableRow>
                  <TableCell>Device Name</TableCell>
                  <TableCell>Model</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Reservation</TableCell>
                  <TableCell>Maintenance</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device) => {


                  return (
                      <TableRow key={device.name}>
                        <TableCell>{device.name}</TableCell>
                        <TableCell>{device.model}</TableCell>
                        <TableCell>{device.status}</TableCell>
                        <TableCell>
                          <Grid container alignItems="center">
                            <Grid item xs={6}>

                              {device.status === 'free' ? (
                                  <TextField label="Username"
                                             onChange={(event) => handleUsernameChange(event, device.name)}/>
                              ) : (
                                  device.user
                              )}
                            </Grid>
                            <Grid item xs={6}>
                              <Box display="flex" justifyContent="flex-end">
                                {device.status === 'free' ? (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        onClick={() => handleReserve(device.name)}
                                        disabled={!deviceUsernames[device.name]}>
                                      Reserve
                                    </Button>
                                ) : (
                                    device.status === 'reserved' && (
                                        <Button variant="contained"
                                                onClick={() => handleRelease(device.name)}>
                                          Release
                                        </Button>
                                    )
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </TableCell>
                        <TableCell>
                          {(
                              <Box display={"flex"} alignItems={"center"} sx={{gap: 1}}>
                                {device.status !== "offline" ? (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleAction("offline", device.name)}
                                    >
                                      Set Offline
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        color="primary"
                                        onClick={() => handleOnline(device.name)}
                                    >
                                      Set Online
                                    </Button>
                                )}
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    onClick={() => handleDelete(device.name)}
                                >
                                  Delete
                                </Button>
                              </Box>
                          )}
                        </TableCell>
                      </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <div>
            <Box mt={3}>
              <Button variant="outlined" color="primary" onClick={() => setShowAddDevice(!showAddDevice)}>
                {showAddDevice ? 'Hide Add Device' : 'Show Add Device'}
              </Button>
              <Collapse in={showAddDevice}>
                <div style={{marginTop: 20}}>
                  <h2>Add Device</h2>
                  <Box alignItems={"center"} display={"flex"} sx={{gap: 1}}>
                  <TextField
                      label="Device Name"
                      value={newDevice.device}
                      onChange={(e) => setNewDevice({...newDevice, device: e.target.value})}
                      style={{marginRight: 10}}
                  />
                  <TextField
                      label="Model"
                      value={newDevice.model}
                      onChange={(e) => setNewDevice({...newDevice, model: e.target.value})}
                      style={{marginRight: 10}}
                  />
                  <Button variant="contained" color="primary"
                          onClick={handleAddDevice}
                          disabled={!newDevice.device || !newDevice.model}
                  >
                    Add Device
                  </Button>
                  </Box>
                </div>
              </Collapse>
            </Box>
          </div>
          {showStatus && (
              <div>
                <h2>Status Messages</h2>
                <p>{statusMessage}</p>
              </div>
          )}
        </Box>
      </div>
  );
};

// Wrap the App component with ThemeProvider
const WrappedApp = () => (
  <ThemeProvider theme={theme}>
    <App />
  </ThemeProvider>
);

export default WrappedApp;
