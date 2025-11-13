# PDF Transaction Extraction - Implementation Plan

## Overview
Extract, translate, and store 30 years of Tamil real-estate transactions from PDFs.

---

## Phase 1: Database Schema & Models ⏱️ 1-2 hours

### Tables Needed:

#### 1. `pdfs` table
```sql
- id (serial, primary key)
- filename (varchar)
- original_name (varchar)
- file_path (varchar)
- file_size (integer)
- upload_date (timestamp)
- status (enum: 'processing', 'completed', 'failed')
- uploaded_by (integer, foreign key to users if needed)
- created_at (timestamp)
- updated_at (timestamp)
```

#### 2. `transactions` table
```sql
- id (serial, primary key)
- pdf_id (integer, foreign key to pdfs)
-
-- Tamil fields (original)
- buyer_name_tamil (varchar)
- seller_name_tamil (varchar)
-
-- English fields (translated)
- buyer_name_english (varchar)
- seller_name_english (varchar)
-
-- Common fields
- house_number (varchar)
- survey_number (varchar)
- document_number (varchar)
- transaction_date (date)
- transaction_value (decimal)
-
-- Additional metadata
- page_number (integer) - which page in PDF
- raw_text (text) - original extracted text
-
-- Timestamps
- created_at (timestamp)
- updated_at (timestamp)
```

### Implementation:
- Create Drizzle schema
- Generate migrations
- Run migrations

---

## Phase 2: PDF Processing Backend ⏱️ 3-4 hours

### Libraries to Install:
```bash
# PDF parsing
npm install pdf-parse
npm install multer          # File upload handling
npm install @google-cloud/translate  # Translation (OR)
# npm install @aws-sdk/client-translate  # AWS Translate (OR)
# Use OpenAI API for translation (recommended for Tamil accuracy)

# File handling
npm install uuid            # Generate unique filenames
npm install mime-types      # File type validation
```

### API Endpoints:

#### 1. `POST /api/transactions/upload`
**Purpose:** Upload PDF, parse, translate, and save transactions

**Request:**
- Multipart form data
- File: PDF file
- Optional filters: buyer_name, seller_name, house_number, survey_number, document_number

**Response:**
```json
{
  "success": true,
  "data": {
    "pdf": { "id": 1, "filename": "...", "status": "completed" },
    "transactions": [
      {
        "id": 1,
        "buyer_name_english": "Ram Kumar",
        "buyer_name_tamil": "ராம் குமார்",
        "seller_name_english": "Lakshmi Devi",
        "seller_name_tamil": "லட்சுமி தேவி",
        "house_number": "12/34",
        "survey_number": "123",
        "document_number": "DOC-2024-001",
        "transaction_date": "2024-01-15",
        "transaction_value": 5000000
      }
    ],
    "total_transactions": 150,
    "filtered_transactions": 10
  }
}
```

#### 2. `GET /api/transactions`
**Purpose:** Search/filter existing transactions

**Query Params:**
- buyer_name
- seller_name
- house_number
- survey_number
- document_number
- start_date
- end_date
- limit, offset (pagination)

#### 3. `GET /api/transactions/:id`
**Purpose:** Get single transaction details

#### 4. `GET /api/pdfs/:id/download`
**Purpose:** Download/view original PDF

---

## Phase 3: PDF Parsing Strategy ⏱️ 2-3 hours

### Approach Options:

#### **Option A: Text-based PDF (Recommended if applicable)**
If PDF contains actual text (not scanned images):

```javascript
import pdf from 'pdf-parse';

async function extractTextFromPDF(buffer) {
  const data = await pdf(buffer);
  return data.text; // Full text content
}
```

**Pros:** Fast, accurate, simple
**Cons:** Only works if PDF has embedded text

#### **Option B: OCR for Scanned PDFs**
If PDF is scanned images:

```bash
npm install tesseract.js
```

```javascript
import Tesseract from 'tesseract.js';

async function performOCR(pdfBuffer) {
  // Convert PDF to images first (use pdf-poppler or pdf2pic)
  // Then run OCR on each page
  const result = await Tesseract.recognize(imageBuffer, 'tam+eng');
  return result.data.text;
}
```

**Pros:** Works with scanned documents
**Cons:** Slower, less accurate, needs training for Tamil

#### **Option C: Hybrid Approach (Recommended)**
Try text extraction first, fallback to OCR if needed.

