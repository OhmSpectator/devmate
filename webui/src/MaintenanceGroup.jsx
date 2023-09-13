import React from 'react';
import { Button, Box, TableCell } from '@mui/material';

const MaintenanceGroup = ({device, handleOffline, handleDelete, handleOnline, showMaintenanceMode}) => {
        return (
            <TableCell style={{ visibility: showMaintenanceMode ? 'visible' : 'hidden' }}>
                <Box display={"flex"} alignItems={"center"} sx={{ gap: 1 }}>
                    {device.status !== "offline" ? (
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleOffline(device.name)}
                        >
                            Set Offline
                        </Button>
                    ) : (
                        <Button variant="contained"
                                color="primary"
                                onClick={() => handleOnline(device.name)}
                        >
                            Set Online
                        </Button>
                    )}
                    <Button
                        variant="contained"
                        color="secondary" onClick={() => handleDelete(device.name)}
                    >
                        Delete
                    </Button>
                </Box>
            </TableCell>
        );
}

export default MaintenanceGroup;
