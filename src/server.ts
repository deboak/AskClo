import "./config/db";
import app from "./app";
import { startGenerationWorker } from "./modules/generations/generation.worker";
import { queueManager } from "./queue/queueManager";
import { scheduleSubscriptionExpiry } from "./queue/subscription.queue";
import { startSubscriptionWorker } from "./modules/subscription/subscription.worker";
import { startOtpWorker } from "./modules/auth/otp.worker";
import { startNotificationWorker } from "./modules/notification/notification.worker";

const port = process.env.PORT || 3000;
const generationWorker = startGenerationWorker();
const subscriptionWorker = startSubscriptionWorker();
const otpWorker = startOtpWorker();
const notificationWorker = startNotificationWorker();
void scheduleSubscriptionExpiry();

const server = app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

let isShuttingDown = false;

function shutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`${signal} received. Closing server...`);

  server.close(async (error) => {
    if (error) {
      console.error("Unable to close server:", error);
      process.exit(1);
    }

    await Promise.all([generationWorker.close(), subscriptionWorker.close(), otpWorker.close(), notificationWorker.close(), queueManager.close()]);
    console.log("Server and generation worker closed.");
    process.exit(0);
  });
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Add WebSockets, Redis cleanup, queues, and workers here when needed.
