'use client';

import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import CircularProgress from '@mui/material/CircularProgress';
import { parseXmlFile } from '@/utils/xml';
import { StringResource } from '@/types';

interface FileUploadProps {
    onUpload: (strings: StringResource[]) => void;
}

export default function FileUpload({ onUpload }: FileUploadProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const file = acceptedFiles[0];
        if (!file) return;

        setIsLoading(true);
        setError(null);

        try {
            const text = await file.text();
            const strings = await parseXmlFile(text);
            onUpload(strings);
        } catch (err) {
            setError('Error parsing XML file. Please ensure it\'s a valid strings.xml file.');
            console.error('File upload error:', err);
        } finally {
            setIsLoading(false);
        }
    }, [onUpload]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'text/xml': ['.xml'],
        },
        multiple: false,
    });

    return (
        <Box>
            <Box
                {...getRootProps()}
                sx={{
                    p: 4,
                    border: '2px dashed',
                    borderColor: isDragActive ? 'primary.main' : 'grey.300',
                    borderRadius: 1,
                    textAlign: 'center',
                    cursor: 'pointer',
                    '&:hover': {
                        borderColor: 'primary.main',
                    },
                }}
            >
                <input {...getInputProps()} />
                {isLoading ? (
                    <CircularProgress />
                ) : (
                    <Typography variant="body1" color="text.secondary">
                        {isDragActive
                            ? 'Drop the strings.xml file here'
                            : 'Drag and drop your strings.xml file here, or click to select'}
                    </Typography>
                )}
            </Box>
            {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                    {error}
                </Typography>
            )}
        </Box>
    );
}