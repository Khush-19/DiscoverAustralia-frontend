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
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Send, ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useSquad } from '../hooks/useSquad';
import { useUser } from '../hooks/useUser';
import { squadService } from '../services/squadService';

/**
 * SquadChatScreen
 *
 * Chat interface for Squad members using HTTP API.
 *
 * Features:
 * - Message list with sender distinction (own messages vs others)
 * - Text input + send button
 * - Auto-scroll to latest message
 * - WeChat-style group chat UI
 * - Safe area and keyboard avoidance for notch phones
 * - Pull-to-refresh to reload chat history
 * - Auto-refresh chat history every 30 seconds
 */
export default function SquadChatScreen({ route, navigation }) {
  const { colors, isDark } = useTheme();
  const { mySquad } = useSquad();
  const { user } = useUser();
  const s = useMemo(() => getStyles(colors), [colors]);

  const [messageText, setMessageText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const flatListRef = useRef(null);
  const autoRefreshTimerRef = useRef(null);

  // Get squadId from route params or mySquad context
  const squadId = route?.params?.squadId || mySquad?.id;
  const userEmail = user?.email || 'anonymous@example.com';

  // Load chat history from server
  const loadChatHistory = async (isRefresh = false) => {
    if (!squadId) {
      console.warn('No squadId available');
      return;
    }

    try {
      if (isRefresh) {
        setIsRefreshing(true);
      } else {
        setIsInitialLoading(true);
      }
      
      const chatMessages = await squadService.fetchSquadChatHistory(squadId);
      setMessages(chatMessages || []);
      console.log(`Loaded ${chatMessages?.length || 0} chat messages`);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      Alert.alert('Error', 'Failed to load chat history');
    } finally {
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  };

  // Load initial chat history on component mount
  useEffect(() => {
    loadChatHistory(false);
  }, [squadId]);

  // Set up auto-refresh timer (every 30 seconds)
  useEffect(() => {
    if (!squadId) return;

    // Set up the auto-refresh interval
    autoRefreshTimerRef.current = setInterval(() => {
      console.log('Auto-refreshing chat history...');
      loadChatHistory(true);
    }, 30000); // 30 seconds

    // Cleanup timer on unmount
    return () => {
      if (autoRefreshTimerRef.current) {
        clearInterval(autoRefreshTimerRef.current);
      }
    };
  }, [squadId]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && !isRefreshing) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages, isRefreshing]);

  const handleRefresh = () => {
    loadChatHistory(true);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;
    
    if (!squadId) {
      Alert.alert('Error', 'Squad ID not found');
      return;
    }

    setIsLoading(true);
    try {
      // Generate unique temp ID: timestamp + random number
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
      
      // Optimistically add message to UI
      const tempMessage = {
        id: tempId,
        email: userEmail,
        message: messageText.trim(),
        createdAt: new Date().toISOString(),
        isTemp: true,
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setMessageText('');

      // Send to backend
      const response = await squadService.sendChatMessage(squadId, messageText.trim());
      
      // Update temp message with real data
      setMessages(prev => 
        prev.map(msg => 
          msg.id === tempId ? { ...response, isTemp: false } : msg
        )
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message. Please try again.');
      // Remove temp message on error
      setMessages(prev => prev.filter(msg => !msg.isTemp));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoBack = () => {
    navigation?.goBack();
  };

  // Determine squad info
  const squadTitle = route?.params?.squadTitle || mySquad?.title || 'Squad Chat';

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.keyboardAvoid}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {/* ── Header ──────────────────────────────────────────────────────────── */}
        <View style={s.header}>
          <TouchableOpacity
            onPress={handleGoBack}
            style={s.backButton}
            activeOpacity={0.7}
          >
            <ArrowLeft size={22} color={colors.text} strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={s.headerContent}>
            <Text style={s.headerTitle} numberOfLines={1}>
              {squadTitle}
            </Text>
            <Text style={s.headerSubtitle}>Group Chat</Text>
          </View>
        </View>

        {/* ── Messages List ───────────────────────────────────────────────────── */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => `${item.id || item.createdAt || 'msg'}-${index}`}
          renderItem={({ item: msg }) => {
            const isOwnMessage = msg.email === userEmail;
            return (
              <View
                style={[
                  s.messageBubbleContainer,
                  isOwnMessage ? s.messageBubbleContainerOwn : s.messageBubbleContainerOther,
                ]}
              >
                {!isOwnMessage && (
                  <View style={s.senderAvatar}>
                    <Text style={s.senderAvatarText}>
                      {msg.email?.charAt(0).toUpperCase() || '?'}
                    </Text>
                  </View>
                )}
                <View
                  style={[
                    s.messageBubble,
                    isOwnMessage ? s.messageBubbleOwn : s.messageBubbleOther,
                  ]}
                >
                  {!isOwnMessage && (
                    <Text style={s.senderName} numberOfLines={1}>
                      {msg.email?.split('@')[0] || 'Unknown'}
                    </Text>
                  )}
                  <Text
                    style={[
                      s.messageText,
                      isOwnMessage ? s.messageTextOwn : s.messageTextOther,
                    ]}
                  >
                    {msg.message}
                  </Text>
                  <Text
                    style={[
                      s.messageTime,
                      isOwnMessage ? s.messageTimeOwn : s.messageTimeOther,
                    ]}
                  >
                    {new Date(msg.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
              </View>
            );
          }}
          style={s.messagesList}
          contentContainerStyle={s.messagesListContent}
          showsVerticalScrollIndicator={false}
          refreshing={isRefreshing}
          onRefresh={handleRefresh}
          ListEmptyComponent={
            isInitialLoading ? (
              <View style={s.loadingContainer}>
                <ActivityIndicator size="large" color={colors.primary} />
              </View>
            ) : (
              <View style={s.emptyContainer}>
                <Text style={s.emptyText}>No messages yet</Text>
              </View>
            )
          }
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
            editable={!isLoading}
          />
          <TouchableOpacity
            style={[s.sendButton, (!messageText.trim() || isLoading) && s.sendButtonDisabled]}
            onPress={handleSendMessage}
            activeOpacity={0.7}
            disabled={!messageText.trim() || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Send size={20} color="#fff" strokeWidth={2.5} />
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
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: colors.border,
    backgroundColor: colors.surface,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
    marginTop: 2,
  },

  // ── Messages List
  messagesList: {
    flex: 1,
  },
  messagesListContent: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 15,
    color: colors.textMuted,
    fontWeight: '500',
  },

  // ── Message Bubble
  messageBubbleContainer: {
    flexDirection: 'row',
    marginBottom: 12,
    alignItems: 'flex-end',
  },
  messageBubbleContainerOwn: {
    justifyContent: 'flex-end',
  },
  messageBubbleContainerOther: {
    justifyContent: 'flex-start',
  },
  senderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  senderAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primary,
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderWidth: 0.5,
  },
  messageBubbleOwn: {
    backgroundColor: colors.primary,
    borderColor: colors.primaryDark,
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: colors.surfaceLight,
    borderColor: colors.border,
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  messageTextOwn: {
    color: '#fff',
    fontWeight: '500',
  },
  messageTextOther: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  messageTimeOwn: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  messageTimeOther: {
    color: colors.textMuted,
  },

  // ── Input Area
  inputArea: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderTopWidth: 0.5,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
    gap: 10,
    paddingBottom: Platform.OS === 'android' ? 20 : 10,
  },
  textInput: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: colors.background,
    color: colors.text,
    borderWidth: 0.5,
    borderColor: colors.border,
    fontSize: 15,
    maxHeight: 100,
    minHeight: 40,
  },
  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  sendButtonDisabled: {
    backgroundColor: colors.textMuted,
    opacity: 0.5,
    elevation: 0,
    shadowOpacity: 0,
  },
});
