'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import EditIcon from '@mui/icons-material/Edit';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import { StringResource } from '@/types';
import { generateXmlFile } from '@/utils/xml';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

interface TranslationTableProps {
    strings: StringResource[];
    targetLanguages: string[];
    translations: Record<string, StringResource[]>;
    loadingLanguages?: string[];
    translationErrors?: Record<string, string>;
    onTranslationUpdate: (language: string, strings: StringResource[]) => void;
    onRetryLanguage?: (language: string) => void;
}

export default function TranslationTable({
    strings,
    targetLanguages,
    translations,
    loadingLanguages,
    translationErrors,
    onTranslationUpdate,
    onRetryLanguage,
}: TranslationTableProps) {
    const [editingCell, setEditingCell] = useState<{
        key: string;
        language: string;
    } | null>(null);

    const handleEdit = (key: string, language: string) => {
        setEditingCell({ key, language });
    };

    const handleSave = (key: string, language: string, newValue: string) => {
        const updatedStrings = translations[language].map(str =>
            str.key === key ? { ...str, translatedValue: newValue } : str
        );
        onTranslationUpdate(language, updatedStrings);
        setEditingCell(null);
    };

    const handleDownload = async () => {
        const zip = new JSZip();

        // Add original strings.xml
        zip.file('values/strings.xml', generateXmlFile(strings));

        // Add translated files
        targetLanguages.forEach(lang => {
            if (translations[lang]) {
                zip.file(
                    `values-${lang}/strings.xml`,
                    generateXmlFile(translations[lang])
                );
            }
        });

        const content = await zip.generateAsync({ type: 'blob' });
        saveAs(content, 'translations.zip');
    };

    return (
        <Box>
            {translationErrors && Object.keys(translationErrors).length > 0 && (
                <Box sx={{ mb: 2 }}>
                    {Object.entries(translationErrors).map(([lang, msg]) => (
                        <Alert
                            severity="error"
                            key={lang}
                            sx={{ mb: 1 }}
                            action={
                                onRetryLanguage && (
                                    <Button
                                        color="inherit"
                                        size="small"
                                        onClick={() => onRetryLanguage(lang)}
                                        disabled={loadingLanguages?.includes(lang)}
                                    >
                                        {loadingLanguages?.includes(lang) ? 'Retrying...' : 'Retry'}
                                    </Button>
                                )
                            }
                        >
                            {lang}: {msg}
                        </Alert>
                    ))}
                </Box>
            )}
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                    variant="contained"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownload}
                >
                    Download All
                </Button>
            </Box>
            <TableContainer>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>Key</TableCell>
                            <TableCell>Original</TableCell>
                            {targetLanguages.map(lang => (
                                <TableCell key={lang}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <span>{lang}</span>
                                        {loadingLanguages?.includes(lang) && (
                                            <CircularProgress size={14} />
                                        )}
                                        {translationErrors && translationErrors[lang] && (
                                            <Box component="span" sx={{ color: 'error.main', fontSize: 12, ml: 1 }}>
                                                (error)
                                            </Box>
                                        )}
                                    </Box>
                                </TableCell>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {strings.map(string => (
                            <TableRow key={string.key}>
                                <TableCell>{string.key}</TableCell>
                                <TableCell>{string.value}</TableCell>
                                {targetLanguages.map(lang => (
                                    <TableCell key={lang}>
                                        {editingCell?.key === string.key &&
                                            editingCell.language === lang ? (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                <TextField
                                                    defaultValue={
                                                        translations[lang]?.find(
                                                            s => s.key === string.key
                                                        )?.translatedValue || ''
                                                    }
                                                    size="small"
                                                    fullWidth
                                                    multiline
                                                    inputProps={{
                                                        'data-key': string.key,
                                                        'data-lang': lang,
                                                    }}
                                                    onKeyPress={e => {
                                                        if (e.key === 'Enter' && !e.shiftKey) {
                                                            e.preventDefault();
                                                            handleSave(
                                                                string.key,
                                                                lang,
                                                                (e.target as HTMLInputElement).value
                                                            );
                                                        }
                                                    }}
                                                />
                                                <IconButton
                                                    onClick={() => {
                                                        const selector = `textarea[data-key="${string.key}"][data-lang="${lang}"]`;
                                                        const el = document.querySelector(selector) as HTMLTextAreaElement | null;
                                                        if (!el) {
                                                            // element not found — avoid throwing and log for debugging
                                                            console.warn('Input not found for selector:', selector);
                                                            return;
                                                        }
                                                        handleSave(string.key, lang, el.value);
                                                    }}
                                                >
                                                    <SaveIcon />
                                                </IconButton>
                                            </Box>
                                        ) : (
                                            <Box sx={{ display: 'flex', gap: 1 }}>
                                                {translations[lang]?.find(s => s.key === string.key)
                                                    ?.translatedValue || ''}
                                                <IconButton
                                                    size="small"
                                                    onClick={() => handleEdit(string.key, lang)}
                                                >
                                                    <EditIcon />
                                                </IconButton>
                                            </Box>
                                        )}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        </Box>
    );
}