import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ArrowLeft, MessageCircle, X } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../hooks/useUser';
import { squadService } from '../services/squadService';

export default function SquadDetailScreen({ route, navigation }) {
  const { colors } = useTheme();
  const { user } = useUser();
  const s = getStyles(colors);
  
  const { squadId } = route.params;
  const [squad, setSquad] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Generate random pastel color for avatar background
  const getRandomPastelColor = (index) => {
    const colors = [
      '#FFB3BA', // Pastel Red
      '#FFDFBA', // Pastel Orange
      '#FFFFBA', // Pastel Yellow
      '#BAFFC9', // Pastel Green
      '#BAE1FF', // Pastel Blue
      '#E2BAFF', // Pastel Purple
      '#FFBAE0', // Pastel Pink
      '#BAFFF5', // Pastel Cyan
    ];
    return colors[index % colors.length];
  };

  useEffect(() => {
    fetchSquadDetail();
  }, [squadId]);

  const fetchSquadDetail = async () => {
    try {
      setLoading(true);
      const data = await squadService.fetchSquadDetail(squadId);
      setSquad(data);
      setError(null);
    } catch (err) {
      setError(err.message ?? 'Failed to load squad details');
      console.error('Fetch squad detail error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Check if current user is a member
  const isMember = user?.email && squad?.members?.some(
    member => member.email === user.email
  );

  if (loading) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={s.loadingText}>Loading squad...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !squad) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.errorContainer}>
          <Text style={s.errorText}>{error || 'Squad not found'}</Text>
          <TouchableOpacity style={s.backButton} onPress={() => navigation.goBack()}>
            <Text style={s.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backIcon}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle} numberOfLines={1}>{squad.name}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scrollContent}>
        {/* Squad Info */}
        <View style={s.infoSection}>
          <Text style={s.squadName}>{squad.name}</Text>
          
          {/* Light gray divider under title */}
          <View style={s.titleDivider} />
          
          {squad.subtitle && (
            <Text style={s.squadSubtitle} numberOfLines={2}>
              {squad.subtitle.length > 50 ? squad.subtitle.substring(0, 50) + '...' : squad.subtitle}
            </Text>
          )}
          
          {/* Tags */}
          <View style={s.tagsContainer}>
            {squad.tags?.map((tag, idx) => (
              <View key={idx} style={s.tag}>
                <Text style={s.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Members Section */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Members</Text>
            <Text style={s.sectionMemberCount}>
              {squad.members?.length || 0} member{(squad.members?.length || 0) !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={s.membersList}>
            {squad.members?.map((member, idx) => (
              <View key={idx} style={s.memberItem}>
                <View style={[s.memberAvatar, { backgroundColor: getRandomPastelColor(idx) }]}>
                  <Text style={s.memberInitials}>
                    {member.nickname ? member.nickname.substring(0, 2).toUpperCase() : 'U'}
                  </Text>
                </View>
                <View style={s.memberInfo}>
                  <Text style={s.memberNickname}>{member.nickname || 'Unknown'}</Text>
                </View>
                {member.email === user?.email && (
                  <View style={s.youBadge}>
                    <Text style={s.youBadgeText}>You</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Activities Section */}
        {squad.activities && squad.activities.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Activities</Text>
            {squad.activities.map((activity, idx) => (
              <TouchableOpacity
                key={activity.id || idx}
                style={s.activityCard}
                activeOpacity={0.8}
                onPress={() => {
                  // Navigate to activity detail page
                  navigation.navigate('ActivityDetail', {
                    activityId: activity.id
                  });
                }}
              >
                <View style={s.activityInfo}>
                  <Text style={s.activityTitle} numberOfLines={2}>{activity.title}</Text>
                  <Text style={s.activityTime}>
                    {new Date(activity.startTime).toLocaleDateString('en-AU', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Action Buttons */}
      <View style={s.bottomActions}>
        {isMember ? (
          <>
            <TouchableOpacity style={s.chatButton} activeOpacity={0.8}>
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.chatButtonGrad}
              >
                <MessageCircle size={20} color="#000" strokeWidth={2} />
                <Text style={s.chatButtonText}>Chat</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity 
              style={s.closeButton} 
              activeOpacity={0.8}
              onPress={() => navigation.goBack()}
            >
              <X size={20} color={colors.text} strokeWidth={2} />
              <Text style={s.closeButtonText}>Close</Text>
            </TouchableOpacity>
          </>
        ) : (
          <TouchableOpacity 
            style={s.closeButtonFull} 
            activeOpacity={0.8}
            onPress={() => navigation.goBack()}
          >
            <X size={20} color={colors.text} strokeWidth={2} />
            <Text style={s.closeButtonText}>Close</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backIcon: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  scrollContent: {
    paddingBottom: 20,
  },
  infoSection: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  squadName: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 8,
  },
  titleDivider: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: 12,
    marginBottom: 16,
  },
  squadSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
    justifyContent: 'flex-end',
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: colors.primary + '1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  tagText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fff',
  },
  memberCount: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sectionMemberCount: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  memberInitials: {
    fontSize: 14,
    fontWeight: '800',
    color: '#000',
  },
  memberInfo: {
    flex: 1,
  },
  memberNickname: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
  },
  youBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: colors.primary + '1A',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  youBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  activityCard: {
    padding: 16,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  activityInfo: {
    gap: 6,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  activityTime: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  chatButton: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  chatButtonGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  chatButtonText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  closeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonFull: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
});
