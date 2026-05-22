import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { fetchActivitiesByKind } from '../services/AuraAPI';

// ─── Activity Card Component ────────────────────────────────────────────────
// Displays activities from the new API

function ActivityCard({ activity }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-AU', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <TouchableOpacity activeOpacity={0.9} style={s.activityCardShell}>
      <ImageBackground
        source={{ uri: activity.img }}
        style={s.activityCard}
        imageStyle={s.activityCardImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.78)']}
          style={s.activityCardGrad}
        >
          {/* Kind badge top-left - frosted glass */}
          <View style={s.activityKindBadge}>
            <Text style={s.activityKindBadgeText}>{activity.kind}</Text>
          </View>

          {/* Bottom content */}
          <View style={s.activityBottom}>
            <View style={s.activityInfo}>
              <Text style={s.activityTitle} numberOfLines={2}>{activity.title}</Text>
              
              {/* Time info */}
              <View style={s.activityTimeRow}>
                <Text style={s.activityTimeLabel}>Start:</Text>
                <Text style={s.activityTimeValue}>{formatTime(activity.start_time)}</Text>
              </View>
              <View style={s.activityTimeRow}>
                <Text style={s.activityTimeLabel}>End:</Text>
                <Text style={s.activityTimeValue}>{formatTime(activity.end_time)}</Text>
              </View>
            </View>

            <TouchableOpacity style={s.detailBtn} activeOpacity={0.85}>
              <Text style={s.detailBtnText}>View Details</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function VibeDetailScreen({ route, navigation }) {
  const { vibe } = route.params;
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vibe?.label) return;
    let cancelled = false;
    setLoading(true);

    // Fetch activities by kind
    fetchActivitiesByKind(vibe.label)
      .then((activitiesData) => {
        if (!cancelled) {
          setActivities(activitiesData);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [vibe?.label]);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={vibe.colorGradientFull}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.headerBackground}
      >
        {/* Frosted glass overlay */}
        <BlurView intensity={50} tint="default" style={s.frostedGlass}>
          <View style={s.header}>
            <View style={s.headerContent}>
              <TouchableOpacity
                style={s.backBtn}
                onPress={() => navigation.goBack()}
                activeOpacity={0.7}
              >
                <ArrowLeft size={22} color="#fff" strokeWidth={2.5} />
              </TouchableOpacity>

              <View style={s.titleBlock}>
                <View style={s.titleRow}>
                  <Text style={s.title}>{vibe.label}</Text>
                  <Text style={s.emoji}>{vibe.emoji}</Text>
                </View>
                <Text style={s.subtitle}>{vibe.subtitle}</Text>
              </View>
            </View>
          </View>
        </BlurView>
      </LinearGradient>

      {/* Activities list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : activities.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>📅</Text>
            <Text style={s.emptyTitle}>No activities found</Text>
            <Text style={s.emptyText}>
              Check back later for upcoming events
            </Text>
          </View>
        ) : (
          <View style={s.activitiesList}>
            {activities.map((activity, index) => (
              <ActivityCard 
                key={activity.id?.timestamp || index} 
                activity={activity} 
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerBackground: {
    position: 'relative',
  },
  frostedGlass: {
    overflow: 'hidden',
  },
  header: {
    padding: 16,
    paddingTop: 12,
    paddingBottom: 14,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  titleBlock: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 26,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 3,
  },
  
  // Activity Card styles
  activityCardShell: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  activityCard: { height: 200, width: '100%' },
  activityCardImage: { borderRadius: 24 },
  activityCardGrad: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  
  // Activity kind badge - frosted glass effect
  activityKindBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.5)',
    overflow: 'hidden',
  },
  activityKindBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  
  // Activity bottom content
  activityBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  activityInfo: { flex: 1, marginRight: 12, gap: 6 },
  activityTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    lineHeight: 22,
  },
  activityTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  activityTimeLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  activityTimeValue: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '500',
  },
  
  // Frosted glass detail button
  detailBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden',
  },
  detailBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  
  scrollContent: {
    padding: 16,
  },
  loader: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
  },
  emptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  activitiesList: {
    gap: 16,
  },
});