---

## Phase 4: Translation Strategy ⏱️ 2-3 hours

### **Option A: Google Cloud Translate API** (Most Accurate)
```bash
npm install @google-cloud/translate
```

```javascript
import { Translate } from '@google-cloud/translate/v2';

const translate = new Translate({
  key: process.env.GOOGLE_TRANSLATE_API_KEY
});

async function translateTamilToEnglish(text) {
  const [translation] = await translate.translate(text, 'en');
  return translation;
}
```

**Cost:** ~$20 per 1M characters
**Accuracy:** Very high for Tamil

### **Option B: OpenAI API** (Best for Context-Aware)
```javascript
import OpenAI from 'openai';

async function translateWithOpenAI(tamilText) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{
      role: 'system',
      content: 'Translate Tamil real estate transaction data to English. Preserve names and numbers accurately.'
    }, {
      role: 'user',
      content: tamilText
    }]
  });

  return response.choices[0].message.content;
}
```

**Cost:** Variable (~$0.03 per 1K tokens)
**Accuracy:** Excellent, understands context

### **Option C: Libre Translate** (Free, Self-hosted)
```bash
npm install libretranslate
```

**Cost:** Free
**Accuracy:** Lower for Tamil
**Setup:** Requires Docker container

### **Option D: Manual Mapping** (For Structured Data)
If field names are consistent:
```javascript
const tamilToEnglishMap = {
  'வாங்குபவர்': 'buyer',
  'விற்பவர்': 'seller',
  // ... more mappings
};
```

---

## Phase 5: Data Extraction Logic ⏱️ 3-4 hours

### Pattern Recognition:

1. **Use Regex Patterns** for structured data:
```javascript
const patterns = {
  documentNumber: /Document\s*No[.:]?\s*([A-Z0-9-]+)/i,
  houseNumber: /House\s*No[.:]?\s*(\d+\/\d+|\d+)/i,
  surveyNumber: /Survey\s*No[.:]?\s*(\d+)/i,
  date: /Date[.:]?\s*(\d{1,2}[-\/]\d{1,2}[-\/]\d{2,4})/i,
  amount: /Rs[.:]?\s*([\d,]+)/i,
};
```

2. **Extract Transactions:**
```javascript
function extractTransactions(text) {
  // Split by transaction markers
  const transactions = text.split(/Transaction \d+/i);

  return transactions.map(block => {
    const buyer = extractName(block, 'buyer');
    const seller = extractName(block, 'seller');
    const houseNo = patterns.houseNumber.exec(block)?.[1];
    // ... extract all fields

    return {
      buyer_name_tamil: buyer.tamil,
      buyer_name_english: buyer.english,
      seller_name_tamil: seller.tamil,
      seller_name_english: seller.english,
      house_number: houseNo,
      // ...
    };
  });
}
```

3. **Handle Edge Cases:**
   - Missing fields → null or default values
   - Date format variations → normalize to ISO format
   - Currency symbols → parse to decimal

---

## Phase 6: Frontend UI ⏱️ 4-5 hours

### Components Needed:

#### 1. **PDF Upload Component**
```tsx
// components/pdf/upload-form.tsx
- Drag & drop zone
- File type validation (.pdf only)
- File size limit (e.g., 50MB)
- Progress indicator
- Preview thumbnail
```

#### 2. **PDF Viewer Component**
```bash
npm install react-pdf
# OR
npm install @react-pdf-viewer/core
```

```tsx
// components/pdf/pdf-viewer.tsx
- Display uploaded PDF
- Zoom controls
- Page navigation
- Highlight extracted sections (optional)
```

#### 3. **Search/Filter Component**
```tsx
// components/transactions/search-filters.tsx
- Input fields for all search criteria
- Date range picker
- Clear filters button
- Search button
```

#### 4. **Results Table Component**
```tsx
// components/transactions/results-table.tsx
- Sortable columns
- Pagination
- Row actions (view details, download)
- Export to CSV (bonus)
```

#### 5. **Transaction Details Modal**
```tsx
// components/transactions/transaction-detail.tsx
- Full transaction info
- Original Tamil + English translation
- Link to source PDF with page number
```

