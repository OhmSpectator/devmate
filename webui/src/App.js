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

import moment from 'moment';
import 'moment-duration-format';

import Snackbar from '@mui/material/Snackbar';

const theme = createTheme({
});

const backendUrl = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';

const App = () => {
  const [devices, setDevices] = useState([]);
  const [newDevice, setNewDevice] = useState({ device: '', model: '' });
  const [statusMessage, setStatusMessage] = useState('');
  const [showMaintenanceMode, setShowMaintenanceMode] = useState(false);
  const [showAddDeviceMode, setShowAddDeviceMode] = useState(false);
  const [deviceUsernames, setDeviceUsernames] = useState({});
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
                  <TableCell>
                    <Button variant="outlined" color="primary" onClick={() => setShowMaintenanceMode(!showMaintenanceMode)}>
                      {showMaintenanceMode ? 'Maintenance' : 'Maintenance'} {/* Rename the button */}
                    </Button>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {devices.map((device) => {


                  return (
                      <TableRow key={device.name}>
                        <TableCell>{device.name}</TableCell>
                        <TableCell>{device.model}</TableCell>
                        <TableCell>
                          <Box alignItems={"center"}>
                          {device.status === 'reserved' ? (
                            <>
                            <div className={`status-${device.status}`}>
                            {device.status}
                            </div>
                            At: {new Date(device.reservation_time + 'Z').toLocaleString()}
                            <br />
                            Duration: {calculateTimeDifference(device.reservation_time)}
                            </>
                            ) : (
                            <>
                            <div className={`status-${device.status}`}>
                              {device.status}
                            </div>
                            </>
                          )}
                            </Box>
                        </TableCell>
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
                        <TableCell   style={{
                          visibility: showMaintenanceMode ? 'visible' : 'hidden'
                        }}>
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
              <Button variant="outlined" color="primary" onClick={() => setShowAddDeviceMode(!showAddDeviceMode)}>
                {showAddDeviceMode ? 'Hide Add Device' : 'Show Add Device'} {/* Rename the button */}
              </Button>

              <Collapse in={showAddDeviceMode}>
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
                    <Snackbar
                        open={openSnackbar}
                        onClose={() => setOpenSnackbar(false)}
                        message={<span>{statusMessage}</span>}
                        autoHideDuration={5000}
                    />
                  </Box>
                </div>
              </Collapse>
            </Box>
          </div>
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
