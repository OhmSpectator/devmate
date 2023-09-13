import React from 'react';
import { TableCell, TableRow } from '@mui/material';
import 'moment-duration-format';

import ReserveGroup from "./ReserveGroup";
import MaintenanceGroup from "./MaintenanceGroup";

const DeviceRow = ({device, handleUsernameChange, deviceUsernames, handleReserve, handleRelease, handleAction, handleDelete, handleOnline, showMaintenanceMode}) => {
    return (
        <TableRow key={device.name}>
            <TableCell>{device.name}</TableCell>
            <TableCell>{device.model}</TableCell>
            <TableCell>
                <div className={`status-${device.status}`}>
                    {device.status}
                </div>
            </TableCell>
            <ReserveGroup
                device={device}
                handleUsernameChange={handleUsernameChange}
                deviceUsernames={deviceUsernames}
                handleReserve={handleReserve}
                handleRelease={handleRelease}/>
            <MaintenanceGroup
                device={device}
                handleAction={handleAction}
                handleDelete={handleDelete}
                handleOnline={handleOnline}
                showMaintenanceMode={showMaintenanceMode}/>
        </TableRow>
    )
}

export default DeviceRow;