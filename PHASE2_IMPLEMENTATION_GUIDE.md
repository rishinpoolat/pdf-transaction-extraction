# 🚀 Phase 2: PDF Processing Implementation Guide

## ✅ Decision: Use `pdf-parse` (NO OCR NEEDED!)

Your Tamil PDFs are **text-based** (selectable text), so we'll use `pdf-parse` instead of OCR.

---

## 📦 Step 1: Install Required Packages

```bash
cd backend
npm install pdf-parse multer @google-cloud/translate
npm install --save-dev @types/multer @types/pdf-parse
```

---

## 🗄️ Step 2: Database Schema

### Create migration file: `backend/src/db/schema/phase2.ts`

```typescript
import { pgTable, serial, text, integer, timestamp, decimal } from 'drizzle-orm/pg-core';

// PDFs table
export const pdfs = pgTable('pdfs', {
  id: serial('id').primaryKey(),
  filename: text('filename').notNull().unique(),
  originalName: text('original_name').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size').notNull(),
  mimeType: text('mime_type').notNull(),
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Transactions table
export const transactions = pgTable('transactions', {
  id: serial('id').primaryKey(),
  pdfId: integer('pdf_id').references(() => pdfs.id).notNull(),
  
  // Extracted fields
  buyerName: text('buyer_name'),
  sellerName: text('seller_name'),
  houseNumber: text('house_number'),
  surveyNumber: text('survey_number'),
  documentNumber: text('document_number').notNull(),
  transactionDate: text('transaction_date'),
  transactionValue: text('transaction_value'),
  
  // Additional fields
  nature: text('nature'),
  plotNumber: text('plot_number'),
  propertyType: text('property_type'),
  propertyExtent: text('property_extent'),
  village: text('village'),
  
  // Text content
  originalText: text('original_text').notNull(),
  translatedText: text('translated_text'),
  
  // Metadata
  pageNumber: integer('page_number'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Pdf = typeof pdfs.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
export type NewPdf = typeof pdfs.$inferInsert;
export type NewTransaction = typeof transactions.$inferInsert;
```

### Run migration:

```bash
cd backend
npm run db:generate
npm run db:migrate
```

---

## 📂 Step 3: Create Directory Structure

```bash
mkdir -p uploads/pdfs
mkdir -p src/services
mkdir -p src/routes
mkdir -p src/middleware
mkdir -p src/utils
```

---

## 🔧 Step 4: Environment Variables

Add to `backend/.env`:

```env
# Existing variables...

# Phase 2: PDF Processing
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=./config/google-cloud-key.json
MAX_FILE_SIZE=10485760
UPLOAD_DIR=uploads/pdfs
```

---

## 📝 Step 5: PDF Parsing Service

### Create `backend/src/services/pdfParser.ts`

