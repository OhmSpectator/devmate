import {Box, Button, FormControl, InputLabel, MenuItem, Select} from "@mui/material";
import React from "react";
import HelpWindow from "./HelpWindow";

const GetCLISection = ({platformValue, onChange, onClick, showHelp, setShowHelp, backendPort}) => {
    return <Box
        position={"absolute"}
        right={16}
        bottom={16}
        display="flex"
        alignItems="center"
    >
        <FormControl variant="outlined" sx={{marginRight: "16px", flex: 1, height: 40}}>
            <InputLabel id="platform-label">Platform</InputLabel>
            <Select
                labelId="platform-label"
                id="platform-select"
                value={platformValue}
                onChange={onChange}
                label="Platform"
                sx={{height: "100%"}}
            >
                <MenuItem value={"linux"}>Linux</MenuItem>
                <MenuItem value={"macos"}>macOS</MenuItem>
                <MenuItem value={"windows"}>Windows</MenuItem>
            </Select>
        </FormControl>
        <Button
            variant="contained"
            onClick={onClick}
            sx={{height: 40}}
        >
            Get CLI
        </Button>
        {showHelp && <HelpWindow platform={platformValue} setShowHelp={setShowHelp} backendPort={backendPort}/>}
    </Box>;
}

export default GetCLISection;