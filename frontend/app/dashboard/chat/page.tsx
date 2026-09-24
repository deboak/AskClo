"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { Send } from "@/components/icons";
import { api } from "@/lib/api";
import type { ConversationSummary, Generation, SubscriptionOverview } from "@/lib/types";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";

interface Turn {
  conversationId: string;
  reply: string;
  readyToGenerate: boolean;
}
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  metadata?: { ready_to_generate?: boolean };
}

const suggestions = [
  "Owambe this weekend",
  "A relaxed dinner date",
  "An important interview",
  "Sunday brunch",
];

export default function DashboardChat() {
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [active, setActive] = useState<string>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [chatsCollapsed, setChatsCollapsed] = useState(true);
  const [plan, setPlan] = useState<SubscriptionOverview | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const scrollArea = useRef<HTMLDivElement>(null);
  const composer = useRef<HTMLTextAreaElement>(null);
  const conversationRequest = useRef(0);

  useEffect(() => {
    void Promise.all([
      api<ConversationSummary[]>("/chat/conversations"),
      api<SubscriptionOverview>("/subscriptions/current"),
      api<Generation[]>("/generations"),
    ])
      .then(([savedConversations, subscription, savedGenerations]) => {
        setConversations(savedConversations);
        setPlan(subscription);
        setGenerations(savedGenerations);
      })
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    requestAnimationFrame(() => area.scrollTo({ top: area.scrollHeight, behavior: "smooth" }));
  }, [messages, sending]);

  async function openConversation(id: string) {
    const requestId = ++conversationRequest.current;
    setActive(id);
    setLoading(true);
    setError("");
    try {
      const history = await api<Message[]>(`/chat/conversations/${id}/messages`);
      if (requestId !== conversationRequest.current) return;
      setMessages(history);
      const metadata = [...history]
        .reverse()
        .find((message) => message.metadata?.ready_to_generate !== undefined)?.metadata;
      setReady(Boolean(metadata?.ready_to_generate));
    } catch (error) {
      if (requestId !== conversationRequest.current) return;
      setError(error instanceof Error ? error.message : "Conversation could not be loaded");
    } finally {
      if (requestId === conversationRequest.current) setLoading(false);
    }
  }

  function newConversation() {
    conversationRequest.current += 1;
    setActive(undefined);
    setMessages([]);
    setReady(false);
    setError("");
    setLoading(false);
    setHistoryOpen(false);
    requestAnimationFrame(() => composer.current?.focus());
  }

  function toggleChats() {
    if (window.matchMedia("(max-width: 850px)").matches) {
      setHistoryOpen(true);
      return;
    }
    setChatsCollapsed((collapsed) => !collapsed);
  }

  function closeChats() {
    if (window.matchMedia("(max-width: 850px)").matches) {
      setHistoryOpen(false);
      return;
    }
    setChatsCollapsed(true);
  }

  async function sendMessage(content: string) {
    if (!content.trim() || sending) return;
    const clean = content.trim();
    setSending(true);
    setError("");
    setMessages((current) => [
      ...current,
      {
        id: crypto.randomUUID(),
        role: "user",
        content: clean,
        created_at: new Date().toISOString(),
      },
    ]);
    try {
      const turn = await api<Turn>(
        active ? `/chat/conversations/${active}/messages` : "/chat/messages",
        {
          method: "POST",
          body: JSON.stringify({ content: clean }),
        },
      );
      setActive(turn.conversationId);
      setReady(turn.readyToGenerate);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: turn.reply,
          created_at: new Date().toISOString(),
        },
      ]);
      setConversations(await api<ConversationSummary[]>("/chat/conversations"));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Clo could not respond");
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const value = String(new FormData(form).get("message") || "");
    form.reset();
    void sendMessage(value);
  }

  const latestAssistantId = [...messages]
    .reverse()
    .find((message) => message.role === "assistant")?.id;
  const generationLimit =
    plan?.subscription.tier === "free_trial"
      ? plan.entitlements.freeGenerationLimit
      : plan?.entitlements.monthlyGenerationLimit;
  const allowanceStart =
    plan?.subscription.tier === "free_trial"
      ? 0
      : new Date(plan?.subscription.current_period_start ?? 0).getTime();
  const usedGenerations = generations.filter(
    (generation) =>
      generation.status !== "failed" && new Date(generation.created_at).getTime() >= allowanceStart,
  ).length;
  const canGenerateTryOn = Boolean(
    plan?.isActive &&
    plan.entitlements.genericTryOn &&
    (generationLimit === null ||
      generationLimit === undefined ||
      usedGenerations < generationLimit),
  );

  return (
    <main className={`dashChat ${chatsCollapsed ? "chatsCollapsed" : ""}`}>
      <aside className={`conversationList ${historyOpen ? "mobileOpen" : ""}`}>
        <div className="conversationListHeader">
          <div>
            <span className="dashEyebrow">Conversations</span>
            <small>{conversations.length} saved</small>
          </div>
          <button
            className="historyClose"
            onClick={closeChats}
            aria-label="Close conversations"
          >
            ×
          </button>
          <button onClick={newConversation}>＋ New chat</button>
        </div>
        <div className="conversationItems">
          {conversations.map((conversation) => (
            <button
              key={conversation.id}
              className={active === conversation.id ? "active" : ""}
              onClick={() => {
                void openConversation(conversation.id);
                setHistoryOpen(false);
              }}
            >
              <i aria-hidden="true">C</i>
              <span className="conversationSummary">
                <strong>{conversation.title}</strong>
              </span>
              <time>
                {new Date(conversation.lastMessageAt).toLocaleDateString(undefined, {
                  month: "short",
                  day: "numeric",
                })}
              </time>
            </button>
          ))}
          {!conversations.length && !loading && <p>No saved conversations yet.</p>}
        </div>
      </aside>

      <section className="conversationRoom">
        <header>
          <button
            className="historyToggle"
            onClick={toggleChats}
            aria-label={chatsCollapsed ? "Show chats" : "Hide chats"}
            aria-expanded={!chatsCollapsed}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M5 7h14M5 12h14M5 17h9" />
            </svg>
            <span>Chats</span>
          </button>
          <div>
            <i />
            <strong>Clo</strong>
            <span>Personal stylist</span>
          </div>
        </header>
        <div className="conversationScroll" ref={scrollArea}>
          {loading ? (
            <div className="pageLoader">Opening conversation…</div>
          ) : messages.length ? (
            <div className="dashMessages">
              {messages.map((message) => (
                <div key={message.id} className={`dashMessage ${message.role}`}>
                  {message.role === "assistant" && <span>C</span>}
                  <div>
                    <small>{message.role === "assistant" ? "Clo" : "You"}</small>
                    <p>{message.content}</p>
                    <time className="messageTime">
                      {message.created_at
                        ? new Date(message.created_at).toLocaleTimeString(undefined, {
                            hour: "numeric",
                            minute: "2-digit",
                          })
                        : ""}
                    </time>
                    {ready && message.id === latestAssistantId && (
                      <div className="readyTryOnCard">
                        <span aria-hidden="true">✓</span>
                        <div>
                          <strong>{canGenerateTryOn ? "Your look is ready to generate" : "Your try-on allowance is used"}</strong>
                          <p>
                            {!plan?.isActive
                              ? "Choose a plan to generate this look."
                              : !canGenerateTryOn
                                ? plan.subscription.tier === "free_trial"
                                  ? "You have used both free try-ons. Upgrade to continue."
                                  : "Your monthly try-on allowance has been used."
                              : generationLimit === null || generationLimit === undefined
                              ? "Your plan includes virtual try-ons."
                              : `${Math.max(0, generationLimit - usedGenerations)} try-on${generationLimit - usedGenerations === 1 ? "" : "s"} remaining.`}
                          </p>
                        </div>
                        <Link
                          href={{
                            pathname: canGenerateTryOn ? "/dashboard/try-ons" : "/dashboard/subscription",
                            query: canGenerateTryOn ? { prompt: message.content.slice(0, 2000), source: "ai" } : undefined,
                          }}
                        >
                          {canGenerateTryOn ? "Create try-on" : "View plans"}
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {sending && (
                <div className="dashMessage assistant">
                  <span>C</span>
                  <div>
                    <small>Clo</small>
                    <div className="typing">
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="dashChatWelcome">
              <span>C</span>
              <small>PERSONAL STYLIST</small>
              <h1>What are you dressing for?</h1>
              <p>Share the occasion, how you want to feel, or a look you have in mind.</p>
              <div>
                {suggestions.map((suggestion) => (
                  <button onClick={() => sendMessage(suggestion)} key={suggestion}>
                    {suggestion}
                    <span>↗</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          {error && <div className="chatError">{error}</div>}
        </div>
        <form className="dashComposer" onSubmit={submit}>
          <textarea
            ref={composer}
            name="message"
            rows={1}
            maxLength={4000}
            aria-label="Message Clo"
            placeholder="Message Clo"
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                event.currentTarget.form?.requestSubmit();
              }
            }}
          />
          <button disabled={sending} aria-label="Send message">
            <Send />
          </button>
        </form>
      </section>

      {historyOpen && (
        <button
          className="chatPanelBackdrop"
          type="button"
          onClick={() => {
            setHistoryOpen(false);
          }}
          aria-label="Close chat panel"
        />
      )}
    </main>
  );
}
