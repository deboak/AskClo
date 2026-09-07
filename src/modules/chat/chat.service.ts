import { AppEnv } from "../../config/env";
import type { PartialModelObject } from "objection";
import type { MessageModel } from "../../db/models/Messages";
import { conversationRepository } from "../../db/repositories/ConversationRepository";
import { messageRepository } from "../../db/repositories/MessageRepository";
import { profileRepository } from "../../db/repositories/ProfileRepository";
import { AppError } from "../../utils/appError";
import { logger } from "../../utils/logger";

export interface ChatSlots {
  occasion: string | null;
  style: string | null;
  colour: string | null;
  constraints: string | null;
}

export interface ChatTurnResult {
  conversationId: string;
  reply: string;
  slots: ChatSlots;
  readyToGenerate: boolean;
}

interface LlmStructuredResponse {
  reply: string;
  slots: ChatSlots;
  ready_to_generate: boolean;
}

const slotsSchema = {
  occasion: null,
  style: null,
  colour: null,
  constraints: null,
} satisfies ChatSlots;

function buildSystemPrompt(profile: {
  gender?: string | null;
  style_preference?: string | null;
  body_type?: string | null;
  age?: string | null;
  cultural_preference?: string | null;
} | undefined, knownSlots: ChatSlots): string {
  const profileContext = profile
    ? `The user's standing style profile: gender=${profile.gender ?? "unspecified"}, age=${profile.age ?? "unspecified"}, body type=${profile.body_type ?? "unspecified"}, usual style preference=${profile.style_preference ?? "unspecified"}, cultural preference=${profile.cultural_preference ?? "unspecified"}. Use this as background context to make suggestions feel personally relevant; do not re-ask for it.`
    : "No standing profile is available yet.";

  return `You are Clo, a friendly AI stylist for AskClo, an outfit styling app for a Nigerian Gen Z audience. You suggest both Western/streetwear and Nigerian traditional wear (including iro & buba, aso-oke, agbada, and other tribal attire) with equal care and correct terminology.

${profileContext}

Before suggesting a specific outfit, collect: (1) occasion, (2) style, (3) colour preference or explicit \"no preference\", and (4) constraints such as fit, weather, budget, or modesty, or explicit \"none\". Ask for at most one missing item at a time and never re-ask for information already supplied. Once all four are known, give a specific styled outfit suggestion with fabric, silhouette, and styling details.

Known slots from earlier turns: ${JSON.stringify(knownSlots)}. Keep every known value unless the user explicitly corrects it. If any slot is null, ask only for the first missing slot in this order: occasion, style, colour, constraints. Do not give a specific outfit suggestion until every slot is present.

Respond only with strict JSON matching this exact shape:
{
  "reply": "conversational response",
  "slots": {
    "occasion": "string or null",
    "style": "string or null",
    "colour": "string or null",
    "constraints": "string or null"
  },
  "ready_to_generate": true
}
Set ready_to_generate to true only after every slot is filled and you have given a specific suggestion.`;
}

function isLlmResponse(value: unknown): value is LlmStructuredResponse {
  if (!value || typeof value !== "object") return false;
  const result = value as Record<string, unknown>;
  const slots = result.slots as Record<string, unknown> | undefined;

  return typeof result.reply === "string"
    && typeof result.ready_to_generate === "boolean"
    && !!slots
    && ["occasion", "style", "colour", "constraints"].every(
      (key) => slots[key] === null || typeof slots[key] === "string",
    );
}

function mockLlmResponse(
  history: Array<{ role: "user" | "assistant"; content: string }>,
  knownSlots: ChatSlots,
): LlmStructuredResponse {
  const userMessages = history
    .filter((message) => message.role === "user")
    .map((message) => message.content.toLowerCase());
  const combined = userMessages.join(" ");
  const slots: ChatSlots = {
    occasion: knownSlots.occasion ?? userMessages.find((message) => /wedding|party|date|interview|work|church|birthday|event/.test(message)) ?? null,
    style: knownSlots.style ?? /streetwear|traditional|casual|formal|elegant|minimalist|corporate/.exec(combined)?.[0] ?? null,
    colour: knownSlots.colour ?? /black|white|blue|red|green|pink|purple|brown|yellow|no preference/.exec(combined)?.[0] ?? null,
    constraints: knownSlots.constraints ?? /budget|modest|weather|loose|fitted|comfort|none/.exec(combined)?.[0] ?? null,
  };
  const missing = (Object.keys(slots) as Array<keyof ChatSlots>).find((key) => !slots[key]);
  if (missing) {
    const questions: Record<keyof ChatSlots, string> = {
      occasion: "What occasion are you dressing for?",
      style: "What style or vibe would you like?",
      colour: "Do you have a colour preference, or no preference?",
      constraints: "Any constraints such as budget, weather, fit, or modesty? You can say none.",
    };
    return { reply: `[Mock Clo] ${questions[missing]}`, slots, ready_to_generate: false };
  }
  return {
    reply: "[Mock Clo] Try a tailored outfit in your selected colour, with clean accessories and a silhouette that suits your occasion. This is a mock styling response.",
    slots,
    ready_to_generate: true,
  };
}

