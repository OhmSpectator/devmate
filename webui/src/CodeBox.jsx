import {IconButton, Paper, Typography} from "@mui/material";
import {useState} from "react";
import {useEffect} from "react";

export const CodeBox = ({code}) => {

    const [copyStatus, setCopyStatus] = useState("copy");

    const codeContainerStyle = {
        position: 'relative',
        padding: '16px',
        marginBottom: '8px',
        overflowX: 'auto',
    };

    const iconButtonStyle = {
        position: 'absolute',
        top: '2px',
        right: '5px',
    };

    const handleCopyClick = () => {
        navigator.clipboard.writeText(code).then(
            () => {
                console.log('Text copied to clipboard');
                setCopyStatus("copied!");
            },
            () => {
                console.log('Failed to copy text');
            }
        );
    };

    const resetCopyStatus = () => {
        setCopyStatus("copy");
    };

    useEffect(() => {
        // Add global click event listener
        window.addEventListener("click", resetCopyStatus);

        // Remove event listener when component unmounts
        return () => {
            window.removeEventListener("click", resetCopyStatus);
        };
    }, []);


    return (
        <Paper elevation={2} style={codeContainerStyle}>
            <IconButton
                aria-label="copy"
                size="small"
                onClick={handleCopyClick}
                style={iconButtonStyle}
            >
                <Typography variant="caption">{copyStatus}</Typography>
            </IconButton>
            <pre>
                <code>{code}</code>
            </pre>
        </Paper>
    );
}

export default CodeBox;


