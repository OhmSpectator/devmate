import {Button, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow} from "@mui/material";
import DeviceRow from "./DeviceRow";
import React, {useState} from "react";

const  DevicesList = ({devices, handleUsernameChange, deviceUsernames, handleReserve, handleRelease, handleAction, handleDelete, handleOnline}) => {
    const [showMaintenanceMode, setShowMaintenanceMode] = useState(false);
    console.log(devices);
    return (
        <TableContainer component={Paper}>
            <Table style={{tableLayout: "fixed"}}>
                <TableHead>
                    <TableRow>
                        <TableCell>Device Name</TableCell>
                        <TableCell>Model</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Reservation</TableCell>
                        <TableCell>
                            <Button variant="text" color="primary"
                                    onClick={() => setShowMaintenanceMode(!showMaintenanceMode)}>
                                Maintenance
                            </Button>
                        </TableCell>
                    </TableRow>
                </TableHead>
                <TableBody>
                    {devices.map((device) => (
                        <DeviceRow
                            key={device.name}
                            device={device}
                            handleUsernameChange={handleUsernameChange}
                            deviceUsernames={deviceUsernames}
                            handleReserve={handleReserve}
                            handleRelease={handleRelease}
                            handleAction={handleAction}
                            handleDelete={handleDelete}
                            handleOnline={handleOnline}
                            showMaintenanceMode={showMaintenanceMode}
                        />
                    ))}
                </TableBody>
            </Table>
        </TableContainer>
    )
}

export default DevicesList;