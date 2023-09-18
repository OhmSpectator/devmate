import React from 'react';
import {Typography, Box, Paper, List, ListItem, ListItemText, IconButton} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';


const HelpWindow = ({ platform, setShowHelp }) => {
    const renderPlatformInstructions = () => {
        switch (platform) {
            case 'macos':
                return (
                    <>
                        <Typography variant="h4" gutterBottom>
                            macOS Installation Steps
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText primary="Step 1: Make the binary executable"
                                              secondary={<code>chmod +x devmate</code>}/>
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Step 2: Move the binary to a directory in the PATH (optional)"
                                              secondary={<code>sudo mv devmate /usr/local/bin/</code>}/>
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Step 3: Allow the tool to run"/>
                            </ListItem>
                            <Box ml={5}>
                                <List component="div" disablePadding>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Typography variant="h8">
                                                    Option 1: Right-click to Open
                                                </Typography>
                                            }
                                            secondary="Right-click on the tool in Finder, select 'Open', and then click 'Open' in the dialog."
                                        />
                                    </ListItem>
                                    <ListItem>
                                        <ListItemText
                                            primary={
                                                <Typography variant="h8">
                                                    Option 2: Allow in System Preferences
                                                </Typography>
                                            }
                                            secondary="Go to 'System Preferences' > 'Security & Privacy' > 'General' and click 'Open Anyway'."
                                        />
                                    </ListItem>
                                </List>
                            </Box>
                            <ListItem>
                                <ListItemText primary="Step 4: Run the CLI tool" secondary={<code>devmate -h</code>}/>
                            </ListItem>
                        </List>
                    </>
                );
            case 'linux':
                return (
                    <>
                        <Typography variant="h4" gutterBottom>
                            Linux Installation Steps
                        </Typography>
                        <List>
                            <ListItem>
                                <ListItemText primary="Step 1: Make the binary executable"
                                              secondary={<code>chmod +x devmate</code>}/>
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Step 2: Move the binary to a directory in the PATH (optional)"
                                              secondary={<code>sudo mv devmate /usr/local/bin/</code>}/>
                            </ListItem>
                            <ListItem>
                                <ListItemText primary="Step 3: Run the CLI tool"
                                              secondary={<code>devmate -h</code>}/>
                            </ListItem>
                        </List>
                    </> );
            default:
                return null;
        }
    };

    return (
        platform !== 'windows' &&
        <Paper style={{
            padding: '20px',
            maxWidth: '600px',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        }}
        >
            <IconButton onClick={() => setShowHelp(false)} style={{ position: 'absolute', right: '10px', top: '10px' }}>
                <CloseIcon />
            </IconButton>
            {renderPlatformInstructions()}
        </Paper>
    );
};

export default HelpWindow;