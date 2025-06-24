import React, {useState} from 'react';
import { Button, Box, TableCell, TextField } from '@mui/material';
const MaintenanceGroup = ({device, handleOffline, handleDelete, handleOnline, handleUpdateInfo, showMaintenanceMode}) => {
        const [editInfoMode, setEditInfoMode] = useState(false);
        const [infoValue, setInfoValue] = useState(device.info || '');

        const handleEditClick = () => {
            if (editInfoMode) {
                handleUpdateInfo(device.name, infoValue);
            }
            setEditInfoMode(!editInfoMode);
        }

        return (
            <TableCell style={{ visibility: showMaintenanceMode ? 'visible' : 'hidden' }}>
                <Box display={"flex"} alignItems={"center"} sx={{ gap: 1 }}>
                    {editInfoMode && (
                        <TextField
                            size="small"
                            multiline
                            value={infoValue}
                            onChange={(e) => setInfoValue(e.target.value)}
                        />
                    )}
                    <Button variant="contained" color="primary" onClick={handleEditClick}>
                        {editInfoMode ? 'Save Info' : 'Edit Info'}
                    </Button>
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
