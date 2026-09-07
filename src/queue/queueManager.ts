import { JobsOptions, Queue } from 'bullmq';
import { redis } from './../config/redis';

export type QueueJobOptions = JobsOptions & { repeat?: { pattern: string } };

class QueueManager {
  private queues = new Map<string, Queue>();

  private get(name: string): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection: redis }));
    }
    return this.queues.get(name)!;
  }

  add<T>(queueName: string, jobName: string, data: T, opts?: QueueJobOptions) {
    return this.get(queueName).add(jobName, data, opts);
  }

  addBulk<T>(queueName: string, jobs: { name: string; data: T; opts?: QueueJobOptions }[]) {
    return this.get(queueName).addBulk(jobs);
  }

  async removeJob(queueName: string, jobId: string): Promise<void> {
    const job = await this.get(queueName).getJob(jobId);
    if (job) await job.remove();
  }

  async close() {
    await Promise.all([...this.queues.values()].map((q) => q.close()));
  }
}

export const queueManager = new QueueManager();
