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
import { BlurView } from 'expo-blur';
import { ArrowLeft } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useLocation } from '../hooks/useLocation';
import { discoveryService } from '../services/discoveryService';
import SpotCard from '../components/SpotCard';

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

      {/* Spots list */}
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
          <View style={s.spotsGrid}>
            {spots.map(spot => (
              <SpotCard key={spot.id} spot={spot} />
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
  spotsGrid: {
    gap: 12,
  },
});
