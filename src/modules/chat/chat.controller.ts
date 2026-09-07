import type { NextFunction, Request, Response } from "express";
import { sendSuccess } from "../../utils/response";
import { chatService, ChatService } from "./chat.service";

export class ChatController {
  constructor(private readonly service: ChatService) {}

  sendMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.sendMessage(req.user.sub, req.body.content, req.body.conversationId);
      sendSuccess(res, result, { message: "Message sent successfully" });
    } catch (error) {
      next(error);
    }
  };

  listConversations = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      sendSuccess(res, await this.service.listConversations(req.user.sub));
    } catch (error) {
      next(error);
    }
  };

  continueConversation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.sendMessage(
        req.user.sub,
        req.body.content,
        String(req.params.conversationId),
      );
      sendSuccess(res, result, { message: "Message sent successfully" });
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.service.getConversationHistory(req.user.sub, String(req.params.conversationId));
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  };
}

export const chatController = new ChatController(chatService);
