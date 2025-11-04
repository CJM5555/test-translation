'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Chip from '@mui/material/Chip';
import TextField from '@mui/material/TextField';
import Autocomplete from '@mui/material/Autocomplete';
import Typography from '@mui/material/Typography';

interface LanguageSelectProps {
    onSelect: (languages: string[]) => void;
}

const SUPPORTED_LANGUAGES = [
    { code: 'af', name: 'Afrikaans — af' },
    { code: 'ar', name: 'Arabic — ar' },
    { code: 'bg', name: 'Bulgarian — bg' },
    { code: 'ca', name: 'Catalan — ca' },
    { code: 'zh-Hans', name: 'Chinese (Simplified) — zh-Hans' },
    { code: 'zh-Hant', name: 'Chinese (Traditional) — zh-Hant' },
    { code: 'cs', name: 'Czech — cs' },
    { code: 'da', name: 'Danish — da' },
    { code: 'nl', name: 'Dutch — nl' },
    { code: 'en', name: 'English — en' },
    { code: 'et', name: 'Estonian — et' },
    { code: 'fi', name: 'Finnish — fi' },
    { code: 'fr', name: 'French — fr' },
    { code: 'de', name: 'German — de' },
    { code: 'el', name: 'Greek — el' },
    { code: 'he', name: 'Hebrew — he' },
    { code: 'hi', name: 'Hindi — hi' },
    { code: 'hu', name: 'Hungarian — hu' },
    { code: 'id', name: 'Indonesian — id' },
    { code: 'it', name: 'Italian — it' },
    { code: 'ja', name: 'Japanese — ja' },
    { code: 'ko', name: 'Korean — ko' },
    { code: 'lv', name: 'Latvian — lv' },
    { code: 'lt', name: 'Lithuanian — lt' },
    { code: 'ms', name: 'Malay — ms' },
    { code: 'no', name: 'Norwegian — no' },
    { code: 'pl', name: 'Polish — pl' },
    { code: 'pt', name: 'Portuguese — pt' },
    { code: 'pt-BR', name: 'Portuguese (Brazil) — pt-BR' },
    { code: 'ro', name: 'Romanian — ro' },
    { code: 'ru', name: 'Russian — ru' },
    { code: 'sk', name: 'Slovak — sk' },
    { code: 'sl', name: 'Slovenian — sl' },
    { code: 'es', name: 'Spanish — es' },
    { code: 'sv', name: 'Swedish — sv' },
    { code: 'th', name: 'Thai — th' },
    { code: 'tr', name: 'Turkish — tr' },
    { code: 'uk', name: 'Ukrainian — uk' },
    { code: 'vi', name: 'Vietnamese — vi' },
    { code: 'fa', name: 'Persian — fa' },
];

export default function LanguageSelect({ onSelect }: LanguageSelectProps) {
    const [selectedLanguages, setSelectedLanguages] = useState<typeof SUPPORTED_LANGUAGES>([]);

    const handleChange = (_event: any, newValue: typeof SUPPORTED_LANGUAGES) => {
        setSelectedLanguages(newValue);
        onSelect(newValue.map(lang => lang.code));
    };

    return (
        <Box>
            <Typography variant="h6" gutterBottom>
                Select Target Languages
            </Typography>
            <Autocomplete
                multiple
                options={SUPPORTED_LANGUAGES}
                value={selectedLanguages}
                onChange={handleChange}
                getOptionLabel={(option) => option.name}
                renderInput={(params) => (
                    <TextField
                        {...params}
                        variant="outlined"
                        placeholder="Select languages"
                    />
                )}
                renderTags={(value, getTagProps) =>
                    value.map((option, index) => (
                        <Chip
                            label={option.name}
                            {...getTagProps({ index })}
                            key={option.code}
                        />
                    ))
                }
            />
        </Box>
    );
}