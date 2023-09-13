import {Box, Button, Collapse, TextField} from "@mui/material";
import React, {useState} from "react";

const AddDeviceSection = ({newDevice, setNewDevice, handleAddDevice}) => {
    const [showAddDeviceMode, setShowAddDeviceMode] = useState(false);
    return (
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
                    </Box>
                </div>
            </Collapse>
        </Box>
    )
}

export default AddDeviceSection;