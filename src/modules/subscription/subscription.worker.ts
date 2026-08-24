import { createWorker } from "../../queue/createWorker";
import { subscriptionService } from "./subscription.service";
export function startSubscriptionWorker() {
  return createWorker("subscription", async () => subscriptionService.expireLapsedSubscriptions());
}
