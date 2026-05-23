import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Users, Clock, MapPin, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../hooks/useUser';
import { squadService } from '../services/squadService';

/**
 * RandomSquadRecommendation
 * 
 * Displays a random squad that the current user hasn't joined yet.
 * Fetches data from /api/squad/all and filters out joined squads.
 */
export default function RandomSquadRecommendation({ navigation }) {
  const { colors } = useTheme();
  const { user, isSquadJoined } = useUser();
  const s = getStyles(colors);
  
  const [randomSquad, setRandomSquad] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRandomSquad();
  }, []);

  const fetchRandomSquad = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      // Fetch all squads
      const allSquads = await squadService.fetchAllSquads();
      
      // Filter active squads that user hasn't joined
      const userEmail = user?.email;
      const unjoinedSquads = allSquads.filter(squad => {
        // Only show active squads
        if (!squad.alive) return false;
        
        // Filter out squads user has already joined
        if (userEmail && squad.members) {
          const isMember = squad.members.some(member => member.email === userEmail);
          if (isMember) return false;
        }
        
        return true;
      });
      
      if (unjoinedSquads.length === 0) {
        setRandomSquad(null);
        return;
      }
      
      // Randomly select one squad
      const randomIndex = Math.floor(Math.random() * unjoinedSquads.length);
      const selectedSquad = unjoinedSquads[randomIndex];
      
      // Transform squad data to match UI format
      setRandomSquad({
        id: selectedSquad.id,
        name: selectedSquad.name,
        subtitle: selectedSquad.subtitle,
        tags: selectedSquad.tags || [],
        members: selectedSquad.members || [],
        memberCount: selectedSquad.members?.length || 0,
      });
      
      console.log('[RandomSquadRecommendation] Loaded random squad:', selectedSquad.name);
    } catch (err) {
      console.error('[RandomSquadRecommendation] Failed to fetch random squad:', err);
      setError(err.message ?? 'Failed to load recommendation');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePress = () => {
    if (randomSquad?.id) {
      navigation.navigate('SquadDetail', { squadId: randomSquad.id });
    }
  };

  const handleRefresh = () => {
    fetchRandomSquad();
  };

  if (isLoading) {
    return (
      <View style={s.card}>
        <View style={s.loadingContainer}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={s.loadingText}>Finding a squad for you...</Text>
        </View>
      </View>
    );
  }

  if (error || !randomSquad) {
    return (
      <View style={s.card}>
        <View style={s.emptyContainer}>
          <Text style={s.emptyIcon}>🔍</Text>
          <Text style={s.emptyTitle}>No Recommendations Available</Text>
          <Text style={s.emptySubtitle}>
            {error ? 'Unable to load recommendations' : 'You have joined all available squads or there are no squads to recommend'}
          </Text>
        </View>
      </View>
    );
  }

  // Get first 2 tags
  const displayTags = randomSquad.tags.slice(0, 2);
  
  // Get first 3 member avatars
  const memberAvatars = randomSquad.members.slice(0, 3).map((member, index) => ({
    initials: member.nickname 
      ? member.nickname.substring(0, 2).toUpperCase() 
      : member.email.substring(0, 2).toUpperCase(),
    color: ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6'][index % 5]
  }));

  return (
    <TouchableOpacity activeOpacity={0.9} onPress={handlePress}>
      <View style={s.card}>
        {/* Header with "Recommended for you" badge */}
        <View style={s.header}>
          <View style={s.badge}>
            <Text style={s.badgeText}>✨ Recommended</Text>
          </View>
          <TouchableOpacity onPress={handleRefresh} style={s.refreshBtn}>
            <Text style={s.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Squad Name */}
        <Text style={s.squadName} numberOfLines={2}>{randomSquad.name}</Text>
        
        {/* Subtitle */}
        {randomSquad.subtitle && (
          <Text style={s.subtitle} numberOfLines={2}>{randomSquad.subtitle}</Text>
        )}

        {/* Tags and Member Count */}
        <View style={s.tagsRow}>
          {displayTags.length > 0 && (
            <View style={s.tagsContainer}>
              {displayTags.map((tag, idx) => (
                <View key={idx} style={s.tag}>
                  <Text style={s.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          )}
          
          <View style={s.memberInfo}>
            <Users size={12} color={colors.primary} strokeWidth={2.5} />
            <Text style={s.memberText}>
              {randomSquad.memberCount} member{randomSquad.memberCount !== 1 ? 's' : ''}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    marginHorizontal: 16,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  badge: {
    backgroundColor: colors.primary + '1A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  refreshBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.3)',
    backdropFilter: 'blur(10px)',
  },
  refreshText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '700',
  },
  squadName: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 24,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    lineHeight: 18,
  },
  tagsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    flex: 1,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: colors.primary + '1A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.primary + '55',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginLeft: 8,
  },
  memberText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 32,
    paddingHorizontal: 16,
  },
  emptyIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
