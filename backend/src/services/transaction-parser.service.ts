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

  // Parties
  executantName?: string; // Seller (எழுதிக்கொடுத்தவர்)
  claimantName?: string;  // Buyer (எழுதி வாங்கியவர்)

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
 * Extract executant name (seller)
 */
function extractExecutantName(text: string): string | undefined {
  // Pattern: Name of Executant(s) followed by Tamil names
  const executantMatch = text.match(/Name of Executant\(s\)\/[\s\S]+?1\.\s*([^\n]+)/);
  if (executantMatch) {
    let name = executantMatch[1].trim();
    // Clean up extra info in parentheses at end
    name = name.replace(/\s*\([^)]*\)\s*$/, '');
    return name;
  }

  return undefined;
}

/**
 * Extract claimant name (buyer)
 */
function extractClaimantName(text: string): string | undefined {
  // Pattern: Name of Claimant(s) followed by Tamil names
  const claimantMatch = text.match(/Name of Claimant\(s\)\/[\s\S]+?1\.\s*([^\n]+)/);
  if (claimantMatch) {
    let name = claimantMatch[1].trim();
    // Clean up
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
    return surveyMatch[1].trim();
  }

  // Alternative pattern from header
  const headerMatch = text.match(/Survey Details\s*\/சர்ேவ விவரம்\s*:\s*(\d+[\d,\/\s]*)/);
  if (headerMatch) {
    return headerMatch[1].trim();
  }

  return undefined;
}

/**
 * Extract plot number
 */
function extractPlotNumber(text: string): string | undefined {
  // Pattern: Plot No./மைன எண் : 57
  const plotMatch = text.match(/Plot No\.\/மைன எண்\s*:\s*([^\n]+)/);
  if (plotMatch) {
    return plotMatch[1].trim();
  }

  return undefined;
}

/**
 * Extract village name
 */
function extractVillage(text: string): string | undefined {
  // Pattern: Village /கிராமம் :Thiruvennainallur
  const villageMatch = text.match(/Village\s*\/கிராமம்\s*:([^\s]+)/);
  if (villageMatch) {
    return villageMatch[1].trim();
  }

  // Alternative: Village & Street pattern
  const altMatch = text.match(/Village & Street\/கிராமம் மற்\s*றும் ெதரு:\s*([^,\n]+)/);
  if (altMatch) {
    return altMatch[1].trim();
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
 * Main parser function - extracts all transaction data
 */
export function parseTransactionText(text: string): ParsedTransaction {
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

    executantName: extractExecutantName(text),
    claimantName: extractClaimantName(text),

    surveyNumber: extractSurveyNumber(text),
    plotNumber: extractPlotNumber(text),
    village: extractVillage(text),
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
