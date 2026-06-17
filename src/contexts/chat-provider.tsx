/**
 * src/contexts/chat-provider.tsx
 * Aido chat state management
 * Manages conversation history, settings, and chat context
 */

import { createContext, useContext, useState, ReactNode, useCallback } from "react";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export type ChatSession = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: Date;
  updatedAt: Date;
};

type ChatContextType = {
  sessions: ChatSession[];
  activeSessions: string[];
  currentSessionId: string | null;
  isTyping: boolean;

  createSession: (title: string) => ChatSession;
  addMessage: (message: ChatMessage) => void;
  setCurrentSession: (sessionId: string | null) => void;
  clearSession: (sessionId: string) => void;
  deleteSession: (sessionId: string) => void;
  setIsTyping: (typing: boolean) => void;
  getCurrentSession: () => ChatSession | undefined;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessions, setActiveSessions] = useState<string[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isTyping, setIsTyping] = useState<boolean>(false);

  const createSession = useCallback((title: string): ChatSession => {
    const newSession: ChatSession = {
      id: `session-${Date.now()}`,
      title,
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    setSessions((prev) => [...prev, newSession]);
    return newSession;
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    if (!currentSessionId) return;
    setSessions((prev) =>
      prev.map((session) =>
        session.id === currentSessionId
          ? {
              ...session,
              messages: [...session.messages, message],
              updatedAt: new Date(),
            }
          : session
      )
    );
  }, [currentSessionId]);

  const setCurrentSession = useCallback((sessionId: string | null) => {
    setCurrentSessionId(sessionId);
    if (sessionId && !activeSessions.includes(sessionId)) {
      setActiveSessions((prev) => [...prev, sessionId]);
    }
  }, [activeSessions]);

  const clearSession = useCallback((sessionId: string) => {
    setSessions((prev) =>
      prev.map((session) =>
        session.id === sessionId ? { ...session, messages: [], updatedAt: new Date() } : session
      )
    );
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    setActiveSessions((prev) => prev.filter((id) => id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSession(null);
    }
  }, [currentSessionId, setCurrentSession]);

  const getCurrentSession = useCallback((): ChatSession | undefined => {
    return sessions.find((session) => session.id === currentSessionId);
  }, [sessions, currentSessionId]);

  return (
    <ChatContext.Provider
      value={{
        sessions,
        activeSessions,
        currentSessionId,
        isTyping,
        createSession,
        addMessage,
        setCurrentSession,
        clearSession,
        deleteSession,
        setIsTyping,
        getCurrentSession,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChat must be used within ChatProvider");
  }
  return context;
}
