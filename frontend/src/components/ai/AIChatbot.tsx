import React, {
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  Loader2,
  Lock,
  RotateCcw,
  Send,
  UserCheck,
  X,
  Zap,
} from 'lucide-react';

import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

type Message = {
  role: 'user' | 'assistant';
  text: string;
};

const STORAGE_OPEN_KEY = 'zyphora_ai_chat_open';

const DEFAULT_MESSAGES: Message[] = [
  {
    role: 'assistant',
    text:
      'Hi! I’m Zyphora AI. Ask me about products, shopping, orders, delivery, accounts, or anything else.',
  },
];

// Helper to obtain user-scoped storage key for chat history
const getUserChatKey = (userEmail?: string | null) => {
  if (!userEmail) return null;
  return `zyphora_ai_chat_messages_${userEmail.trim().toLowerCase()}`;
};

// Load messages for a given user (with migration from legacy storage)
const loadUserMessages = (userEmail?: string | null): Message[] => {
  if (!userEmail) return DEFAULT_MESSAGES;
  try {
    const userKey = getUserChatKey(userEmail);
    if (userKey) {
      const saved = localStorage.getItem(userKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    }

    // Check legacy/fallback key and migrate if found
    const legacySaved = localStorage.getItem('zyphora_ai_chat_messages');
    if (legacySaved) {
      const parsed = JSON.parse(legacySaved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        if (userKey) {
          localStorage.setItem(userKey, JSON.stringify(parsed));
        }
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return DEFAULT_MESSAGES;
};

export function AIChatbot() {
  const { user, openAuthModal, authModalOpen } = useAuth();
  const isLoggedIn = Boolean(user && user.email);

  const [open, setOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_OPEN_KEY) === 'true';
    } catch {
      return false;
    }
  });

  /*
   * Automatically close the AI Assistant popup whenever
   * the authentication modal is opened (e.g. from navbar or inside the chat popup).
   */
  useEffect(() => {
    if (authModalOpen) {
      setOpen(false);
    }
  }, [authModalOpen]);

  const handleSignInFromChat = () => {
    setOpen(false);
    openAuthModal();
  };

  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  /**
   * Only show saved chat history when user is logged in.
   * Otherwise, initialize with the default greeting.
   */
  const [messages, setMessages] = useState<Message[]>(() => {
    return loadUserMessages(user?.email);
  });

  /**
   * React immediately to authentication changes:
   * - When user logs in: load that user's chat history.
   * - When user logs out: clear history display and show fresh greeting.
   */
  useEffect(() => {
    setMessages(loadUserMessages(user?.email));
  }, [user?.email]);

  /**
   * Persist messages across page reloads ONLY when user is logged in
   */
  useEffect(() => {
    if (!user?.email) return;
    try {
      const key = getUserChatKey(user.email);
      if (key) {
        localStorage.setItem(key, JSON.stringify(messages));
      }
    } catch {
      // Ignore quota errors
    }
  }, [messages, user?.email]);

  /*
   * Persist open state across page reloads
   */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_OPEN_KEY, String(open));
    } catch {
      // Ignore quota errors
    }
  }, [open]);

  const [refreshing, setRefreshing] = useState(false);

  /*
   * Refresh AI assistant connection without deleting chat history
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await api.health();
    } catch {
      // Ignore
    }
    setTimeout(() => {
      setRefreshing(false);
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 450);
  };

  const clearChat = () => {
    setMessages(DEFAULT_MESSAGES);
    if (user?.email) {
      try {
        const key = getUserChatKey(user.email);
        if (key) localStorage.removeItem(key);
      } catch {
        // Ignore
      }
    }
  };

  /*
   * Automatically keep the newest message visible.
   */
  useEffect(() => {
    if (!open) return;

    requestAnimationFrame(() => {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    });
  }, [messages, open]);

  /*
   * Lock the background page on mobile
   * while the chatbot is open.
   */
  useEffect(() => {
    if (!open) return;

    const isMobile =
      window.matchMedia('(max-width: 639px)').matches;

    if (!isMobile) return;

    const previousOverflow =
      document.body.style.overflow;

    const previousOverscroll =
      document.body.style.overscrollBehavior;

    document.body.style.overflow = 'hidden';
    document.body.style.overscrollBehavior = 'none';

    return () => {
      document.body.style.overflow =
        previousOverflow;

      document.body.style.overscrollBehavior =
        previousOverscroll;
    };
  }, [open]);

  const send = async (
    e?: React.FormEvent,
    customMessage?: string
  ) => {
    e?.preventDefault();

    const message = (customMessage ?? input).trim();

    if (!message || sending) return;

    setInput('');

    setMessages((current) => [
      ...current,
      {
        role: 'user',
        text: message,
      },
    ]);

    setSending(true);

    try {
      const response =
        await api.chat(message);

      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text: response.reply,
        },
      ]);
    } catch (err: any) {
      setMessages((current) => [
        ...current,
        {
          role: 'assistant',
          text:
            err?.message ||
            'I’m unable to respond right now. Please try again.',
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  const curatedSuggestions = [
    'Fragrance recommendations',
    'Delivery & packaging',
    'Return policy',
  ];

  return (
    <>
      {/* ======================================================
          CHAT WINDOW
          High-end minimalist Black & White combination
          ====================================================== */}
      {open && (
        <div
          role="dialog"
          aria-label="Zyphora AI Assistant"
          className="
            fixed
            z-[100]

            left-2
            right-2
            bottom-2

            w-auto
            h-[calc(100dvh-76px)]
            max-h-[640px]

            sm:left-auto
            sm:right-6
            sm:bottom-6
            sm:w-[410px]
            sm:h-[580px]

            bg-white
            border
            border-black/10
            rounded-[28px]
            shadow-[0_24px_70px_-12px_rgba(0,0,0,0.22),0_12px_32px_-8px_rgba(0,0,0,0.1)]
            overflow-hidden

            flex
            flex-col

            overscroll-contain
            animate-in
            fade-in
            zoom-in-95
            duration-200
          "
        >
          {/* ==================================================
              HEADER
              Crisp Black & White palette
              ================================================== */}
          <div
            className="
              shrink-0
              px-4
              sm:px-5
              py-3.5
              bg-black
              text-white
              border-b
              border-black
              flex
              items-center
              justify-between
              gap-3
              relative
            "
          >
            <div className="flex items-center gap-3 min-w-0 relative z-10">
              <div
                className="
                  shrink-0
                  w-9
                  h-9
                  rounded-full
                  bg-white/10
                  border
                  border-white/20
                  flex
                  items-center
                  justify-center
                  shadow-sm
                "
              >
                <Zap className="w-4 h-4 text-white fill-white" />
              </div>

              <div className="min-w-0">
                <p className="text-[15px] font-semibold tracking-wide text-white truncate font-serif-luxury">
                  Zyphora AI
                </p>

                <div className="flex items-center gap-1.5">
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"
                    aria-hidden="true"
                  />
                  <p className="text-[11px] text-neutral-300 tracking-wide truncate">
                    {isLoggedIn ? (
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3 h-3 text-emerald-400 inline" />
                        <span>History saved ({user?.email.split('@')[0]})</span>
                      </span>
                    ) : (
                      'Shopping assistant'
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {/* Refresh AI Assistant (preserves full chat history) */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="
                  relative
                  z-10
                  shrink-0
                  w-8
                  h-8
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-neutral-300
                  hover:text-white
                  hover:bg-white/10
                  active:bg-white/20
                  transition-all
                  duration-150
                  disabled:opacity-50
                "
                aria-label="Refresh AI Assistant"
                title="Refresh AI Assistant"
              >
                <RotateCcw
                  className={`w-3.5 h-3.5 transition-transform duration-500 ${refreshing ? 'animate-spin' : ''
                    }`}
                />
              </button>

              <button
                type="button"
                onClick={() => setOpen(false)}
                className="
                  relative
                  z-10
                  shrink-0
                  w-8
                  h-8
                  rounded-full
                  flex
                  items-center
                  justify-center
                  text-neutral-300
                  hover:text-white
                  hover:bg-white/10
                  active:bg-white/20
                  transition-all
                  duration-150
                "
                aria-label="Close Zyphora AI"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* ==================================================
              MESSAGES
              Minimalist Black & White arena
              ================================================== */}
          <div
            className="
              flex-1
              min-h-0

              overflow-y-auto
              overflow-x-hidden

              overscroll-contain
              touch-pan-y

              p-4
              sm:p-5

              space-y-3.5
              bg-[#FBFBFB]
            "
          >
            {/* Log in prompt banner shown ONLY when user is NOT logged in */}
            {!isLoggedIn && (
              <div className="p-3 bg-neutral-100 border border-black/10 rounded-2xl flex items-center justify-between gap-3 text-xs shadow-xs animate-in fade-in duration-200">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-black text-white flex items-center justify-center shrink-0">
                    <Lock className="w-3.5 h-3.5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-black truncate">
                      Sign in to view chat history
                    </p>
                    <p className="text-neutral-500 text-[11px] truncate">
                      History is only shown for signed-in accounts
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSignInFromChat}
                  className="shrink-0 px-3 py-1.5 bg-black hover:bg-neutral-800 text-white font-medium rounded-full text-xs transition-colors shadow-xs"
                >
                  Sign in
                </button>
              </div>
            )}

            {messages.map((message, index) => (
              <div
                key={index}
                className={`
                  flex
                  min-w-0
                  ${message.role === 'user' ? 'justify-end' : 'justify-start'}
                `}
              >
                <div
                  className={`
                    max-w-[86%]
                    sm:max-w-[82%]
                    min-w-0

                    px-4
                    py-3

                    text-[13px]
                    leading-[1.65]

                    whitespace-pre-wrap
                    break-words

                    ${message.role === 'user'
                      ? 'bg-black text-white rounded-2xl rounded-tr-xs shadow-sm font-normal tracking-[0.01em]'
                      : 'bg-white border border-black/10 text-black rounded-2xl rounded-tl-xs shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] font-normal tracking-[0.01em]'
                    }
                  `}
                >
                  {message.text}
                </div>
              </div>
            ))}

            {/* Quick inquiries when quiet */}
            {messages.length === 1 && !sending && (
              <div className="pt-2 pb-1">
                <p className="text-[11px] uppercase tracking-wider text-neutral-500 font-medium mb-2 px-1">
                  Suggested inquiries
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {curatedSuggestions.map((suggestion) => (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => send(undefined, suggestion)}
                      className="
                        text-left
                        text-[12px]
                        text-neutral-800
                        bg-white
                        hover:bg-neutral-100
                        active:bg-neutral-200
                        border
                        border-black/15
                        hover:border-black/30
                        px-3
                        py-1.5
                        rounded-full
                        transition-all
                        duration-150
                      "
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Hovering 3 Dots Indicator while responding (Black & White) */}
            {sending && (
              <div className="flex justify-start">
                <div
                  className="
                    bg-white
                    border
                    border-black/10
                    px-4
                    py-3
                    rounded-2xl
                    rounded-tl-xs
                    shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)]
                    flex
                    items-center
                    gap-1.5
                  "
                  aria-label="Zyphora AI is responding"
                >
                  <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 rounded-full bg-black animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 rounded-full bg-black animate-bounce" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ==================================================
              INPUT
              Black & White input form
              ================================================== */}
          <form
            onSubmit={(e) => send(e)}
            className="
              shrink-0
              p-3
              sm:p-4
              border-t
              border-black/10
              bg-white
              backdrop-blur-md
              flex
              items-center
              gap-2.5
            "
          >
            <div
              className="
                flex-1
                min-w-0
                flex
                items-center
                h-11
                px-3.5
                bg-neutral-100/70
                border
                border-black/10
                rounded-full
                focus-within:border-black
                focus-within:bg-white
                focus-within:ring-1
                focus-within:ring-black/10
                transition-all
                duration-200
              "
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                disabled={sending}
                className="
                  w-full
                  bg-transparent
                  text-[13px]
                  text-black
                  placeholder:text-neutral-400
                  placeholder:font-light
                  focus:outline-none
                  disabled:opacity-60
                "
                aria-label="Ask Zyphora AI"
              />
            </div>

            <button
              type="submit"
              disabled={!input.trim() || sending}
              className="
                shrink-0
                w-10
                h-10

                rounded-full

                bg-black
                hover:bg-neutral-800
                text-white

                flex
                items-center
                justify-center

                transition-all
                duration-200
                active:scale-95
                shadow-sm
                hover:shadow

                disabled:opacity-20
                disabled:cursor-not-allowed
                disabled:hover:bg-black
              "
              aria-label="Send message"
            >
              {sending ? (
                <Loader2 className="w-4 h-4 animate-spin text-white" />
              ) : (
                <Send className="w-3.5 h-3.5 translate-x-px text-white" />
              )}
            </button>
          </form>
        </div>
      )}

      {/* ======================================================
          FLOATING BUTTON
          Minimalist Black & White circular trigger
          Hidden when chat is open
          ====================================================== */}
      {!open && (
        <div
          className="
            fixed
            z-[99]
            right-4
            bottom-4
            sm:right-6
            sm:bottom-6
          "
        >
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="
              relative
              w-12
              h-12
              sm:w-auto
              sm:h-auto
              sm:px-4
              sm:py-2.5
              rounded-full
              bg-white
              hover:bg-neutral-50
              text-black
              border
              border-black/15
              hover:border-black/35
              shadow-[0_10px_25px_-5px_rgba(0,0,0,0.18),0_4px_10px_-2px_rgba(0,0,0,0.06)]
              hover:shadow-[0_16px_32px_-6px_rgba(0,0,0,0.24)]
              hover:scale-105
              active:scale-95
              transition-all
              duration-200
              flex
              items-center
              justify-center
              sm:gap-2.5
              group
            "
            aria-label="Ask Zyphora AI"
          >
            {/* Minimalist icon container */}
            <div
              className="
                w-8
                h-8
                sm:w-7
                sm:h-7
                rounded-full
                bg-black
                border
                border-black
                flex
                items-center
                justify-center
                shrink-0
                transition-transform
                group-hover:scale-105
              "
            >
              <Zap className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-white fill-white" />
            </div>

            {/* "Ask Zyphora AI" label: visible on Tablet, Laptop, and PC; hidden on mobile */}
            <span className="hidden sm:inline text-sm font-semibold tracking-wide text-black select-none pr-1">
              Ask Zyphora AI
            </span>

            {/* Live indicator dot */}
            <span
              className="
                w-2
                h-2
                rounded-full
                bg-black
                ring-2
                ring-white
                animate-pulse

                /* Mobile: pinned to top right */
                absolute
                top-1
                right-1

                /* Tablet / PC: inline next to text */
                sm:static
                sm:ring-0
                sm:top-auto
                sm:right-auto
              "
              aria-hidden="true"
            />
          </button>
        </div>
      )}
    </>
  );
}
