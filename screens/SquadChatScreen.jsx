import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useSquad } from '../hooks/useSquad';
import { useUser } from '../hooks/useUser';
import { useSquadSocket } from '../hooks/useSquadSocket';

/**
 * SquadChatScreen
 *
 * Real-time chat interface for Squad members connected via STOMP WebSocket.
 *
 * Features:
 * - Sticky icebreaker header (AI-generated prompt or waiting state)
 * - Real-time message list with sender distinction (own messages vs others)
 * - Text input + send button
 * - Auto-scroll to latest message
 * - Connection status indicator
 */
export default function SquadChatScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { mySquad } = useSquad();
  const { user } = useUser();
  const s = useMemo(() => getStyles(colors), [colors]);

  const [messageText, setMessageText] = useState('');
  const flatListRef = useRef(null);

  // Get eventId and userId from route or squad context
  const eventId = route?.params?.eventId || mySquad?.eventId || mySquad?.id;
  const userId = user?.id || 'anonymous-user';

  // Connect to WebSocket
  const { messages, sendMessage, isConnected, error } = useSquadSocket(eventId, userId);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      flatListRef.current?.scrollToEnd({ animated: true });
    }
  }, [messages]);

  const handleSendMessage = () => {
    if (messageText.trim()) {
      sendMessage(messageText);
      setMessageText('');
    }
  };

  const handleGoBack = () => {
    navigation?.goBack();
  };

  // Determine if icebreaker is active
  const icebreaker = mySquad?.icebreaker;
  const hasIcebreaker = icebreaker?.promptText;
  const icebreakerText = hasIcebreaker
    ? icebreaker.promptText
    : 'Waiting for the vibe check...';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={s.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={20} color={colors.text} strokeWidth={2} />
          </TouchableOpacity>
          <View style={s.headerContent}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {mySquad?.title || 'Squad Chat'}
            </Text>
            <Text style={s.connectionStatus}>
              {isConnected ? '🟢 Connected' : '🔘 Connecting...'}
            </Text>
          </View>
        </View>

        {/* ── Icebreaker Sticky Header ──────────────────────────────────────── */}
        <View style={[s.icebreakerBanner, hasIcebreaker && s.icebreakerBannerActive]}>
          <Text style={s.icebreakerLabel}>
            {hasIcebreaker ? '✨ Icebreaker' : '⏳ Waiting...'}
          </Text>
          <Text style={s.icebreakerText} numberOfLines={3}>
            {icebreakerText}
          </Text>
        </View>

        {/* ── Error Display ───────────────────────────────────────────────────── */}
        {error && (
          <View style={s.errorBanner}>
            <Text style={s.errorText}>⚠️ {error}</Text>
          </View>
        )}

        {/* ── Messages List ───────────────────────────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(msg, index) => `${msg.senderId}-${index}`}
          renderItem={({ item: msg }) => {
            const isOwnMessage = msg.senderId === userId;
            return (
              <View
                style={[
                  s.messageBubbleContainer,
                  isOwnMessage && s.messageBubbleContainerOwn,
                ]}
              >
                <View
                  style={[
                    s.messageBubble,
                    isOwnMessage && s.messageBubbleOwn,
                  ]}
                >
                  <Text
                    style={[
                      s.messageText,
                      isOwnMessage && s.messageTextOwn,
                    ]}
                  >
                    {msg.content}
                  </Text>
                  {msg.timestampMs && (
                    <Text
                      style={[
                        s.messageTime,
                        isOwnMessage && s.messageTimeOwn,
                      ]}
                    >
                      {new Date(msg.timestampMs).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </Text>
                  )}
                </View>
              </View>
            );
          }}
          style={s.messagesList}
          contentContainerStyle={s.messagesListContent}
          scrollEventThrottle={400}
        />

        {/* ── Text Input + Send Button ────────────────────────────────────────── */}
        <View style={s.inputArea}>
          <TextInput
            style={s.textInput}
            placeholder="Type a message..."
            placeholderTextColor={colors.textMuted}
            value={messageText}
            onChangeText={setMessageText}
            multiline
            maxLength={500}
            editable={isConnected}
          />
          <TouchableOpacity
            style={[s.sendButton, !isConnected && s.sendButtonDisabled]}
            onPress={handleSendMessage}
            activeOpacity={0.7}
            disabled={!isConnected || !messageText.trim()}
          >
            {isConnected ? (
              <Send size={18} color="#000" strokeWidth={2.2} />
            ) : (
              <ActivityIndicator size="small" color="#000" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardAvoid: {
    flex: 1,
  },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  connectionStatus: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── Icebreaker Banner
  icebreakerBanner: {
    marginHorizontal: 12,
    marginVertical: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: 'rgba(100,116,139,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(100,116,139,0.2)',
  },
  icebreakerBannerActive: {
    backgroundColor: 'rgba(59,130,246,0.08)',
    borderColor: 'rgba(59,130,246,0.3)',
  },
  icebreakerLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 0.5,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  icebreakerText: {
    fontSize: 13,
    fontWeight: '500',
    color: colors.text,
    lineHeight: 18,
  },

  // ── Error Banner
  errorBanner: {
    marginHorizontal: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    fontWeight: '500',
  },

  // ── Messages List
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 12,
    paddingVertical: 12,
  },

  // ── Message Bubble
  messageBubbleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 10,
  },
  messageBubbleContainerOwn: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageBubbleOwn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
  },
  messageText: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
  },
  messageTextOwn: {
    color: '#000',
    fontWeight: '500',
  },
  messageTime: {
    fontSize: 10,
    color: colors.textMuted,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(0,0,0,0.6)',
  },

  // ── Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 14,
    maxHeight: 100,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
    elevation: 0,
    shadowOpacity: 0,
  },
});
