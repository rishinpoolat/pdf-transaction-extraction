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

// Transactions table - stores extracted transactions (English only)
export const transactions = pgTable(
  "transactions",
  {
    id: serial("id").primaryKey(),
    pdfId: integer("pdf_id")
      .notNull()
      .references(() => pdfs.id, { onDelete: "cascade" }),

    // Party names (English)
    buyerName: text("buyer_name"),
    sellerName: text("seller_name"),

    // Document details
    documentNumber: varchar("document_number", { length: 100 }),
    documentYear: varchar("document_year", { length: 10 }),
    executionDate: varchar("execution_date", { length: 50 }),
    presentationDate: varchar("presentation_date", { length: 50 }),
    registrationDate: varchar("registration_date", { length: 50 }),
    transactionNature: varchar("transaction_nature", { length: 100 }),

    // Property details (English)
    surveyNumber: varchar("survey_number", { length: 100 }),
    plotNumber: varchar("plot_number", { length: 100 }),
    village: varchar("village", { length: 200 }),
    street: varchar("street", { length: 200 }),
    propertyType: varchar("property_type", { length: 100 }),
    propertyExtent: varchar("property_extent", { length: 100 }),

    // Financial
    considerationValue: varchar("consideration_value", { length: 50 }),
    marketValue: varchar("market_value", { length: 50 }),

    // Reference
    previousDocumentNumber: varchar("previous_document_number", { length: 200 }),
    volumeNumber: varchar("volume_number", { length: 50 }),
    pageNumberRef: varchar("page_number_ref", { length: 50 }),

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
    buyerIdx: index("idx_transactions_buyer").on(table.buyerName),
    sellerIdx: index("idx_transactions_seller").on(table.sellerName),
    surveyNumberIdx: index("idx_transactions_survey_number").on(table.surveyNumber),
    documentNumberIdx: index("idx_transactions_document_number").on(table.documentNumber),
    dateIdx: index("idx_transactions_date").on(table.executionDate),
    villageIdx: index("idx_transactions_village").on(table.village),
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
