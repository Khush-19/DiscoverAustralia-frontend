import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Mail, MailOpen, Bell, AlertTriangle, Info } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { getAllMessages } from '../services/messageService';

// ─── Color generation algorithm for message kinds ────────────────────────────

/**
 * Convert hex color to rgba with custom opacity
 * @param {string} hex - Hex color code (e.g., '#3B82F6')
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string
 */
function hexToRgba(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Convert hex color to 50% gray + 50% opacity
 * @param {string} hex - Hex color code (e.g., '#3B82F6')
 * @param {number} opacity - Opacity value (0-1)
 * @returns {string} RGBA color string with 50% gray tone
 */
function hexToRgbaWithGray(hex, opacity) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  // Calculate grayscale value (average of RGB)
  const gray = Math.round((r + g + b) / 3);
  return `rgba(${gray}, ${gray}, ${gray}, ${opacity})`;
}

/**
 * Generate a consistent color based on the kind string.
 * Uses a simple hash function to map strings to colors.
 * @param {string} kind - The message kind (e.g., "system", "notification", "alert")
 * @returns {object} Object with backgroundColor and textColor
 */
function generateKindColor(kind) {
  if (!kind) return { backgroundColor: '#6B7280', textColor: '#FFFFFF' };

  // Simple hash function to generate consistent colors
  let hash = 0;
  for (let i = 0; i < kind.length; i++) {
    hash = kind.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Map hash to a pleasant color palette
  const colors = [
    { backgroundColor: '#3B82F6', textColor: '#FFFFFF' }, // Blue
    { backgroundColor: '#10B981', textColor: '#FFFFFF' }, // Green
    { backgroundColor: '#F59E0B', textColor: '#FFFFFF' }, // Amber
    { backgroundColor: '#EF4444', textColor: '#FFFFFF' }, // Red
    { backgroundColor: '#8B5CF6', textColor: '#FFFFFF' }, // Purple
    { backgroundColor: '#EC4899', textColor: '#FFFFFF' }, // Pink
    { backgroundColor: '#06B6D4', textColor: '#FFFFFF' }, // Cyan
    { backgroundColor: '#F97316', textColor: '#FFFFFF' }, // Orange
  ];

  const index = Math.abs(hash) % colors.length;
  return colors[index];
}

/**
 * Get icon component based on message kind
 */
function getKindIcon(kind, size = 16) {
  switch (kind?.toLowerCase()) {
    case 'alert':
      return <AlertTriangle size={size} color="#EF4444" />;
    case 'notification':
      return <Bell size={size} color="#3B82F6" />;
    case 'system':
      return <Info size={size} color="#10B981" />;
    default:
      return <Mail size={size} color="#6B7280" />;
  }
}

// ─── Message Card Component ──────────────────────────────────────────────────

function MessageCard({ message, onPress }) {
  const { colors } = useTheme();
  const s = getStyles(colors);
  
  const kindColor = generateKindColor(message.kind);
  const isUnread = !message.read;

  // Format createdAt date
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    } catch {
      return '';
    }
  };

  return (
    <TouchableOpacity
      style={[
        s.messageCard,
        isUnread 
          ? { backgroundColor: hexToRgba(kindColor.backgroundColor, 0.15), borderColor: kindColor.backgroundColor }
          : { backgroundColor: 'rgba(107, 114, 128, 0.1)', borderColor: 'rgba(107, 114, 128, 0.3)' }
      ]}
      onPress={() => onPress(message)}
      activeOpacity={0.7}
    >
      <View style={s.messageContent}>
        {/* Header row: kind badge + time */}
        <View style={s.messageHeader}>
          <View style={[s.kindBadge, { backgroundColor: isUnread ? kindColor.backgroundColor : hexToRgbaWithGray(kindColor.backgroundColor, 0.5) }]}>
            <Text style={[s.kindText, { color: '#FFFFFF' }]}>
              {message.kind || 'Message'}
            </Text>
          </View>
          <Text style={[s.timeText, !isUnread && { color: 'rgba(107, 114, 128, 0.6)' }]}>{formatDate(message.createdAt)}</Text>
        </View>

        {/* Title */}
        <Text style={[s.titleText, !isUnread && { color: 'rgba(107, 114, 128, 0.8)' }]} numberOfLines={2}>
          {message.title}
        </Text>

        {/* Content preview */}
        <Text style={[s.contentText, !isUnread && { color: 'rgba(107, 114, 128, 0.7)' }]} numberOfLines={2}>
          {message.content}
        </Text>

        {/* Footer: read status */}
        <View style={s.messageFooter}>
          {!isUnread ? (
            <MailOpen size={14} color="rgba(107, 114, 128, 0.6)" />
          ) : (
            <Mail size={14} color={kindColor.backgroundColor} />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Empty State Component ───────────────────────────────────────────────────

function EmptyState() {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <View style={s.emptyState}>
      <Mail size={48} color={colors.textMuted} strokeWidth={1.5} />
      <Text style={s.emptyTitle}>No messages yet</Text>
      <Text style={s.emptySubtitle}>
        When you receive messages, they'll appear here
      </Text>
    </View>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

export default function MessagesScreen({ navigation }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch messages
  const fetchMessages = async () => {
    try {
      setError(null);
      const data = await getAllMessages();
      // Sort by createdAt descending (newest first)
      const sorted = data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      setMessages(sorted);
    } catch (err) {
      console.error('Failed to fetch messages:', err);
      setError(err.message || 'Failed to load messages');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  // Pull to refresh handler
  const handleRefresh = () => {
    setRefreshing(true);
    fetchMessages();
  };

  // Handle message press
  const handleMessagePress = (message) => {
    // TODO: Navigate to message detail screen or show full content
    console.log('Message pressed:', message);
    // You can add navigation here later:
    // navigation.navigate('MessageDetail', { message });
  };

  // Count unread messages
  const unreadCount = messages.filter(m => !m.read).length;

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={20} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          <Text style={s.headerTitle}>Messages</Text>
          {unreadCount > 0 && (
            <View style={s.unreadBadge}>
              <Text style={s.unreadBadgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 38 }} />
      </View>

      {/* Content */}
      {loading ? (
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading messages...</Text>
        </View>
      ) : error ? (
        <View style={s.errorContainer}>
          <AlertTriangle size={48} color={colors.error} />
          <Text style={s.errorText}>{error}</Text>
          <TouchableOpacity style={s.retryBtn} onPress={fetchMessages}>
            <Text style={s.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : messages.length === 0 ? (
        <EmptyState />
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
        >
          {messages.map((message, index) => (
            <MessageCard
              key={`${message.id?.timestamp || ''}-${message.createdAt || ''}-${index}`}
              message={message}
              onPress={handleMessagePress}
            />
          ))}
          <View style={{ height: 20 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },

  // Loading & Error states
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  errorText: {
    color: colors.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },

  // Scroll content
  scrollContent: {
    padding: 16,
    gap: 12,
  },

  // Message card
  messageCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 2,
    position: 'relative',
  },
  messageContent: {
    gap: 8,
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  kindBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  kindText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '500',
  },
  titleText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    lineHeight: 20,
  },
  unreadTitle: {
    color: colors.primary,
  },
  contentText: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  emailText: {
    flex: 1,
    fontSize: 11,
    color: colors.textMuted,
    marginRight: 8,
  },
});
