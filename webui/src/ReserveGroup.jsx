import React from 'react';
import {TextField, Button, Box, Grid, TableCell} from '@mui/material';

const ReserveGroup = ({device, handleUsernameChange, deviceUsernames, handleReserve, handleRelease}) => {
    return (
        <TableCell>
            <Grid container alignItems="center">
                <Grid item xs={6}>
                    {device.status === 'free' ? (
                        <TextField label="Username"
                                   onChange={(event) => handleUsernameChange(event, device.name)}
                                   style={{zIndex: 0}}
                        />
                    ) : (
                        device.user
                    )}
                </Grid>
                <Grid item xs={6}>
                    <Box display="flex" justifyContent="flex-end">
                        {device.status === 'free' ? (
                            <Button variant="contained" color="success" onClick={() => handleReserve(device.name)}
                                    disabled={!deviceUsernames[device.name]}>
                                Reserve
                            </Button>
                        ) : (
                            device.status === 'reserved' && (
                                <Button variant="contained" onClick={() => handleRelease(device.name)}>
                                    Release
                                </Button>
                            )
                        )}
                    </Box>
                </Grid>
            </Grid>
        </TableCell>
    );
}

export default ReserveGroup;