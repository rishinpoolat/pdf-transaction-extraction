/**
 * Tamil Property Transaction Parser
 * Extracts structured data from Tamil Encumbrance Certificate documents
 */

export interface ParsedTransaction {
  // Document details
  documentNumber?: string;
  documentYear?: string;

  // Dates
  executionDate?: string;
  presentationDate?: string;
  registrationDate?: string;

  // Transaction type
  nature?: string; // Conveyance, Sale Deed, etc.

  // Parties (English names extracted from translated text)
  executantName?: string; // Seller
  claimantName?: string;  // Buyer

  // Property details
  surveyNumber?: string;
  plotNumber?: string;
  village?: string;
  street?: string;
  propertyType?: string;
  propertyExtent?: string;

  // Financial
  considerationValue?: string;
  marketValue?: string;

  // Reference
  previousDocumentNumber?: string;
  volumeNumber?: string;
  pageNumber?: string;

  // Raw text
  rawText: string;
}

/**
 * Extract document number and year
 */
function extractDocumentNumber(text: string): { number?: string; year?: string } {
  // Pattern: 200/2013
  const match = text.match(/(\d+)\/(\d{4})/);
  return {
    number: match?.[1],
    year: match?.[2],
  };
}

/**
 * Extract dates (format: 06-Feb-2013)
 */
function extractDates(text: string): {
  execution?: string;
  presentation?: string;
  registration?: string;
} {
  const datePattern = /\d{2}-[A-Za-z]{3}-\d{4}/g;
  const dates = text.match(datePattern) || [];

  return {
    execution: dates[0],
    presentation: dates[1],
    registration: dates[2],
  };
}

/**
 * Extract transaction nature/type
 */
function extractNature(text: string): string | undefined {
  const natureMatch = text.match(/Nature\/தன்ைம\s+([\w\s\/]+)/);
  if (natureMatch) {
    const nature = natureMatch[1].trim();
    // Extract until next field
    return nature.split('\n')[0].trim();
  }

  // Alternative patterns
  if (text.includes('Conveyance')) return 'Conveyance';
  if (text.includes('Sale Deed')) return 'Sale Deed';
  if (text.includes('Gift Deed')) return 'Gift Deed';
  if (text.includes('Mortgage')) return 'Mortgage';

  return undefined;
}

/**
 * Extract executant name (seller) - tries English first, then Tamil
 */
function extractExecutantName(text: string, translatedText?: string): string | undefined {
  // Try to extract from English translated text first
  if (translatedText) {
    // Pattern: "Name of Executant(s)" in English translation
    const englishMatch = translatedText.match(/Name of (?:Executant|Executors?|Sellers?)\(?s?\)?[:\s]+(?:1\.\s*)?([^\n.]+?)(?:\s*(?:2\.|Address|Village|\n|$))/i);
    if (englishMatch) {
      let name = englishMatch[1].trim();
      // Clean up common artifacts
      name = name.replace(/\s*\([^)]*\)\s*$/, '');
      name = name.replace(/\s*-\s*$/, '');
      name = name.replace(/^["'\s]+|["'\s]+$/g, '');
      if (name.length > 2 && name.length < 200) {
        return name;
      }
    }
  }

  // Fallback to Tamil text pattern
  const tamilMatch = text.match(/Name of Executant\(s\)\/[\s\S]+?1\.\s*([^\n]+)/);
  if (tamilMatch) {
    let name = tamilMatch[1].trim();
    name = name.replace(/\s*\([^)]*\)\s*$/, '');
    return name;
  }

  return undefined;
}

/**
 * Extract claimant name (buyer) - tries English first, then Tamil
 */
