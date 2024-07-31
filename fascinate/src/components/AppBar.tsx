import { AppBar as MuiAppBar, Toolbar, Typography } from "@mui/material"

const AppBar: React.FC = () => {
    return (
        <MuiAppBar position="static">
            <Toolbar>
                <Typography variant="h6">IG Post Copywriter AI (POC)</Typography>
            </Toolbar>
        </MuiAppBar>
    );
}

export { AppBar }