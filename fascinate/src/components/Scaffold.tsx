import { Box } from "@mui/material";


export const Scaffold: React.FC<{
    appBar?: React.ReactNode;
    children?: React.ReactNode;
}> = ({ children, appBar }) => {
    return (
        <>
            <Box className="scaffold">
                {appBar}
                {children}
            </Box>
        </>
    );
}