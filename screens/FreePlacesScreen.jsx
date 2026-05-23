import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { ArrowLeft, Star, Navigation } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { discoveryService } from '../services/discoveryService';
import { useNavigation } from '@react-navigation/native';

// ─── Nearby card component (reused from ExploreScreen) ──────────────────────

function NearbyCard({ item, isLast }) {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const navigation = useNavigation();

  const handlePress = () => {
    if (item.id) {
      navigation.navigate('PlaceDetail', { placeId: item.id });
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      style={[s.nearbyCard, !isLast && s.nearbyCardBorder]}
      onPress={handlePress}
    >
      <View style={s.nearbyThumb}>
        {item.image ? (
          <Image source={{ uri: item.image }} style={s.nearbyThumbImage} />
        ) : (
          <View style={[s.nearbyThumb, { backgroundColor: colors.surfaceLight }]} />
        )}
      </View>
      <View style={s.nearbyInfo}>
        <View style={s.nearbyTitleRow}>
          <Text style={s.nearbyTitle} numberOfLines={1}>{item.title}</Text>
          {item.badge && (
            <View style={[s.nearbyBadge, {
              backgroundColor: item.badgeColor + '20',
              borderColor: item.badgeColor + '50',
            }]}>
              <Text style={[s.nearbyBadgeText, { color: item.badgeColor }]}>
                {item.badge}
              </Text>
            </View>
          )}
        </View>
        <View style={s.nearbyMetaRow}>
          <View style={s.nearbyRatingGroup}>
            <Star size={11} color="#F59E0B" fill="#F59E0B" />
            <Text style={s.nearbyRatingText}>{item.rating}</Text>
          </View>
          <View style={s.nearbyDistGroup}>
            <Navigation size={10} color={colors.primary} strokeWidth={2.5} />
            <Text style={s.nearbyDistText}>{item.distance}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function FreePlacesScreen() {
  const { colors } = useTheme();
  const s = getStyles(colors);
  const navigation = useNavigation();

  const [freePlaces, setFreePlaces] = useState([]);
  const [loading, setLoading] = useState(true);

  // Unique gradient color for free places - using a vibrant green gradient
  const freeGradient = ['#10B981', '#059669'];

  useEffect(() => {
    fetchFreePlaces();
  }, []);

  const fetchFreePlaces = async () => {
    try {
      setLoading(true);
      const data = await discoveryService.getFreePlaces();
      setFreePlaces(data);
      console.log('[FreePlacesScreen] Free places loaded:', data.length);
    } catch (error) {
      console.error('[FreePlacesScreen] Failed to fetch free places:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      {/* Header with unique gradient background */}
      <LinearGradient
        colors={freeGradient}
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
                  <Text style={s.title}>Free Today</Text>
                  <Text style={s.emoji}>💸</Text>
                </View>
                <Text style={s.subtitle}>{freePlaces.length} free places found</Text>
              </View>
            </View>
          </View>
        </BlurView>
      </LinearGradient>

      {/* Places list */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : freePlaces.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🔍</Text>
            <Text style={s.emptyTitle}>No free places found</Text>
            <Text style={s.emptyText}>
              Check back later for free activities
            </Text>
          </View>
        ) : (
          <View style={s.placesList}>
            {freePlaces.map((item, i) => (
              <NearbyCard
                key={item.id}
                item={item}
                isLast={i === freePlaces.length - 1}
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
  placesList: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  nearbyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 13,
  },
  nearbyCardBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  nearbyThumb: {
    width: 82,
    height: 82,
    borderRadius: 16,
    overflow: 'hidden',
  },
  nearbyThumbImage: {
    width: '100%',
    height: '100%',
  },
  nearbyInfo: { flex: 1, gap: 4 },
  nearbyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  nearbyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  nearbyBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  nearbyBadgeText: { fontSize: 9, fontWeight: '800' },
  nearbyMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nearbyRatingGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nearbyRatingText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  nearbyDistGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  nearbyDistText: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
});
