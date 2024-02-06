import React from 'react';
import {Box, TableCell, TableRow} from '@mui/material';
import Tooltip from '@mui/material/Tooltip';
import InfoIcon from '@mui/icons-material/Info';
import 'moment-duration-format';

import ReserveGroup from "./ReserveGroup";
import MaintenanceGroup from "./MaintenanceGroup";
import moment from "moment/moment";

export const calculateTimeDiff = (reservation_time) => {
    const now = moment(); // local time
    const reservedTime = moment.utc(reservation_time).local(); // convert UTC to local time
    const duration = moment.duration(now.diff(reservedTime));

    return duration.format("d [days] h [hrs] m [min] s [sec]");
};

const DeviceRow = ({device, handleUsernameChange, deviceUsernames, handleReserve, handleRelease, handleOffline, handleDelete, handleOnline, showMaintenanceMode}) => {
    return (
        <TableRow key={device.name}>
            <TableCell>
                {device.name}
                <Tooltip
                    title={<div style={{whiteSpace: 'pre-line'}}>{device.info}</div>}
                    placement="top"
                >
                    <InfoIcon style={{marginLeft: 5, cursor: 'pointer'}}/>
                </Tooltip>
            </TableCell>
            <TableCell>{device.model}</TableCell>
            <TableCell>
                <Box alignItems={"center"}>
                    {device.status === 'reserved' ? (
                        <>
                            <div className={`status-${device.status}`}>
                                {device.status}
                            </div>
                            At: {new Date(device.reservation_time + 'Z').toLocaleString()}
                            <br/>
                            Duration: {calculateTimeDiff(device.reservation_time)}
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
            <ReserveGroup
                device={device}
                handleUsernameChange={handleUsernameChange}
                deviceUsernames={deviceUsernames}
                handleReserve={handleReserve}
                handleRelease={handleRelease}/>
            <MaintenanceGroup
                device={device}
                handleOffline={handleOffline}
                handleDelete={handleDelete}
                handleOnline={handleOnline}
                showMaintenanceMode={showMaintenanceMode}/>
        </TableRow>
    )
}

export default DeviceRow;