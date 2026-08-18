import { Job, Processor, Worker, WorkerOptions } from 'bullmq';
import { redis } from './../config/redis';
import { logger } from '../utils/logger';

export function createWorker<T = unknown, R = unknown>(
  queueName: string,
  processor: Processor<T, R>,
  opts?: Omit<WorkerOptions, 'connection'>,
): Worker<T, R> {
  const worker = new Worker<T, R>(queueName, processor, {
    ...opts,
    connection: redis,
  });

  worker.on('completed', (job: Job) => {
    logger.info({ queue: queueName, jobId: job.id, jobName: job.name }, 'Job completed');
  });

  worker.on('failed', (job: Job | undefined, err: Error) => {
    logger.error({ queue: queueName, jobId: job?.id, jobName: job?.name, err }, 'Job failed');
  });

  return worker;
}