```typescript
import pdf from 'pdf-parse';
import fs from 'fs/promises';

export interface ParsedTransaction {
  documentNumber: string;
  transactionDate: string;
  nature: string;
  sellerNames: string[];
  buyerNames: string[];
  considerationValue: string;
  marketValue: string;
  surveyNumbers: string[];
  plotNumber?: string;
  propertyType?: string;
  propertyExtent?: string;
  village?: string;
  originalText: string;
}

export class PDFParserService {
  /**
   * Extract text from PDF file
   */
  async extractText(filePath: string): Promise<string> {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  }

  /**
   * Parse transactions from extracted text
   */
  parseTransactions(text: string): ParsedTransaction[] {
    const transactions: ParsedTransaction[] = [];
    
    // Split by transaction boundaries
    // Look for serial numbers followed by document numbers
    const transactionBlocks = this.splitIntoTransactions(text);
    
    for (const block of transactionBlocks) {
      try {
        const transaction = this.parseTransaction(block);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.error('Error parsing transaction block:', error);
      }
    }
    
    return transactions;
  }

  /**
   * Split text into individual transaction blocks
   */
  private splitIntoTransactions(text: string): string[] {
    const blocks: string[] = [];
    const lines = text.split('\n');
    let currentBlock: string[] = [];
    let inTransaction = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if this line is a serial number (transaction start)
      const isSerialNumber = /^(\d+)$/.test(line) && 
                             i + 1 < lines.length && 
                             lines[i + 1].includes('/');
      
      if (isSerialNumber && inTransaction) {
        // Save previous transaction
        blocks.push(currentBlock.join('\n'));
        currentBlock = [line];
      } else if (isSerialNumber) {
        // Start new transaction
        inTransaction = true;
        currentBlock = [line];
      } else if (inTransaction) {
        currentBlock.push(line);
      }
    }
    
    // Add last transaction
    if (currentBlock.length > 0) {
      blocks.push(currentBlock.join('\n'));
    }
    
    return blocks;
  }

  /**
   * Parse individual transaction from text block
   */
  private parseTransaction(block: string): ParsedTransaction | null {
    // Document Number extraction (e.g., "200/2013")
    const docNumMatch = block.match(/(\d+\/\d{4})/);
    if (!docNumMatch) return null;
    
    const documentNumber = docNumMatch[1];
    
    // Date extraction (e.g., "06-Feb-2013")
    const dateMatch = block.match(/(\d{2}-\w{3}-\d{4})/);
    const transactionDate = dateMatch ? dateMatch[1] : '';
    
    // Nature extraction (e.g., "Conveyance Non Metro/UA")
    const natureMatch = block.match(/(Conveyance[^\n]+)/);
    const nature = natureMatch ? natureMatch[1].trim() : '';
    
    // Seller names (after "Name of Executant(s)")
    const sellersMatch = block.match(/Name of Executant\(s\).*?\n([\s\S]*?)Name of Claimant/);
    const sellerNames = sellersMatch ? this.extractNames(sellersMatch[1]) : [];
    
    // Buyer names (after "Name of Claimant(s)")
    const buyersMatch = block.match(/Name of Claimant\(s\).*?\n([\s\S]*?)Vol\.No/);
    const buyerNames = buyersMatch ? this.extractNames(buyersMatch[1]) : [];
    
    // Consideration Value
    const considMatch = block.match(/Consideration Value.*?ரூ\.\s*([\d,]+)/);
    const considerationValue = considMatch ? considMatch[1] : '';
    
    // Market Value
    const marketMatch = block.match(/Market Value.*?ரூ\.\s*([\d,]+)/);
    const marketValue = marketMatch ? marketMatch[1] : '';
    
    // Survey Numbers
    const surveyMatch = block.match(/Survey No.*?:\s*([^\n]+)/);
    const surveyNumbers = surveyMatch ? surveyMatch[1].split(',').map(s => s.trim()) : [];
    
    // Plot Number
    const plotMatch = block.match(/Plot No.*?:\s*([^\n]+)/);
    const plotNumber = plotMatch ? plotMatch[1].trim() : undefined;
    
    // Property Type
    const propTypeMatch = block.match(/Property Type.*?:\s*([^\n]+)/);
    const propertyType = propTypeMatch ? propTypeMatch[1].trim() : undefined;
    
    // Property Extent
    const extentMatch = block.match(/Property Extent.*?:\s*([^\n]+)/);
    const propertyExtent = extentMatch ? extentMatch[1].trim() : undefined;
    
    // Village
    const villageMatch = block.match(/Village.*?:\s*([^\n,]+)/);
    const village = villageMatch ? villageMatch[1].trim() : undefined;
    
    return {
      documentNumber,
      transactionDate,
      nature,
      sellerNames,
      buyerNames,
      considerationValue,
      marketValue,
      surveyNumbers,
      plotNumber,
      propertyType,
      propertyExtent,
      village,
      originalText: block,
    };
  }

  /**
   * Extract individual names from Tamil/English text
   */
  private extractNames(text: string): string[] {
    const names: string[] = [];
    const lines = text.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.match(/^[\d\.]+$/) && trimmed.length > 2) {
        // Remove numbering (e.g., "1. " or "2. ")
        const cleaned = trimmed.replace(/^\d+\.\s*/, '');
        if (cleaned) {
          names.push(cleaned);
        }
      }
    }
    
    return names;
  }
}
```

---

## 🌐 Step 6: Translation Service

### Create `backend/src/services/translator.ts`

```typescript
import { Translate } from '@google-cloud/translate/build/src/v2';

export class TranslationService {
  private translate: Translate;

  constructor() {
    this.translate = new Translate({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    });
  }

  /**
   * Translate Tamil text to English
   */
  async translateToEnglish(text: string): Promise<string> {
    if (!text || text.trim().length === 0) {
      return '';
    }

    try {
      const [translation] = await this.translate.translate(text, {
        from: 'ta', // Tamil
        to: 'en',   // English
      });
      
      return translation;
    } catch (error) {
      console.error('Translation error:', error);
      return text; // Return original text if translation fails
    }
  }

  /**
   * Translate multiple texts in batch
   */
  async batchTranslate(texts: string[]): Promise<string[]> {
    const filteredTexts = texts.filter(t => t && t.trim().length > 0);
    
    if (filteredTexts.length === 0) {
      return texts.map(() => '');
    }

    try {
      const [translations] = await this.translate.translate(filteredTexts, {
        from: 'ta',
        to: 'en',
      });
      
      return Array.isArray(translations) ? translations : [translations];
    } catch (error) {
      console.error('Batch translation error:', error);
      return texts; // Return original texts if translation fails
    }
  }
}
```

