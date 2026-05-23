import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ImageBackground,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Check } from 'lucide-react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useTheme } from '../hooks/useTheme';
import { fetchActivitiesByKind } from '../services/AuraAPI';
import { setGlobalSelectedActivities } from './activitySelectionState';

// ─── Activity Card Component ────────────────────────────────────────────────

function ActivityCard({ activity, isSelected, onToggle }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <TouchableOpacity 
      activeOpacity={0.9} 
      style={[
        s.activityCardShell,
        isSelected && s.activityCardSelected,
      ]}
      onPress={() => onToggle(activity)}
    >
      <ImageBackground
        source={{ uri: activity.img }}
        style={s.activityCard}
        imageStyle={s.activityCardImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.78)']}
          style={s.activityCardGrad}
        >
          {/* Kind badge top-left */}
          <View style={s.activityKindBadge}>
            <Text style={s.activityKindBadgeText}>{activity.kind}</Text>
          </View>

          {/* Selected indicator */}
          {isSelected && (
            <View style={s.selectedIndicator}>
              <Check size={20} color="#fff" strokeWidth={3} />
            </View>
          )}

          {/* Bottom content */}
          <View style={s.activityBottom}>
            <View style={s.activityInfo}>
              <Text style={s.activityTitle} numberOfLines={2}>{activity.title}</Text>
            </View>

            <View style={[s.chooseBtn, isSelected && s.chooseBtnSelected]}>
              <Text style={s.chooseBtnText}>
                {isSelected ? 'Selected' : 'Choose'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function SelectActivityDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { vibe } = route.params;
  const { colors } = useTheme();
  const s = getStyles(colors);

  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Get selected activities from navigation params
  const [selectedActivities, setSelectedActivities] = useState(
    route.params?.selectedActivities || []
  );

  useEffect(() => {
    if (!vibe?.label) return;
    let cancelled = false;
    setLoading(true);

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

  const handleToggleActivity = (activity) => {
    const activityId = activity._id || activity.idString || activity.activityId || activity.id;
    
    setSelectedActivities(prev => {
      const isSelected = prev.some(a => {
        const id = a._id || a.idString || a.activityId || a.id;
        return id === activityId;
      });
      
      if (isSelected) {
        return prev.filter(a => {
          const id = a._id || a.idString || a.activityId || a.id;
          return id !== activityId;
        });
      } else {
        return [...prev, activity];
      }
    });
  };

  const handleDone = () => {
    console.log('SelectActivityDetail Done - selectedActivities:', selectedActivities.length);
    
    // Save to global state
    setGlobalSelectedActivities(selectedActivities);
    
    // Navigate back to SelectActivity
    navigation.goBack();
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header with gradient background */}
      <LinearGradient
        colors={vibe.colorGradientFull}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.headerBackground}
      >
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

            {/* Done button */}
            <TouchableOpacity
              style={s.doneBtn}
              onPress={handleDone}
              activeOpacity={0.7}
            >
              <Text style={s.doneBtnText}>Done</Text>
            </TouchableOpacity>
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
            {activities.map((activity, index) => {
              const activityId = activity._id || activity.idString || activity.activityId || activity.id;
              const isSelected = selectedActivities.some(a => {
                const id = a._id || a.idString || a.activityId || a.id;
                return id === activityId;
              });
              
              return (
                <ActivityCard
                  key={activityId}
                  activity={activity}
                  isSelected={isSelected}
                  onToggle={handleToggleActivity}
                />
              );
            })}
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
    minHeight: 60,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
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
    fontSize: 24,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
    marginTop: 2,
  },
  doneBtn: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  doneBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
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
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activityCardSelected: {
    borderColor: colors.primary,
  },
  activityCard: { height: 200, width: '100%' },
  activityCardImage: { borderRadius: 24 },
  activityCardGrad: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  
  // Selected indicator
  selectedIndicator: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
  },
  
  // Activity kind badge
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
  
  // Choose button
  chooseBtn: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 22,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  chooseBtnSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chooseBtnText: {
    color: '#fff',
    fontSize: 13,
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
