import { StringResource } from "../types";

// Azure translator configuration
const AZURE_TRANSLATOR_ENDPOINT =
  process.env.AZURE_TRANSLATOR_ENDPOINT ||
  "https://api.cognitive.microsofttranslator.com";
const AZURE_TRANSLATOR_KEY = process.env.AZURE_TRANSLATOR_KEY || "";
const AZURE_TRANSLATOR_REGION = process.env.AZURE_TRANSLATOR_REGION || ""; // Optional for some regions

// Quick runtime validation: record whether the key looks present. Avoid throwing at module import
// time so the API route can control how to surface errors to the client.
const AZURE_KEY_VALID = Boolean(
  AZURE_TRANSLATOR_KEY && AZURE_TRANSLATOR_KEY.length >= 10
);
if (!AZURE_KEY_VALID) {
  // Log a helpful message to the server console (do not print the key itself).
  console.error(
    "Azure translator key is missing or appears invalid. Set AZURE_TRANSLATOR_KEY in .env.local with your translator resource key and restart the dev server."
  );
}

// Language code mapping (Android -> Azure)
const languageMap: Record<string, string> = {
  ar: "ar",
  zh: "zh-Hans",
  fr: "fr",
  de: "de",
  hi: "hi",
  it: "it",
  ja: "ja",
  ko: "ko",
  pt: "pt",
  ru: "ru",
  es: "es",
};

// Batch size for Azure (Azure supports batching multiple texts in one request)
const BATCH_SIZE = 50;

function extractPlaceholders(text: string) {
  const placeholders: string[] = [];
  const placeholderRegex = /(%[sdf]|@string\/[a-zA-Z0-9_]+)/g;
  const processed = text.replace(placeholderRegex, (match) => {
    placeholders.push(match);
    return `[PLH${placeholders.length - 1}]`;
  });
  return { processed, placeholders };
}

function restorePlaceholders(text: string, placeholders: string[]) {
  let result = text;
  placeholders.forEach((ph, idx) => {
    result = result.replace(`[PLH${idx}]`, ph);
  });
  return result;
}

// Retry configuration
const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type AzureBatchResult =
  | { success: true; data: string[] }
  | { success: false; error: string };