---

## 📤 Step 7: File Upload Middleware

### Create `backend/src/middleware/upload.ts`

```typescript
import multer from 'multer';
import path from 'path';
import { Request } from 'express';
import crypto from 'crypto';

const MAX_FILE_SIZE = parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB
const UPLOAD_DIR = process.env.UPLOAD_DIR || 'uploads/pdfs';

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-randomhash.pdf
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Accept only PDFs
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed'));
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
});
```

---

## 🛣️ Step 8: PDF Routes

### Create `backend/src/routes/pdf.routes.ts`

```typescript
import { Router } from 'express';
import { upload } from '../middleware/upload';
import { PDFController } from '../controllers/pdf.controller';
import { authenticateToken } from '../middleware/auth';

const router = Router();
const pdfController = new PDFController();

// All routes require authentication
router.use(authenticateToken);

// Upload and process PDF
router.post('/upload', upload.single('pdf'), pdfController.uploadPDF);

// Get all transactions with filters
router.get('/transactions', pdfController.getTransactions);

// Get single transaction
router.get('/transactions/:id', pdfController.getTransaction);

// Get PDF metadata
router.get('/:id', pdfController.getPDF);

// Serve PDF file for preview
router.get('/:id/file', pdfController.getPDFFile);

export default router;
```

---

## 🎮 Step 9: PDF Controller

### Create `backend/src/controllers/pdf.controller.ts`

```typescript
import { Request, Response } from 'express';
import { db } from '../db';
import { pdfs, transactions } from '../db/schema/phase2';
import { PDFParserService } from '../services/pdfParser';
import { TranslationService } from '../services/translator';
import { eq, or, ilike, and } from 'drizzle-orm';
import fs from 'fs/promises';
import path from 'path';

export class PDFController {
  private pdfParser: PDFParserService;
  private translator: TranslationService;

  constructor() {
    this.pdfParser = new PDFParserService();
    this.translator = new TranslationService();
  }

  /**
   * Upload and process PDF
   */
  uploadPDF = async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      // Save PDF metadata to database
      const [pdf] = await db.insert(pdfs).values({
        filename: req.file.filename,
        originalName: req.file.originalname,
        filePath: req.file.path,
        fileSize: req.file.size,
        mimeType: req.file.mimetype,
      }).returning();

      // Extract text from PDF
      const text = await this.pdfParser.extractText(req.file.path);
      
      // Parse transactions
      const parsedTransactions = this.pdfParser.parseTransactions(text);
      
      // Translate and insert transactions
      const insertedTransactions = [];
      
      for (const parsed of parsedTransactions) {
        // Translate original text
        const translatedText = await this.translator.translateToEnglish(
          parsed.originalText
        );
        
        const [transaction] = await db.insert(transactions).values({
          pdfId: pdf.id,
          documentNumber: parsed.documentNumber,
          transactionDate: parsed.transactionDate,
          nature: parsed.nature,
          sellerName: parsed.sellerNames.join(', '),
          buyerName: parsed.buyerNames.join(', '),
          transactionValue: parsed.considerationValue,
          surveyNumber: parsed.surveyNumbers.join(', '),
          plotNumber: parsed.plotNumber,
          propertyType: parsed.propertyType,
          propertyExtent: parsed.propertyExtent,
          village: parsed.village,
          houseNumber: parsed.plotNumber, // Using plot number as house number
          originalText: parsed.originalText,
          translatedText,
          pageNumber: 1, // TODO: Track actual page numbers
        }).returning();
        
        insertedTransactions.push(transaction);
      }

      res.status(201).json({
        message: 'PDF uploaded and processed successfully',
        pdf,
        transactionsCount: insertedTransactions.length,
        transactions: insertedTransactions,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to process PDF' });
    }
  };

  /**
   * Get transactions with filters
   */
  getTransactions = async (req: Request, res: Response) => {
    try {
      const {
        buyerName,
        sellerName,
        houseNumber,
        surveyNumber,
        documentNumber,
        page = '1',
        limit = '20',
      } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      // Build filters
      const filters = [];
      if (buyerName) {
        filters.push(ilike(transactions.buyerName, `%${buyerName}%`));
      }
      if (sellerName) {
        filters.push(ilike(transactions.sellerName, `%${sellerName}%`));
      }
      if (houseNumber) {
        filters.push(ilike(transactions.houseNumber, `%${houseNumber}%`));
      }
      if (surveyNumber) {
        filters.push(ilike(transactions.surveyNumber, `%${surveyNumber}%`));
      }
      if (documentNumber) {
        filters.push(ilike(transactions.documentNumber, `%${documentNumber}%`));
      }

      // Query with filters
      const whereClause = filters.length > 0 ? and(...filters) : undefined;
      
      const results = await db
        .select()
        .from(transactions)
        .where(whereClause)
        .limit(limitNum)
        .offset(offset)
        .orderBy(transactions.createdAt);

      // Get total count
      const countResult = await db
        .select({ count: transactions.id })
        .from(transactions)
        .where(whereClause);
      
      const total = countResult.length;

      res.json({
        transactions: results,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Get transactions error:', error);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  };

  /**
   * Get single transaction
   */
  getTransaction = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [transaction] = await db
        .select()
        .from(transactions)
        .where(eq(transactions.id, parseInt(id)));

      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }

      res.json(transaction);
    } catch (error) {
      console.error('Get transaction error:', error);
      res.status(500).json({ error: 'Failed to fetch transaction' });
    }
  };

  /**
   * Get PDF metadata
   */
  getPDF = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [pdf] = await db
        .select()
        .from(pdfs)
        .where(eq(pdfs.id, parseInt(id)));

      if (!pdf) {
        return res.status(404).json({ error: 'PDF not found' });
      }

      res.json(pdf);
    } catch (error) {
      console.error('Get PDF error:', error);
      res.status(500).json({ error: 'Failed to fetch PDF' });
    }
  };

  /**
   * Serve PDF file
   */
  getPDFFile = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const [pdf] = await db
        .select()
        .from(pdfs)
        .where(eq(pdfs.id, parseInt(id)));

      if (!pdf) {
        return res.status(404).json({ error: 'PDF not found' });
      }

      // Check if file exists
      const filePath = path.resolve(pdf.filePath);
      await fs.access(filePath);

      // Set headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${pdf.originalName}"`);

      // Stream file
      const fileStream = await fs.readFile(filePath);
      res.send(fileStream);
    } catch (error) {
      console.error('Get PDF file error:', error);
      res.status(500).json({ error: 'Failed to serve PDF file' });
    }
  };
}
```

---

## 🔗 Step 10: Update Main Server

### Update `backend/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import pdfRoutes from './routes/pdf.routes'; // NEW
import path from 'path';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());

