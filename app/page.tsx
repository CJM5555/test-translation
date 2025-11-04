'use client';

import { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import FileUpload from '@/components/FileUpload';
import LanguageSelect from '@/components/LanguageSelect';
import TranslationTable from '@/components/TranslationTable';
import { StringResource } from '@/types';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import IconButton from '@mui/material/IconButton';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import DeleteIcon from '@mui/icons-material/Delete';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert, { AlertProps } from '@mui/material/Alert';

export default function Home() {
    const [strings, setStrings] = useState<StringResource[]>([]);
    const [targetLanguages, setTargetLanguages] = useState<string[]>([]);
    const [translations, setTranslations] = useState<Record<string, StringResource[]>>({});
    const [loadingLanguages, setLoadingLanguages] = useState<string[]>([]);
    const [translationErrors, setTranslationErrors] = useState<Record<string, string>>({});
    const [showLanguageSelect, setShowLanguageSelect] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleFileUpload = (uploadedStrings: StringResource[]) => {
        setStrings(uploadedStrings);
        // after a successful upload, hide the language dropdown and show success UI
        setShowLanguageSelect(false);
    };

    const translateLanguage = async (lang: string) => {
        // mark loading
        setLoadingLanguages(prev => (prev.includes(lang) ? prev : [...prev, lang]));
        setTranslationErrors(prev => {
            const copy = { ...prev };
            delete copy[lang];
            return copy;
        });

        try {
            const res = await fetch('/api/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ strings, targetLanguage: lang }),
            });

            if (!res.ok) {
                // Try to parse a JSON error body first (route returns { success:false, error })
                let text = await res.text();
                try {
                    const parsed = JSON.parse(text);
                    text = parsed?.error || text;
                } catch {
                    // keep raw text
                }
                setTranslationErrors(prev => ({ ...prev, [lang]: `API error` }));
                // show snackbar to notify user
                setSnackbarMessage(`Translation error (${lang})`);
                console.error(`Translation error (${lang}): ${text}`);
                setSnackbarOpen(true);
                return;
            }

            const json = await res.json();
            if (json?.success && Array.isArray(json.data)) {
                setTranslations(prev => ({ ...prev, [lang]: json.data }));
                // clear any previous error
                setTranslationErrors(prev => {
                    const copy = { ...prev };
                    delete copy[lang];
                    return copy;
                });
            } else if (json?.success === false && json?.error) {
                // API returned structured error
                setTranslationErrors(prev => ({ ...prev, [lang]: `API error` }));
                setSnackbarMessage(`Translation error (${lang})`);
                console.error(`Translation error (${lang}): ${json.error}`);
                setSnackbarOpen(true);
            } else {
                setTranslationErrors(prev => ({ ...prev, [lang]: 'Unexpected response from translation API' }));
            }
        } catch (err) {
            setTranslationErrors(prev => ({ ...prev, [lang]: `Error` }));
            setSnackbarMessage(`Translation error (${lang})`);
            console.error(`Translation error (${lang}): ${String(err)}`);
            setSnackbarOpen(true);
        } finally {
            // clear loading
            setLoadingLanguages(prev => prev.filter(l => l !== lang));
        }
    };

    const handleRetryLanguage = (lang: string) => {
        translateLanguage(lang);
    };

    const handleLanguageSelect = (languages: string[]) => {
        setTargetLanguages(languages);
    };

    const handleClearAll = () => {
        setStrings([]);
        setTargetLanguages([]);
        setTranslations({});
        setTranslationErrors({});
        setShowLanguageSelect(false);
    };

    // Snackbar state
    const [snackbarOpen, setSnackbarOpen] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const Alert = (props: AlertProps) => <MuiAlert elevation={6} variant="filled" {...props} />;

    // When target languages change, trigger translation for any newly selected language
    useEffect(() => {
        if (strings.length === 0 || targetLanguages.length === 0) return;

        // Translate any newly selected languages that don't have translations yet
        for (const lang of targetLanguages) {
            if (!translations[lang]) {
                translateLanguage(lang);
            }
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [targetLanguages, strings]);

    const handleTranslationUpdate = (language: string, translatedStrings: StringResource[]) => {
        setTranslations(prev => ({
            ...prev,
            [language]: translatedStrings,
        }));
    };

    return (
        <Container maxWidth="lg" sx={{ py: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    Android strings.xml translator
                </Typography>
                <Typography variant="body1" color="text.secondary" paragraph>
                    Upload your Android strings.xml file, select target languages, and get AI-powered translations
                </Typography>
            </Box>

            {strings.length === 0 && (
                <Paper sx={{ p: 3, mb: 4 }}>
                    <FileUpload onUpload={handleFileUpload} />
                </Paper>
            )}

            {strings.length > 0 && (
                <Paper sx={{ p: 3, mb: 4 }}>
                    {!showLanguageSelect ? (
                        <Stack direction="row" spacing={2} alignItems="center">
                            <div>
                                <Typography variant="h6">Upload successful</Typography>
                                <Typography variant="body2" color="text.secondary">
                                    {strings.length} strings parsed from file.
                                </Typography>
                            </div>
                            <Button variant="contained" onClick={() => setShowLanguageSelect(true)}>
                                Select languages
                            </Button>
                            <IconButton aria-label="clear" color="error" onClick={() => setConfirmOpen(true)}>
                                <DeleteIcon />
                            </IconButton>
                        </Stack>
                    ) : (
                        <Stack direction="row" spacing={2} alignItems="flex-start">
                            <Box sx={{ flex: 1 }}>
                                <LanguageSelect onSelect={handleLanguageSelect} />
                            </Box>
                            <IconButton aria-label="clear" color="error" onClick={() => setConfirmOpen(true)}>
                                <DeleteIcon />
                            </IconButton>
                        </Stack>
                    )}
                </Paper>
            )}

            {strings.length > 0 && targetLanguages.length > 0 && (
                <Paper sx={{ p: 3 }}>
                    <TranslationTable
                        strings={strings}
                        targetLanguages={targetLanguages}
                        translations={translations}
                        loadingLanguages={loadingLanguages}
                        translationErrors={translationErrors}
                        onTranslationUpdate={handleTranslationUpdate}
                        onRetryLanguage={handleRetryLanguage}
                    />
                </Paper>
            )}
            <Dialog
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                aria-labelledby="confirm-clear-title"
            >
                <DialogTitle id="confirm-clear-title">Confirm clear</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to clear the uploaded file and selected languages? This action cannot be undone.
                    </DialogContentText>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
                    <Button
                        color="error"
                        onClick={() => {
                            handleClearAll();
                            setConfirmOpen(false);
                        }}
                        autoFocus
                    >
                        Clear
                    </Button>
                </DialogActions>
            </Dialog>
            <Snackbar
                open={snackbarOpen}
                autoHideDuration={6000}
                onClose={() => setSnackbarOpen(false)}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={() => setSnackbarOpen(false)} severity="error">
                    {snackbarMessage}
                </Alert>
            </Snackbar>
        </Container>
    );
}