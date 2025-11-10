import { Metadata } from 'next';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Box from '@mui/material/Box';
import Header from '@/components/Header';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://android-translation.vercel.app/';
const title = 'Android strings.xml translator';
const description = 'Upload and translate Android strings.xml files using AI. Preserve format and support translation in batches.';

export const viewport = {
    width: 'device-width',
    initialScale: 1,
};

export const metadata: Metadata = {
    title,
    description,
    keywords: 'Android, strings.xml, translation, localization, translator, AI, machine learning',
    robots: 'index,follow',
    openGraph: {
        title,
        description,
        type: 'website',
        url: siteUrl,
        images: [{
            url: `${siteUrl}/og-image.png`,
        }],
    },
};

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
    const isClient = typeof window !== "undefined"

    return (
        <html lang="en">
            <head>
                <meta name="google-site-verification" content="P3RlTB9pjMDLt1iw8492kNzBgmnVhwJyr-I9sk4JW2E" />
            </head>
            {isClient ? (
                <body suppressHydrationWarning={true}>
                    <ThemeProvider theme={theme}>
                        <CssBaseline />
                        <Header />
                        {children}
                        <Box component="footer" sx={{ textAlign: 'center', py: 1, fontSize: 12, color: 'text.secondary' }}>
                            Check out the source code at:
                            <a href="https://github.com/CJM5555/android-xml-translation" target="_blank" rel="noopener noreferrer">https://github.com/CJM5555/android-xml-translation</a>
                        </Box>
                    </ThemeProvider>
                </body>
            ) : (
                <body suppressHydrationWarning={true}>
                    <CssBaseline />
                    <Header />
                    {children}
                    <Box component="footer" sx={{ textAlign: 'center', py: 1, fontSize: 12, color: 'text.secondary' }}>
                        Check out the source code at:
                        <a href="https://github.com/CJM5555/android-xml-translation" target="_blank" rel="noopener noreferrer">https://github.com/CJM5555/android-xml-translation</a>
                    </Box>
                </body>
            )}
        </html>
    );
}