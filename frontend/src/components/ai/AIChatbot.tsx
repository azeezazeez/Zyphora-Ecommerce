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
  Trash2,
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

// ============================================================
// USER-SCOPED CHAT STORAGE
// ============================================================

const getUserChatKey = (
  userEmail?: string | null
) => {
  if (!userEmail) return null;

  return `zyphora_ai_chat_messages_${userEmail
    .trim()
    .toLowerCase()}`;
};

// ============================================================
// LOAD USER CHAT HISTORY
// ============================================================

const loadUserMessages = (
  userEmail?: string | null
): Message[] => {
  if (!userEmail) {
    return DEFAULT_MESSAGES;
  }

  try {
    const userKey = getUserChatKey(userEmail);

    if (userKey) {
      const saved =
        localStorage.getItem(userKey);

      if (saved) {
        const parsed = JSON.parse(saved);

        if (
          Array.isArray(parsed) &&
          parsed.length > 0
        ) {
          return parsed;
        }
      }
    }

    // --------------------------------------------------------
    // LEGACY STORAGE MIGRATION
    // --------------------------------------------------------

    const legacySaved =
      localStorage.getItem(
        'zyphora_ai_chat_messages'
      );

    if (legacySaved) {
      const parsed =
        JSON.parse(legacySaved);

      if (
        Array.isArray(parsed) &&
        parsed.length > 0
      ) {
