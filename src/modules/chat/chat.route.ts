import { Router } from "express";
import { auth } from "../../middlewares/authenticate";
import { validate } from "../../middlewares/validate";
import { chatController } from "./chat.controller";
import { conversationHistorySchema, conversationMessageSchema, sendMessageSchema } from "./chat.validator";

const chatRouter = Router();

chatRouter.post("/messages", auth, validate(sendMessageSchema), chatController.sendMessage);
chatRouter.get("/conversations", auth, chatController.listConversations);
chatRouter.post(
  "/conversations/:conversationId/messages",
  auth,
  validate(conversationMessageSchema),
  chatController.continueConversation,
);
chatRouter.get("/conversations/:conversationId/messages", auth, validate(conversationHistorySchema), chatController.getHistory);

export default chatRouter;
