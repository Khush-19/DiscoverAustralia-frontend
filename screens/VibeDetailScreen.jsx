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
import { ArrowLeft, Star, Clock, Navigation, MapPin } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useLocation } from '../hooks/useLocation';
import { discoveryService } from '../services/discoveryService';

// ─── Hero Spot Card Component ───────────────────────────────────────────────
// Each spot displayed as a full-width hero card (like HomeScreen's trending activity)

function HeroSpotCard({ spot }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <TouchableOpacity activeOpacity={0.9} style={s.heroSpotShell}>
      <ImageBackground
        source={{ uri: spot.imageURL }}
        style={s.heroSpotCard}
        imageStyle={s.heroSpotImage}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.08)', 'rgba(0,0,0,0.78)']}
          style={s.heroSpotGrad}
        >
          {/* Badge top-left */}
          <View style={[s.spotBadge, { backgroundColor: spot.badgeColor }]}>
            <Text style={s.spotBadgeText}>{spot.badge}</Text>
          </View>

          {/* Bottom content row */}
          <View style={s.spotBottom}>
            <View style={s.spotInfo}>
              <Text style={s.spotName} numberOfLines={1}>{spot.name}</Text>
              
              {/* Rating + distance row */}
              <View style={s.spotMeta}>
                <Star size={11} color="#F59E0B" fill="#F59E0B" />
                <Text style={s.spotMetaText}>{spot.rating.toFixed(1)}</Text>
                <Text style={s.dot}>·</Text>
                <MapPin size={11} color="#D1D5DB" />
                <Text style={s.spotMetaText}>
                  {spot.distanceLabel ?? `${spot.distanceKm} km`}
                </Text>
              </View>
            </View>

            <View style={s.spotActions}>
              <View style={s.freeBadge}>
                <Text style={s.freeBadgeText}>{spot.badge === 'FREE' ? 'FREE' : spot.badge}</Text>
              </View>
              <TouchableOpacity style={s.goBtn} activeOpacity={0.85}>
                <Navigation size={12} color="#000" strokeWidth={2.5} />
                <Text style={s.goBtnText}>Go →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

export default function VibeDetailScreen({ route, navigation }) {
  const { vibe } = route.params;
  const { colors } = useTheme();
  const { coords } = useLocation();
  const s = getStyles(colors);

  const [spots, setSpots] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!vibe?.id) return;
    let cancelled = false;
    setLoading(true);
    discoveryService.getSpotsByVibe(vibe.id, coords)
      .then(data => { 
        if (!cancelled) {
          setSpots(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [vibe?.id, coords]);

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

      {/* Spots list - each spot as a Hero Card */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {loading ? (
          <View style={s.loader}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : spots.length === 0 ? (
          <View style={s.emptyState}>
            <Text style={s.emptyEmoji}>🔍</Text>
            <Text style={s.emptyTitle}>No spots found</Text>
            <Text style={s.emptyText}>
              Try adjusting your location or check back later
            </Text>
          </View>
        ) : (
          <View style={s.spotsList}>
            {spots.map(spot => (
              <HeroSpotCard key={spot.id} spot={spot} />
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
  
  // Hero Spot Card styles (full-width cards like HomeScreen's hero)
  heroSpotShell: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  heroSpotCard: { height: 210, width: '100%' },
  heroSpotImage: { borderRadius: 24 },
  heroSpotGrad: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  
  // Badge
  spotBadge: {
    alignSelf: 'flex-start',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  spotBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  
  // Bottom row
  spotBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  spotInfo: { flex: 1, marginRight: 12 },
  spotName: {
    fontSize: 19,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 7,
  },
  spotMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  spotMetaText: { fontSize: 11, color: '#D1D5DB', fontWeight: '500' },
  dot: { color: '#6B7280', fontSize: 12, marginHorizontal: 1 },
  
  // Actions
  spotActions: { alignItems: 'flex-end', gap: 8, marginLeft: 14 },
  freeBadge: {
    backgroundColor: colors.success,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  freeBadgeText: { color: '#fff', fontSize: 10, fontWeight: '800', letterSpacing: 0.5 },
  goBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 9,
    elevation: 5,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  goBtnText: { color: '#000', fontSize: 12, fontWeight: '800' },
  
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
  spotsList: {
    gap: 16,
  },
});
