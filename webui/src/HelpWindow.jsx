import React from 'react';
import {Typography, Paper, List, ListItem, ListItemText, IconButton} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CodeBox from "./CodeBox";


const Step = ({text }) => (
    <ListItem>
        <ListItemText
            primary={text}
        />
    </ListItem>
);

const StepWithCode = ({ title, code }) => (
    <ListItem>
        <ListItemText
            primary={title}
            secondary={
                <Typography component="div">
                    <CodeBox code={code} />
                </Typography>
            }/>
    </ListItem>
);

const HelpWindow = ({ platform, setShowHelp, backendPort }) => {


    // Calculate the download link based on the current settings
    const protocol = window.location.protocol;
    const host = window.location.hostname;
    const downloadLink = `${protocol}//${host}:${backendPort}/cli/get?platform=${platform}`;


    const renderPlatformInstructions = () => {

        const downloadTheBinaryText = (
            <>
                Download the binary (can click <a href={downloadLink} style={{ fontWeight: 'bold', color: 'inherit' }}>here</a>)
            </>
        );
        const downloadTheBinaryCode = `curl -o devmate ${downloadLink}`;
        const makeTheBinaryExecutableText = "Make the binary executable";
        const makeTheBinaryExecutableCode = "chmod +x devmate";
        const moveTheBinaryText = "Move the binary to a directory in the PATH (optional)";
        const moveTheBinaryCode = "sudo mv devmate /usr/local/bin/";
        const configureToolText = "Configure the tool";
        const configureToolCode = `devmate configure --protocol ${window.location.protocol.split(":")[0]} --address ${window.location.hostname} --port ${backendPort}`;
        const runToolText = "Run the tool, for example to list all devices";
        const runToolCode = "devmate list";

        return (
            <div>
                {platform === "macos" && (
                    <>
                        <Typography variant="h4" gutterBottom>
                            macOS Installation Steps
                        </Typography>
                        <List>
                            <StepWithCode title={downloadTheBinaryText} code={downloadTheBinaryCode} />
                            <StepWithCode title={makeTheBinaryExecutableText} code={makeTheBinaryExecutableCode} />
                            <StepWithCode title={"Remove the quarantine flag"} code={"xattr -d com.apple.quarantine devmate"} />
                            <StepWithCode title={moveTheBinaryText} code={moveTheBinaryCode} />
                            <StepWithCode title={configureToolText} code={configureToolCode} />
                            <StepWithCode title={runToolText} code={runToolCode} />
                        </List>
                    </>
                )}
                {platform === "linux" && (
                    <>
                        <Typography variant="h4" gutterBottom>
                            Linux Installation Steps
                        </Typography>
                        <List>
                            <StepWithCode title={downloadTheBinaryText} code={downloadTheBinaryCode} />
                            <StepWithCode title={makeTheBinaryExecutableText} code={makeTheBinaryExecutableCode} />
                            <StepWithCode title={moveTheBinaryText} code={moveTheBinaryCode} />
                            <StepWithCode title={configureToolText} code={configureToolCode} />
                            <StepWithCode title={runToolText} code={runToolCode} />
                        </List>
                    </>
                )}
                {platform === "windows" && (
                    <>
                        <Typography variant="h4" gutterBottom>
                            Windows Installation Steps
                        </Typography>
                        <List>
                            <Step text={downloadTheBinaryText} />
                            <StepWithCode title={configureToolText} code={configureToolCode} />
                            <StepWithCode title={runToolText} code={runToolCode} />
                        </List>
                    </>
                )}
            </div>
        );
    };

    return (
        <Paper style={{
            padding: '20px',
            maxWidth: '600px',
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            zIndex: 999,
            backgroundColor: '#333a3d'
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