### Layout:
```
┌─────────────────────────────────────┐
│  Header (with user, logout)         │
├─────────────────────────────────────┤
│  Upload PDF Section                 │
│  [Drag & Drop or Browse]            │
├──────────────────┬──────────────────┤
│  PDF Preview     │  Results Table   │
│  (Left Panel)    │  (Right Panel)   │
│                  │                  │
│  - Zoom          │  - Filters       │
│  - Navigate      │  - Pagination    │
│                  │  - Sort          │
└──────────────────┴──────────────────┘
```

---

## Phase 7: File Storage ⏱️ 1-2 hours

### **Option A: Local Filesystem** (Simplest for MVP)
```javascript
// backend/src/config/storage.ts
import path from 'path';
import fs from 'fs/promises';

const UPLOAD_DIR = path.join(__dirname, '../../uploads/pdfs');

export async function savePDF(file) {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = path.join(UPLOAD_DIR, filename);
  await fs.writeFile(filepath, file.buffer);
  return { filename, filepath };
}
```

Add to `.gitignore`:
```
uploads/
```

### **Option B: Cloud Storage** (Production-ready)
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

---

## Phase 8: Testing & Validation ⏱️ 2-3 hours

### Test Cases:
1. Upload valid PDF → Success
2. Upload non-PDF → Validation error
3. Upload large PDF (>50MB) → Size limit error
4. Search with filters → Correct results
5. No matches found → Empty state
6. PDF with no transactions → Handle gracefully
7. Malformed PDF → Error handling

---

## Suggested Development Order:

### **Week 1 - Backend Foundation**
- [x] Day 1-2: Database schema & migrations
- [ ] Day 3: File upload endpoint (no processing)
- [ ] Day 4: PDF text extraction
- [ ] Day 5: Translation integration
- [ ] Day 6: Data extraction logic
- [ ] Day 7: Testing & refinement

### **Week 2 - Frontend & Integration**
- [ ] Day 8: Upload UI component
- [ ] Day 9: PDF viewer component
- [ ] Day 10: Results table & filters
- [ ] Day 11: Integration & testing
- [ ] Day 12: Error handling & edge cases
- [ ] Day 13: UI polish & UX improvements
- [ ] Day 14: Final testing & documentation

---

## Technology Stack Summary:

### **Backend:**
- Express.js ✅
- Drizzle ORM ✅
- PostgreSQL ✅
- Multer (file upload)
- pdf-parse (PDF extraction)
- Google Translate API OR OpenAI (translation)
- Zod (validation) ✅

### **Frontend:**
- Next.js 16 ✅
- Tailwind CSS ✅
- react-pdf (PDF viewer)
- react-hook-form ✅
- Sonner (toasts) ✅

---

## Cost Estimates:

### Translation Costs (for 30 years of data):
Assuming ~1000 pages, ~500 words/page = 500,000 words

- **Google Translate:** ~$10-20 one-time
- **OpenAI GPT-4:** ~$50-100 one-time
- **Libre Translate:** Free (self-hosted)

### Storage:
- Local: Free
- AWS S3: ~$1-5/month for PDFs

---

## Recommended Approach:

### **For MVP (Minimal Viable Product):**
1. ✅ Database schema with Drizzle
2. ✅ File upload with Multer
3. ✅ pdf-parse for text extraction
4. ✅ OpenAI API for translation (most accurate)
5. ✅ Regex patterns for data extraction
6. ✅ Local filesystem storage
7. ✅ Basic Next.js UI with react-pdf

### **For Production:**
1. ✅ Add error handling & logging
2. ✅ Implement background job processing (Bull + Redis)
3. ✅ Cloud storage (S3)
4. ✅ Caching layer (Redis)
5. ✅ Rate limiting on upload endpoint
6. ✅ Pagination & search optimization
7. ✅ Unit & integration tests

---

## Next Steps:

1. **Start with database schema** - Create transactions and pdfs tables
2. **Test PDF parsing** - Upload a sample Tamil PDF and test extraction
3. **Choose translation strategy** - Based on budget and accuracy needs
4. **Build upload API** - Integrate all pieces
5. **Create UI** - Build upload form and results display

---

## Questions to Answer:

1. **Do you have sample Tamil PDFs to test with?**
2. **What's your translation budget?** (Free, $20, $100+)
3. **Is the PDF text-based or scanned images?**
4. **Are transaction formats consistent across 30 years?**
5. **Do you need real-time processing or background jobs?**

Let me know your preferences and I'll help implement!
