import {IconButton, Paper, Typography} from "@mui/material";
import {useState} from "react";
import {useEffect} from "react";

const isSecured = window.location.protocol === "https:" || window.location.hostname === "localhost";

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
            {isSecured && ( <IconButton
                aria-label="copy"
                size="small"
                onClick={handleCopyClick}
                style={iconButtonStyle}
            >
                <Typography variant="caption">{copyStatus}</Typography>
            </IconButton>
            )}
            <div style={{overflowX: "auto"}}>
            <pre>
                <code>{code}</code>
            </pre>
            </div>
        </Paper>
    );
}

export default CodeBox;


