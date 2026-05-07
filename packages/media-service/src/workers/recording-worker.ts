import { Queue, Worker, Job } from 'bullmq';

let recordingQueue: Queue | null = null;
let recordingWorker: Worker | null = null;

interface RecordingJobData {
  recordingId: string;
  videoUrl: string;
  platform: string;
}

function getRedisConnection() {
  return {
    host: process.env.REDIS_URL ? new URL(process.env.REDIS_URL).hostname : 'localhost',
    port: 6379,
  };
}

export async function getRecordingQueue(): Promise<Queue> {
  if (!recordingQueue) {
    recordingQueue = new Queue('recording-transcode', {
      connection: getRedisConnection(),
    });
  }
  return recordingQueue;
}

export async function addTranscodeJob(data: RecordingJobData): Promise<Job> {
  const queue = await getRecordingQueue();
  return queue.add('transcode', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export function startRecordingWorker(): void {
  if (recordingWorker) return;

  recordingWorker = new Worker(
    'recording-transcode',
    async (job: Job<RecordingJobData>) => {
      console.log(`Processing recording ${job.data.recordingId}`);
      console.log(`Transcoding would run: ffmpeg -i ${job.data.videoUrl} -c:v libx264 -c:a aac output.mp4`);
      console.log(`Recording ${job.data.recordingId} transcode completed`);
      return { recordingId: job.data.recordingId, status: 'ready' };
    },
    {
      connection: getRedisConnection(),
    }
  );

  recordingWorker.on('completed', (job) => {
    console.log(`Recording job ${job.id} completed`);
  });

  recordingWorker.on('failed', (job, err) => {
    console.error(`Recording job ${job?.id} failed:`, err);
  });
}