// Serve static files (for PDF preview)
app.use('/uploads', express.static(path.join(__dirname, '../uploads'))); // NEW

// Routes
app.use('/auth', authRoutes);
app.use('/api/pdf', pdfRoutes); // NEW

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

---

## 🧪 Step 11: Testing

### Test with your sample PDF:

```bash
# 1. Start the server
npm run dev

# 2. Test upload (replace TOKEN with your JWT)
curl -X POST http://localhost:3000/api/pdf/upload \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "pdf=@/path/to/your/tamil-pdf.pdf"

# 3. Test search
curl "http://localhost:3000/api/pdf/transactions?buyerName=நித்யா" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# 4. Get PDF file
curl http://localhost:3000/api/pdf/1/file \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  --output test.pdf
```

---

## 🎨 Next Steps

After backend is working:

1. **Frontend Upload Page** - Drag-drop PDF upload
2. **Transactions Table** - Display with filters
3. **PDF Preview** - Side-by-side view with transaction details
4. **Google Cloud Setup** - Configure translation API

---

## 📚 Key Points

✅ **NO OCR needed** - Your PDFs have selectable text  
✅ **Fast processing** - pdf-parse is much faster than OCR  
✅ **Accurate extraction** - Regex-based parsing for structured data  
✅ **Scalable** - Can handle hundreds of transactions per PDF  
✅ **Tamil Support** - Google Translate handles Tamil well  

---

## 🚨 Important Notes

1. **Test with real PDFs early** - Regex patterns may need adjustments
2. **Monitor Google Cloud costs** - Translation API charges per character
3. **Error handling** - Some PDFs may have different formats
4. **Performance** - Large PDFs (>1000 pages) may need optimization
5. **Security** - Always validate file uploads

---

## 📞 Need Help?

If parsing doesn't work perfectly:
1. Share a sample PDF
2. I'll refine the regex patterns
3. Adjust the `parseTransaction` method

**Ready to implement! 🚀**
