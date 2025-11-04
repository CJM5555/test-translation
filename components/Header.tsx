import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TranslateIcon from '@mui/icons-material/Translate';

export default function Header() {
    return (
        <AppBar position="static">
            <Toolbar>
                <TranslateIcon sx={{ mr: 2 }} />
                <Typography variant="h6" component="div">
                    Android strings.xml translator
                </Typography>
            </Toolbar>
        </AppBar>
    );
}