function extractClaimantName(text: string, translatedText?: string): string | undefined {
  // Try to extract from English translated text first
  if (translatedText) {
    // Pattern: "Name of Claimant(s)" in English translation
    const englishMatch = translatedText.match(/Name of (?:Claimant|Claimants?|Buyers?)\(?s?\)?[:\s]+(?:1\.\s*)?([^\n.]+?)(?:\s*(?:2\.|Address|Village|Survey|\n|$))/i);
    if (englishMatch) {
      let name = englishMatch[1].trim();
      // Clean up common artifacts
      name = name.replace(/\s*\([^)]*\)\s*$/, '');
      name = name.replace(/\s*-\s*$/, '');
      name = name.replace(/^["'\s]+|["'\s]+$/g, '');
      if (name.length > 2 && name.length < 200) {
        return name;
      }
    }
  }

  // Fallback to Tamil text pattern
  const tamilMatch = text.match(/Name of Claimant\(s\)\/[\s\S]+?1\.\s*([^\n]+)/);
  if (tamilMatch) {
    let name = tamilMatch[1].trim();
    name = name.replace(/\s*-\s*$/, '').trim();
    return name;
  }

  return undefined;
}

/**
 * Extract survey number
 */
function extractSurveyNumber(text: string): string | undefined {
  // Pattern: Survey No./புல எண் : 329, 329/1, 330
  const surveyMatch = text.match(/Survey No\.\/புல எண்\s*:\s*([^\n]+)/);
  if (surveyMatch) {
    const raw = surveyMatch[1].trim();
    return cleanToEnglishOnly(raw);
  }

  // Alternative pattern from header
  const headerMatch = text.match(/Survey Details\s*\/சர்ேவ விவரம்\s*:\s*(\d+[\d,\/\s]*)/);
  if (headerMatch) {
    const raw = headerMatch[1].trim();
    return cleanToEnglishOnly(raw);
  }

  return undefined;
}

/**
 * Remove Tamil/non-English characters, keeping only numbers, commas, slashes, and basic punctuation
 */
function cleanToEnglishOnly(text: string): string {
  // Remove Tamil Unicode characters (U+0B80 to U+0BFF)
  let cleaned = text.replace(/[\u0B80-\u0BFF]/g, '');

  // Keep only: numbers, comma, slash, hyphen, period, space
  cleaned = cleaned.replace(/[^\d,\/\-.\s]/g, '');

  // Clean up extra whitespace
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Remove trailing/leading punctuation
  cleaned = cleaned.replace(/^[,\/\-.\s]+|[,\/\-.\s]+$/g, '');

  return cleaned || undefined;
}

/**
 * Extract English words from mixed English/Tamil text
 * Useful for fields that might have English names embedded in Tamil text
 */
function extractEnglishFromMixed(text: string): string | undefined {
  // Remove Tamil Unicode characters (U+0B80 to U+0BFF)
  let cleaned = text.replace(/[\u0B80-\u0BFF]/g, ' ');

  // Keep only: English letters, numbers, common punctuation, spaces
  cleaned = cleaned.replace(/[^a-zA-Z0-9,.\-\s()]/g, ' ');

  // Clean up multiple spaces
  cleaned = cleaned.replace(/\s+/g, ' ').trim();

  // Remove standalone single characters and numbers
  cleaned = cleaned.split(/\s+/).filter(word => word.length > 1).join(' ');

  // If result is too short or empty, return undefined
  if (!cleaned || cleaned.length < 3) {
    return undefined;
  }

  return cleaned;
}

/**
 * Extract plot number
 */
function extractPlotNumber(text: string): string | undefined {
  // Pattern: Plot No./மைன எண் : 57
  const plotMatch = text.match(/Plot No\.\/மைன எண்\s*:\s*([^\n]+)/);
  if (plotMatch) {
    const raw = plotMatch[1].trim();
    return cleanToEnglishOnly(raw);
  }

  return undefined;
}

/**
 * Extract village name - tries English first, then mixed text, then Tamil
 */
function extractVillage(text: string, translatedText?: string): string | undefined {
  // Try to extract from English translated text first
  if (translatedText) {
    const englishMatch = translatedText.match(/Village[:\s]+([A-Za-z\s]+?)(?:\s*(?:Survey|Plot|Street|Property|,|\n|$))/i);
    if (englishMatch) {
      const village = englishMatch[1].trim();
      if (village.length > 2 && village.length < 100 && /^[A-Za-z\s]+$/.test(village)) {
        return village;
      }
    }
  }

  // Try direct English extraction: Village /கிராமம் :Thiruvennainallur
  const villageMatch = text.match(/Village\s*\/கிராமம்\s*:([^\n]+)/);
  if (villageMatch) {
    const raw = villageMatch[1].trim();
    // Try to extract English words from mixed content
    const english = extractEnglishFromMixed(raw);
    if (english) {
      return english;
    }
    return raw;
  }

  // Alternative: Village & Street pattern
  const altMatch = text.match(/Village & Street\/கிராமம் மற்\s*றும் ெதரு:\s*([^,\n]+)/);
  if (altMatch) {
    const raw = altMatch[1].trim();
    const english = extractEnglishFromMixed(raw);
    return english || raw;
  }

  return undefined;
}

/**
 * Extract consideration value (transaction value)
 */
function extractConsiderationValue(text: string): string | undefined {
  // Pattern: Consideration Value/ைகமாற்றுத் ெதாைக: ரூ. 3,14,068/-
  const valueMatch = text.match(/Consideration Value[^\n]*ரூ\.\s*([\d,]+)/);
  if (valueMatch) {
    return valueMatch[1].trim();
  }

  return undefined;
}

/**
 * Extract market value
 */
function extractMarketValue(text: string): string | undefined {
  // Pattern: Market Value/சந்ைத மதிப் பு : ரூ. 3,14,068/-
  const valueMatch = text.match(/Market Value[^\n]*ரூ\.\s*([\d,]+)/);
  if (valueMatch) {
    return valueMatch[1].trim();
  }

  return undefined;
}

/**
 * Extract property type
 */
function extractPropertyType(text: string): string | undefined {
  // Pattern: Property Type/ெசாத்தின் வைகப்பா டு: House Site
  const typeMatch = text.match(/Property Type\/ெசாத்தின் வைகப்பா\s*டு:\s*([^\n]+)/);
  if (typeMatch) {
    return typeMatch[1].split('Property Extent')[0].trim();
  }

  return undefined;
}

/**
 * Extract property extent (area)
 */
function extractPropertyExtent(text: string): string | undefined {
  // Pattern: Property Extent/ெசாத்தின் விஸ்தீ ர் ணம் : 116.5 ச.மீட்ட ர்
  const extentMatch = text.match(/Property Extent\/[^\n]*:\s*([^\n]+)/);
  if (extentMatch) {
    return extentMatch[1].trim();
  }

  return undefined;
}

/**
 * Extract volume and page number
 */
function extractVolumeAndPage(text: string): { volume?: string; page?: string } {
  // Pattern: Vol.No & Page. No followed by numbers
  const match = text.match(/Vol\.No & Page\. No[^\n]*\n[^\n]*\n\s*(\d+)\s*\/\s*(\d+)/);

  return {
    volume: match?.[1],
    page: match?.[2],
  };
}

/**
 * Extract previous document number
 */
function extractPreviousDocNumber(text: string): string | undefined {
  // Pattern: PR Number/முந்ைத ய ஆவண எண் : 1537/ 2012, 2493/ 2008
  const match = text.match(/PR Number\/முந்ைத\s*ய ஆவண எண்\s*:\s*([^\n]+)/);
  if (match) {
    return match[1].trim();
  }

  return undefined;
}

/**
 * Extract street name from translated text
 */
function extractStreet(translatedText?: string): string | undefined {
  if (!translatedText) return undefined;

  const streetMatch = translatedText.match(/Street[:\s]+([A-Za-z\s]+?)(?:\s*(?:Survey|Plot|Village|Property|,|\n|$))/i);
  if (streetMatch) {
    const street = streetMatch[1].trim();
    if (street.length > 2 && street.length < 100 && /^[A-Za-z\s]+$/.test(street)) {
      return street;
    }
  }

  return undefined;
}

/**
 * Main parser function - extracts all transaction data
 * Now accepts optional translatedText to extract English names and locations
 */
export function parseTransactionText(text: string, translatedText?: string): ParsedTransaction {
  const docInfo = extractDocumentNumber(text);
  const dates = extractDates(text);
  const volumePage = extractVolumeAndPage(text);

  return {
    documentNumber: docInfo.number,
    documentYear: docInfo.year,

    executionDate: dates.execution,
    presentationDate: dates.presentation,
    registrationDate: dates.registration,

    nature: extractNature(text),

    // Extract English names from translated text when available
    executantName: extractExecutantName(text, translatedText),
    claimantName: extractClaimantName(text, translatedText),

    surveyNumber: extractSurveyNumber(text),
    plotNumber: extractPlotNumber(text),

    // Extract English village from translated text when available
    village: extractVillage(text, translatedText),
    street: extractStreet(translatedText),

    propertyType: extractPropertyType(text),
    propertyExtent: extractPropertyExtent(text),

    considerationValue: extractConsiderationValue(text),
    marketValue: extractMarketValue(text),

    previousDocumentNumber: extractPreviousDocNumber(text),
    volumeNumber: volumePage.volume,
    pageNumber: volumePage.page,

    rawText: text,
  };
}

/**
 * Split page text into individual transactions
 * Some pages may contain multiple transaction entries
 */
export function splitIntoTransactions(pageText: string): string[] {
  // Look for document number pattern to split transactions
  const transactions: string[] = [];

  // Split by document number pattern (e.g., "200/2013")
  const parts = pageText.split(/(?=\d{2,4}\/\d{4}\s+\d{2}-[A-Za-z]{3}-\d{4})/);

  for (const part of parts) {
    if (part.trim().length > 100) { // Minimum length for valid transaction
      transactions.push(part.trim());
    }
  }

  // If no splits found, return entire page as one transaction
  if (transactions.length === 0) {
    return [pageText];
  }

  return transactions;
}

export default {
  parseTransactionText,
  splitIntoTransactions,
};