async function azureTranslateBatch(
  texts: string[],
  to: string,
  retryCount = 0
): Promise<AzureBatchResult> {
  // If the key isn't valid, fail here so the caller (API route) can return a structured error
  if (!AZURE_KEY_VALID) {
    const msg =
      "Missing or invalid Azure translator key. Set AZURE_TRANSLATOR_KEY in .env.local with your translator resource key and restart the dev server.";
    console.error(msg);
    return { success: false, error: msg };
  }
  const url = `${AZURE_TRANSLATOR_ENDPOINT}/translate?api-version=3.0&to=${encodeURIComponent(
    to
  )}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Ocp-Apim-Subscription-Key": AZURE_TRANSLATOR_KEY,
  };
  if (AZURE_TRANSLATOR_REGION) {
    // normalize common region formats (e.g. "Southeast Asia" -> "southeastasia")
    const normalizedRegion = AZURE_TRANSLATOR_REGION.toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "");
    headers["Ocp-Apim-Subscription-Region"] = normalizedRegion;
  }

  const body = texts.map((t) => ({ Text: t }));

  try {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    // Handle rate limiting specifically
    if (res.status === 429) {
      if (retryCount >= MAX_RETRIES) {
        const msg = "Max retries reached for rate limit";
        console.error(msg);
        return { success: false, error: msg };
      }
      // Get retry-after header or use exponential backoff
      const retryAfter = parseInt(res.headers.get("retry-after") || "0") * 1000;
      const backoffDelay = Math.max(
        retryAfter,
        INITIAL_RETRY_DELAY * Math.pow(2, retryCount)
      );

      console.log(`Rate limited. Retrying after ${backoffDelay}ms...`);
      await sleep(backoffDelay);
      return azureTranslateBatch(texts, to, retryCount + 1);
    }

    // Handle other errors
    if (!res.ok) {
      const txt = await res.text();
      const msg = `Azure translator error ${res.status}: ${txt}`;
      console.error(msg);
      return { success: false, error: msg };
    }

    interface TranslationResponse {
      translations: Array<{
        text: string;
        to: string;
      }>;
    }

    const data: TranslationResponse[] = await res.json();
    return {
      success: true,
      data: data.map((item) => item.translations[0]?.text || ""),
    };
  } catch (error) {
    // Retry on network errors or unexpected issues
    if (retryCount < MAX_RETRIES) {
      const backoffDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount);
      console.log(
        `Translation failed. Retrying after ${backoffDelay}ms...`,
        error
      );
      await sleep(backoffDelay);
      return azureTranslateBatch(texts, to, retryCount + 1);
    }
    const msg = error instanceof Error ? error.message : String(error);
    console.error(`Translation failed: ${msg}`);
    return { success: false, error: msg };
  }
}

export const translateString = async (
  text: string,
  targetLanguage: string,
  preservePlaceholders = true
): Promise<string> => {
  const { processed, placeholders } = extractPlaceholders(text);
  const mapped = languageMap[targetLanguage] || targetLanguage;
  const res = await azureTranslateBatch([processed], mapped);
  if (!res.success) {
    console.error("translateString error:", res.error);
    return text; // fallback to original if translation failed
  }
  const translated = res.data[0] || "";
  const restored = preservePlaceholders
    ? restorePlaceholders(translated, placeholders)
    : translated;
  return restored;
};

export const translateResources = async (
  strings: StringResource[],
  targetLanguage: string
): Promise<
  | { success: true; data: StringResource[] }
  | { success: false; error: string; data?: StringResource[] }
> => {
  const translatedStrings: StringResource[] = new Array(strings.length);
  const retryQueue: Array<{ index: number; text: string }> = [];

  const mapped = languageMap[targetLanguage] || targetLanguage;
  let aggregatedError: string | null = null;

  // First pass: translate in batches
  for (let i = 0; i < strings.length; i += BATCH_SIZE) {
    const batch = strings.slice(i, i + BATCH_SIZE);
    const texts = batch.map((s) => s.value);
    const res = await azureTranslateBatch(texts, mapped);
    if (!res.success) {
      // queue all for individual retry and record error
      aggregatedError = aggregatedError
        ? `${aggregatedError}; ${res.error}`
        : res.error;
      batch.forEach((str, batchIndex) => {
        const stringIndex = i + batchIndex;
        retryQueue.push({ index: stringIndex, text: str.value });
      });
      console.error(`Batch error for chunk starting at ${i}:`, res.error);
      continue;
    }

    // Process successful translations
    res.data.forEach((translatedText, batchIndex) => {
      const stringIndex = i + batchIndex;
      if (stringIndex < strings.length) {
        if (translatedText) {
          translatedStrings[stringIndex] = {
            ...strings[stringIndex],
            translatedValue: translatedText,
          };
        } else {
          // Queue for retry if translation was empty
          retryQueue.push({
            index: stringIndex,
            text: strings[stringIndex].value,
          });
        }
      }
    });
  }

  // Second pass: retry failed translations individually
  if (retryQueue.length > 0) {
    for (const { index, text } of retryQueue) {
      const res = await azureTranslateBatch([text], mapped);
      if (res.success) {
        translatedStrings[index] = {
          ...strings[index],
          translatedValue: res.data[0],
        };
      } else {
        aggregatedError = aggregatedError
          ? `${aggregatedError}; ${res.error}`
          : res.error;
        console.error(`Failed to translate string index ${index}:`, res.error);
        // fallback to original
        translatedStrings[index] = {
          ...strings[index],
          translatedValue: strings[index].value,
        };
      }
    }
  }

  // Fill any remaining gaps with original values
  translatedStrings.forEach((str, i) => {
    if (!str) {
      translatedStrings[i] = {
        ...strings[i],
        translatedValue: strings[i].value,
      };
    }
  });

  if (aggregatedError) {
    return { success: false, error: aggregatedError, data: translatedStrings };
  }

  return { success: true, data: translatedStrings };
};
