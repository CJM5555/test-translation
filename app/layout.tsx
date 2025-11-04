'use client';

import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Header from '@/components/Header';

const theme = createTheme({
    palette: {
        mode: 'light',
    },
});

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body>
                <ThemeProvider theme={theme}>
                    <CssBaseline />
                    <Header />
                    {children}
                </ThemeProvider>
            </body>
        </html>
    );
}