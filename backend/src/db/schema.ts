import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  bigint,
  timestamp,
  decimal,
  index,
} from "drizzle-orm/pg-core";

/**
 * Blacklist table - stores invalidated JWT tokens for logout functionality
 * Tokens added here are considered invalid even if not expired
 */
export const blacklist = pgTable("blacklist", {
  id: serial("id").primaryKey(),
  token: varchar("token", { length: 500 }).notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pdfs = pgTable(
  "pdfs",
  {
    id: serial("id").primaryKey(),
    filename: varchar("filename", { length: 255 }).notNull().unique(),
    originalName: varchar("original_name", { length: 255 }).notNull(),
    filePath: varchar("file_path", { length: 512 }).notNull(),
    fileSize: bigint("file_size", { mode: "number" }).notNull(),
    mimeType: varchar("mime_type", { length: 100 })
      .notNull()
      .default("application/pdf"),
    processingStatus: varchar("processing_status", { length: 50 }).default(
      "pending"
    ), // pending, queued, processing, completed, failed
    totalPages: integer("total_pages").default(0),
    processedPages: integer("processed_pages").default(0),
    totalTransactions: integer("total_transactions").default(0),
    progressPercentage: integer("progress_percentage").default(0),
    currentStep: varchar("current_step", { length: 100 }), // parsing, translating, storing
    jobId: varchar("job_id", { length: 255 }), // BullMQ job ID
    uploadedAt: timestamp("uploaded_at").defaultNow(),
    processedAt: timestamp("processed_at"),
    errorMessage: text("error_message"),
  },
  (table) => ({
    statusIdx: index("idx_pdfs_status").on(table.processingStatus),
    uploadedAtIdx: index("idx_pdfs_uploaded_at").on(table.uploadedAt),
    jobIdIdx: index("idx_pdfs_job_id").on(table.jobId),
  })
);

// Transactions table - stores extracted transactions
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    pdfId: integer("pdf_id")
      .notNull()
      .references(() => pdfs.id, { onDelete: "cascade" }),

    // Tamil fields
    buyerNameTamil: text("buyer_name_tamil"),
    sellerNameTamil: text("seller_name_tamil"),
    houseNumberTamil: varchar("house_number_tamil", { length: 100 }),
    surveyNumberTamil: varchar("survey_number_tamil", { length: 100 }),
    documentNumberTamil: varchar("document_number_tamil", { length: 100 }),

    // English fields
    buyerNameEnglish: text("buyer_name_english"),
    sellerNameEnglish: text("seller_name_english"),
    houseNumberEnglish: varchar("house_number_english", { length: 100 }),
    surveyNumberEnglish: varchar("survey_number_english", { length: 100 }),
    documentNumberEnglish: varchar("document_number_english", { length: 100 }),

    // Common fields
    transactionDate: timestamp("transaction_date", { mode: "date" }),
    transactionValue: decimal("transaction_value", { precision: 15, scale: 2 }),

    // Text content
    originalText: text("original_text").notNull(),
    translatedText: text("translated_text"),

    // Metadata
    pageNumber: integer("page_number"),
    extractionConfidence: decimal("extraction_confidence", {
      precision: 3,
      scale: 2,
    }),
    createdAt: timestamp("created_at").defaultNow(),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => ({
    pdfIdIdx: index("idx_transactions_pdf_id").on(table.pdfId),
    buyerTamilIdx: index("idx_transactions_buyer_tamil").on(
      table.buyerNameTamil
    ),
    buyerEnglishIdx: index("idx_transactions_buyer_english").on(
      table.buyerNameEnglish
    ),
    sellerTamilIdx: index("idx_transactions_seller_tamil").on(
      table.sellerNameTamil
    ),
    sellerEnglishIdx: index("idx_transactions_seller_english").on(
      table.sellerNameEnglish
    ),
    houseNumberIdx: index("idx_transactions_house_number").on(
      table.houseNumberTamil,
      table.houseNumberEnglish
    ),
    surveyNumberIdx: index("idx_transactions_survey_number").on(
      table.surveyNumberTamil,
      table.surveyNumberEnglish
    ),
    documentNumberIdx: index("idx_transactions_document_number").on(
      table.documentNumberTamil,
      table.documentNumberEnglish
    ),
    dateIdx: index("idx_transactions_date").on(table.transactionDate),
  })
);

// Types for Drizzle ORM
export type Pdf = typeof pdfs.$inferSelect;
export type NewPdf = typeof pdfs.$inferInsert;
export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;

// Type exports for use in application code
export type BlacklistToken = typeof blacklist.$inferSelect;
export type NewBlacklistToken = typeof blacklist.$inferInsert;
