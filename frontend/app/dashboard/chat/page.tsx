"use client";

import Link from "next/link";
import { FormEvent, useRef, useState } from "react";
import { Send } from "@/components/icons";
import { api } from "@/lib/api";
import type { ConversationSummary } from "@/lib/types";
import { useSafeEffect as useEffect } from "@/lib/use-safe-effect";

interface Slots {
  occasion: string | null;
  style: string | null;
  colour: string | null;
  constraints: string | null;
}
interface Turn {
  conversationId: string;
  reply: string;
  slots: Slots;
  readyToGenerate: boolean;
}
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at?: string;
  metadata?: { slots?: Slots; ready_to_generate?: boolean };
}

const blank: Slots = { occasion: null, style: null, colour: null, constraints: null };
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
  const [slots, setSlots] = useState(blank);
  const [ready, setReady] = useState(false);
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const scrollArea = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void api<ConversationSummary[]>("/chat/conversations")
      .then(setConversations)
      .catch((error) => setError(error.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const area = scrollArea.current;
    if (!area) return;
    requestAnimationFrame(() => area.scrollTo({ top: area.scrollHeight, behavior: "smooth" }));
  }, [messages, sending]);

  async function openConversation(id: string) {
    setActive(id);
    setLoading(true);
    setError("");
    try {
      const history = await api<Message[]>(`/chat/conversations/${id}/messages`);
      setMessages(history);
      const metadata = [...history].reverse().find((message) => message.metadata?.slots)?.metadata;
      if (metadata?.slots) setSlots(metadata.slots);
      else setSlots(blank);
      setReady(Boolean(metadata?.ready_to_generate));
    } catch (error) {
      setError(error instanceof Error ? error.message : "Conversation could not be loaded");
    } finally {
      setLoading(false);
    }
  }

  function newConversation() {
    setActive(undefined);
    setMessages([]);
    setSlots(blank);
    setReady(false);
    setError("");
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
      setSlots(turn.slots);
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

  const completed = Object.values(slots).filter(Boolean).length;

  return (
    <main className="dashChat">
      <aside className={`conversationList ${historyOpen ? "mobileOpen" : ""}`}>
        <div className="conversationListHeader">
          <div>
            <span className="dashEyebrow">Conversations</span>
            <small>{conversations.length} saved</small>
          </div>
          <button
            className="historyClose"
            onClick={() => setHistoryOpen(false)}
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
          <button className="historyToggle" onClick={() => setHistoryOpen(true)}>
            ☰ <span>History</span>
          </button>
          <div>
            <i />
            <strong>Clo</strong>
            <span>Personal stylist</span>
          </div>
          {active && <button onClick={newConversation}>New chat</button>}
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

      <aside className="chatBrief">
        <span className="dashEyebrow">Style brief</span>
        <h2>{ready ? "Ready for a try-on" : "Building your look"}</h2>
        {(["occasion", "style", "colour", "constraints"] as const).map((key, index) => (
          <div className={slots[key] ? "complete" : ""} key={key}>
            <span>{slots[key] ? "✓" : `0${index + 1}`}</span>
            <p>
              <small>{key}</small>
              <strong>{slots[key] || "Not added yet"}</strong>
            </p>
          </div>
        ))}
        <footer>
          <strong>{ready ? "Outfit direction complete" : `${completed} of 4 details added`}</strong>
          <i>
            <span style={{ width: `${completed * 25}%` }} />
          </i>
          <p>
            {ready
              ? "Use this direction when creating a virtual outfit try-on."
              : "Clo will ask for the remaining details."}
          </p>
          {ready && (
            <Link className="briefAction" href="/dashboard/try-ons">
              Create a try-on →
            </Link>
          )}
        </footer>
      </aside>
    </main>
  );
}
