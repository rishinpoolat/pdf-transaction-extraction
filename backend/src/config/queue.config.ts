import { Queue, QueueEvents } from 'bullmq';
import { createRedisConnection } from './redis.config';

// Queue names
export const QUEUE_NAMES = {
  PDF_PROCESSING: 'pdf-processing',
};

// Job types
export interface PdfProcessingJobData {
  pdfId: number;
  filename: string;
  filepath: string;
  originalName: string;
}

// Create PDF processing queue
export const pdfProcessingQueue = new Queue<PdfProcessingJobData>(QUEUE_NAMES.PDF_PROCESSING, {
  connection: createRedisConnection(),
  defaultJobOptions: {
    attempts: 3, // Retry failed jobs up to 3 times
    backoff: {
      type: 'exponential',
      delay: 2000, // Start with 2 seconds
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100, // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
});

// Queue events for monitoring
export const pdfProcessingQueueEvents = new QueueEvents(QUEUE_NAMES.PDF_PROCESSING, {
  connection: createRedisConnection(),
});

// Listen to queue events
pdfProcessingQueueEvents.on('completed', ({ jobId }) => {
  console.log(`✅ Job ${jobId} completed successfully`);
});

pdfProcessingQueueEvents.on('failed', ({ jobId, failedReason }) => {
  console.error(`❌ Job ${jobId} failed:`, failedReason);
});

pdfProcessingQueueEvents.on('progress', ({ jobId, data }) => {
  console.log(`📊 Job ${jobId} progress:`, data);
});

// Graceful shutdown
export async function closeQueues() {
  await pdfProcessingQueue.close();
  await pdfProcessingQueueEvents.close();
  console.log('✅ All queues closed');
}

export default pdfProcessingQueue;