async function callLlm(
  systemPrompt: string,
  history: Array<{ role: "user" | "assistant"; content: string }>,
  knownSlots: ChatSlots,
): Promise<LlmStructuredResponse> {
  if (AppEnv.MOCK_LLM) {
    logger.info("Using mock LLM response");
    return mockLlmResponse(history, knownSlots);
  }

  if (!AppEnv.LLM_API_KEY) {
    throw new AppError(503, "Clo is not configured yet. Please try again later.");
  }

  let response: Response;
  try {
    response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${AppEnv.LLM_API_KEY}`,
      },
      body: JSON.stringify({
        model: AppEnv.LLM_MODEL,
        response_format: { type: "json_object" },
        messages: [{ role: "system", content: systemPrompt }, ...history],
      }),
    });
  } catch (error) {
    logger.error({ err: error }, "LLM request failed");
    throw new AppError(502, "Clo is having trouble responding right now. Please try again.");
  }

  if (!response.ok) {
    const body = await response.text();
    logger.error({ status: response.status, body }, "LLM returned an error");
    throw new AppError(502, "Clo is having trouble responding right now. Please try again.");
  }

  const data = await response.json() as { choices?: Array<{ message?: { content?: string } }> };
  const raw = data.choices?.[0]?.message?.content;
  if (!raw) throw new AppError(502, "Clo did not return a usable response.");

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isLlmResponse(parsed)) throw new Error("Unexpected LLM response shape");
    return parsed;
  } catch (error) {
    logger.error({ err: error, raw }, "Unable to parse LLM response");
    throw new AppError(502, "Clo's response could not be understood. Please try again.");
  }
}

function slotsFromMetadata(metadata: unknown): ChatSlots | null {
  if (!metadata || typeof metadata !== "object") return null;
  const slots = (metadata as { slots?: unknown }).slots;
  if (!slots || typeof slots !== "object") return null;
  const source = slots as Record<string, unknown>;
  if (!["occasion", "style", "colour", "constraints"].every((key) => source[key] === null || typeof source[key] === "string")) return null;
  return {
    occasion: source.occasion as string | null,
    style: source.style as string | null,
    colour: source.colour as string | null,
    constraints: source.constraints as string | null,
  };
}

export class ChatService {
  async listConversations(userId: string) {
    const conversations = await conversationRepository.findAllByUserId(userId);
    return Promise.all(conversations.map(async (conversation) => {
      const messages = await messageRepository.findAllByConversationId(conversation.id);
      const firstUserMessage = messages.find((message) => message.role === "user");
      const lastMessage = messages.at(-1);
      return {
        id: conversation.id,
        title: conversation.title || firstUserMessage?.content.slice(0, 80) || "New styling conversation",
        preview: lastMessage?.content.slice(0, 120) || null,
        lastMessageAt: conversation.last_message_at || conversation.created_at,
      };
    }));
  }

  async sendMessage(userId: string, content: string, conversationId?: string): Promise<ChatTurnResult> {
    const conversation = conversationId
      ? await conversationRepository.findByIdAndUserId(conversationId, userId)
      : await conversationRepository.create({ user_id: userId });

    if (!conversation) throw new AppError(404, "Conversation not found");

    const [priorMessages, profile] = await Promise.all([
      messageRepository.findAllByConversationId(conversation.id),
      profileRepository.findByUserId(userId),
    ]);
    const history = priorMessages
      .filter((message) => message.role === "user" || message.role === "assistant")
      .map((message) => ({ role: message.role as "user" | "assistant", content: message.content }));
    let knownSlots: ChatSlots = { ...slotsSchema };
    for (const message of [...priorMessages].reverse()) {
      const savedSlots = slotsFromMetadata(message.metadata);
      if (savedSlots) {
        knownSlots = savedSlots;
        break;
      }
    }
    const llmResult = await callLlm(
      buildSystemPrompt(profile, knownSlots),
      [...history, { role: "user", content }],
      knownSlots,
    );
    const slots: ChatSlots = {
      occasion: llmResult.slots.occasion ?? knownSlots.occasion,
      style: llmResult.slots.style ?? knownSlots.style,
      colour: llmResult.slots.colour ?? knownSlots.colour,
      constraints: llmResult.slots.constraints ?? knownSlots.constraints,
    };
    const readyToGenerate = llmResult.ready_to_generate && Object.values(slots).every((slot) => slot !== null);
    const result = { ...llmResult, slots, ready_to_generate: readyToGenerate };

    await messageRepository.create({ conversation_id: conversation.id, role: "user", content });
    const assistantMessage: PartialModelObject<MessageModel> = {
      conversation_id: conversation.id,
      role: "assistant",
      content: result.reply,
      metadata: { slots: result.slots, ready_to_generate: result.ready_to_generate },
    } as PartialModelObject<MessageModel>;
    await messageRepository.create(assistantMessage);
    await conversationRepository.touchLastMessage(conversation.id);

    return {
      conversationId: conversation.id,
      reply: result.reply,
      slots: { ...slotsSchema, ...result.slots },
      readyToGenerate: result.ready_to_generate,
    };
  }

  async getConversationHistory(userId: string, conversationId: string) {
    const conversation = await conversationRepository.findByIdAndUserId(conversationId, userId);
    if (!conversation) throw new AppError(404, "Conversation not found");
    return messageRepository.findAllByConversationId(conversationId);
  }
}

export const chatService = new ChatService();
