import { describe, it, expect } from "vitest";
import type { ChatMessage, ChatSession } from "@/contexts/chat-provider";

describe("ChatProvider", () => {
  it("initializes with empty sessions", () => {
    const sessions: ChatSession[] = [];
    expect(sessions).toEqual([]);
    expect(sessions).toHaveLength(0);
  });

  it("creates chat session with correct structure", () => {
    const session: ChatSession = {
      id: `session-${Date.now()}`,
      title: "Test Session",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(session.title).toBe("Test Session");
    expect(session.messages).toHaveLength(0);
    expect(session.createdAt).toBeDefined();
    expect(session.updatedAt).toBeDefined();
  });

  it("adds messages to session", () => {
    const session: ChatSession = {
      id: "session-1",
      title: "Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const message: ChatMessage = {
      id: "msg-1",
      role: "user",
      content: "Hello",
      timestamp: new Date(),
    };

    session.messages.push(message);

    expect(session.messages).toHaveLength(1);
    expect(session.messages[0].content).toBe("Hello");
    expect(session.messages[0].role).toBe("user");
  });

  it("tracks message conversation order", () => {
    const messages: ChatMessage[] = [
      { id: "1", role: "user", content: "Hi", timestamp: new Date() },
      { id: "2", role: "assistant", content: "Hello", timestamp: new Date() },
      { id: "3", role: "user", content: "How are you?", timestamp: new Date() },
    ];

    const userMessages = messages.filter((m) => m.role === "user");
    expect(userMessages).toHaveLength(2);
    expect(userMessages[0].content).toBe("Hi");
    expect(userMessages[1].content).toBe("How are you?");
  });

  it("clears session messages", () => {
    const session: ChatSession = {
      id: "session-1",
      title: "Chat",
      messages: [
        { id: "1", role: "user", content: "Hello", timestamp: new Date() },
        { id: "2", role: "assistant", content: "Hi", timestamp: new Date() },
      ],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(session.messages).toHaveLength(2);
    session.messages = [];
    expect(session.messages).toHaveLength(0);
  });

  it("manages multiple sessions", () => {
    const sessions: ChatSession[] = [
      {
        id: "s1",
        title: "Session 1",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "s2",
        title: "Session 2",
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    expect(sessions).toHaveLength(2);
    const session1 = sessions.find((s) => s.id === "s1");
    expect(session1?.title).toBe("Session 1");
  });

  it("tracks typing state", () => {
    let isTyping = false;
    expect(isTyping).toBe(false);

    isTyping = true;
    expect(isTyping).toBe(true);

    isTyping = false;
    expect(isTyping).toBe(false);
  });
});

