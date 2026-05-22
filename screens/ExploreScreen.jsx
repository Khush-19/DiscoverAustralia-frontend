import { useState, useRef, useEffect, useMemo } from 'react';
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ImageBackground,
  Image,
  TextInput,
  Modal,
  Animated,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
} from 'react-native';

const { height } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Search,
  SlidersHorizontal,
  MapPin,
  Star,
  ChevronRight,
  Navigation,
  Mic,
  X,
} from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { useUser } from '../hooks/useUser';
import { useLocation } from '../hooks/useLocation';
import { fetchInsiderTip } from '../services/AuraAPI';
import { discoveryService } from '../services/discoveryService';
import { useNavigation } from '@react-navigation/native';
import MapView, { Marker } from 'react-native-maps';

// ─── Static data ─────────────────────────────────────────────────────────────

const FILTERS = [
  { id: 'All', emoji: '✨', label: 'All' },
  { id: 'Beaches', emoji: '🏖️', label: 'Beaches' },
  { id: 'Cafes', emoji: '☕', label: 'Cafes' },
  { id: 'Parks', emoji: '🌳', label: 'Parks' },
  { id: 'Events', emoji: '🎉', label: 'Events' },
];

const MAP_DOTS = [
  { top: '20%', left: '30%', primary: true },
  { top: '42%', left: '58%', primary: true },
  { top: '25%', left: '74%', primary: false },
  { top: '58%', left: '40%', primary: false },
  { top: '50%', left: '82%', primary: true },
];

const TRENDING = [];

// ─── Map preview card ─────────────────────────────────────────────────────────

function MapPreviewCard() {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);
  const navigation = useNavigation();
  const { coords } = useLocation();

  const lat = coords?.latitude ?? -33.8885;
  const lon = coords?.longitude ?? 151.1873;

  return (
    <TouchableOpacity 
      style={s.mapCard}
      activeOpacity={0.9}
      onPress={() => navigation.navigate('FullMap')}
    >
      <MapView
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        region={{
          latitude: lat,
          longitude: lon,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        }}
        scrollEnabled={false}
        zoomEnabled={false}
        pitchEnabled={false}
        rotateEnabled={false}
        showsCompass={false}
        userInterfaceStyle={isDark ? 'dark' : 'light'}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lon }}
        >
          <View style={s.miniMapUserContainer}>
            <View style={s.miniMapUserPin} />
          </View>
        </Marker>
      </MapView>

      <LinearGradient
        colors={['transparent', isDark ? 'rgba(10,14,18,0.85)' : 'rgba(0,0,0,0.6)']}
        style={s.mapBarGrad}
      >
        <View style={s.mapBarLeft}>
          <MapPin size={12} color={colors.primary} strokeWidth={2.5} />
          <Text style={s.mapBarText}>Places near your location</Text>
        </View>
        <TouchableOpacity 
          style={s.fullMapBtn} 
          activeOpacity={0.8}
          onPress={() => navigation.navigate('FullMap')}
        >
          <Text style={s.fullMapBtnText}>Full Map</Text>
        </TouchableOpacity>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Trending card ────────────────────────────────────────────────────────────

function TrendingCard({ item }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <TouchableOpacity activeOpacity={0.85} style={s.trendingShell}>
      <ImageBackground
        source={{ uri: item.image }}
        style={s.trendingCard}
        imageStyle={s.trendingImg}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.04)', 'rgba(0,0,0,0.88)']}
          style={s.trendingGrad}
        >
          <View style={[s.trendingBadge, { backgroundColor: item.badgeColor }]}>
            <Text style={s.trendingBadgeText}>{item.badge}</Text>
          </View>
          <View style={s.trendingBottom}>
            <Text style={s.trendingTitle}>{item.title}</Text>
            <View style={s.trendingMeta}>
              <Star size={11} color="#F59E0B" fill="#F59E0B" />
              <Text style={s.trendingRating}>{item.rating}</Text>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>
    </TouchableOpacity>
  );
}

// ─── Nearby card ──────────────────────────────────────────────────────────────

function NearbyCard({ item, isLast, showDistance = true }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <TouchableOpacity
      activeOpacity={0.72}
      style={[s.nearbyCard, !isLast && s.nearbyCardBorder]}
    >
      <Image source={{ uri: item.image }} style={s.nearbyThumb} />
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
          {showDistance && (
            <View style={s.nearbyDistGroup}>
              <Navigation size={10} color={colors.primary} strokeWidth={2.5} />
              <Text style={s.nearbyDistText}>{item.distance}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, rightLabel, onRight }) {
  const { colors } = useTheme();
  const s = getStyles(colors);

  return (
    <View style={s.sectionHeader}>
      <Text style={s.sectionTitle}>{title}</Text>
      {rightLabel && (
        <TouchableOpacity onPress={onRight} style={s.sectionRight} activeOpacity={0.7}>
          <Text style={s.sectionRightText}>{rightLabel}</Text>
          <ChevronRight size={13} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── Aura Insider card ────────────────────────────────────────────────────────

function InsiderTipCard({ tip, isLoading, onDismiss }) {
  const { colors } = useTheme();
  const ic = getInsiderStyles(colors);

  if (isLoading) {
    return (
      <View style={ic.loadingCard}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={ic.loadingText}>Consulting the locals...</Text>
      </View>
    );
  }

  return (
    <LinearGradient
      colors={['#062523', '#0b3d37', '#0e4d45']}
      style={ic.card}
    >
      {/* 1-px teal line at the very top acts as an inner highlight */}
      <View style={ic.topAccent} />

      {/* Header: label + dismiss */}
      <View style={ic.header}>
        <View style={ic.labelRow}>
          <Text style={ic.sparkle}>✨</Text>
          <Text style={ic.label}>AURA INSIDER</Text>
        </View>
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={0.7}
          hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
        >
          <View style={ic.dismissBtn}>
            <Text style={ic.dismissX}>✕</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Divider */}
      <View style={ic.divider} />

      {/* Tip body */}
      <Text style={ic.tipText}>{tip}</Text>
    </LinearGradient>
  );
}

// ─── Voice modal ──────────────────────────────────────────────────────────────

function VoiceModal({ visible, onUse, onClose }) {
  const [phase, setPhase] = useState('listening');
  const pulse = useRef(new Animated.Value(1)).current;
  const { colors, isDark } = useTheme();
  const sv = getVoiceStyles(colors, isDark);

  useEffect(() => {
    if (!visible) return;
    setPhase('listening');

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.55, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
      ])
    );
    loop.start();

    const timer = setTimeout(() => {
      loop.stop();
      pulse.setValue(1);
      setPhase('found');
    }, 1800);

    return () => { loop.stop(); clearTimeout(timer); };
  }, [visible]);

  const transcript = 'Searching for quiet study spots in your local dialect...';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={sv.backdrop}>
        <View style={sv.sheet}>
          <View style={sv.micWrap}>
            {phase === 'listening' && (
              <Animated.View style={[sv.micRing, { transform: [{ scale: pulse }] }]} />
            )}
            <View style={[sv.micCircle, phase === 'found' && sv.micCircleDone]}>
              <Mic size={26} color={phase === 'found' ? '#000' : colors.primary} strokeWidth={2} />
            </View>
          </View>

          <Text style={sv.statusLabel}>
            {phase === 'listening' ? 'Listening...' : 'Got it!'}
          </Text>

          <View style={sv.transcriptBox}>
            <Text style={sv.transcriptText}>{transcript}</Text>
          </View>

          {phase === 'found' ? (
            <TouchableOpacity style={sv.useBtn} onPress={onUse} activeOpacity={0.85}>
              <Text style={sv.useBtnText}>Use this</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={sv.cancelBtn} onPress={onClose} activeOpacity={0.7}>
              <Text style={sv.cancelText}>Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Search Results Modal ─────────────────────────────────────────────────────

function SearchResultsModal({ visible, onClose, results, isLoading }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);
  const sm = getSearchModalStyles(colors, isDark);
  const navigation = useNavigation();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={sm.searchModalRoot}>
        {/* Tappable backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          activeOpacity={1}
        />

        {/* Bottom sheet */}
        <View style={sm.searchSheet}>
          {/* Drag handle */}
          <View style={sm.sheetHandle} />

          {/* Header */}
          <View style={sm.sheetHeader}>
            <Text style={sm.sheetTitle}>Search Results</Text>
            <TouchableOpacity
              style={sm.sheetCloseBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          {/* Results list */}
          {isLoading ? (
            <View style={sm.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={sm.loadingText}>Searching...</Text>
            </View>
          ) : results.length === 0 ? (
            <View style={sm.emptyContainer}>
              <Text style={sm.emptyText}>No results found</Text>
            </View>
          ) : (
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={sm.resultsScroll}
            >
              {results.map((item, i) => (
                <NearbyCard
                  key={item.id}
                  item={item}
                  isLast={i === results.length - 1}
                  showDistance={false}
                />
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const { vibe, auraScore } = useUser();
  const { colors, isDark } = useTheme();
  const s = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { coords, cityName, suburb, refreshLocation } = useLocation();

  const lat = coords?.latitude ?? -33.8885;
  const lon = coords?.longitude ?? 151.1873;
  
  // Generate dynamic location name based on user's current position
  // This will automatically update when coords, cityName, or suburb changes
  const locationName = useMemo(() => {
    const name = suburb ? `${suburb}, ${cityName || 'Sydney'}` : (cityName || 'USYD');
    console.log('[ExploreScreen] Location updated:', {
      coords,
      cityName,
      suburb,
      locationName: name
    });
    return name;
  }, [suburb, cityName, coords]);

  // City name only for page header (e.g., "Sydney")
  const displayCityName = useMemo(() => {
    return cityName || 'Sydney';
  }, [cityName]);

  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [isSearchingAI, setIsSearchingAI] = useState(false);
  const [aiTip, setAiTip] = useState(null);
  const [nearestPlaces, setNearestPlaces] = useState([]);
  const [isLoadingPlaces, setIsLoadingPlaces] = useState(false);
  const [recommendedPlaces, setRecommendedPlaces] = useState([]);
  const [isLoadingRecommended, setIsLoadingRecommended] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearchingState] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  // Core RAG search — called from both the keyboard submit and the voice modal.
  const triggerSearch = async (searchQuery) => {
    if (!searchQuery || !searchQuery.trim()) return;
    
    setIsSearchingState(true);
    setSearchResults([]);
    setShowSearchModal(true);
    
    try {
      const results = await discoveryService.searchPlaces(searchQuery);
      setSearchResults(results);
      // 延迟清空搜索框，确保模态框已经渲染
      setTimeout(() => {
        setQuery('');
      }, 300);
    } catch (err) {
      console.error('[ExploreScreen] Search failed:', err);
      setSearchResults([]);
      setTimeout(() => {
        setQuery('');
      }, 300);
    } finally {
      setIsSearchingState(false);
    }
  };

  const handleVoiceUse = () => {
    setVoiceVisible(false);
    const voiceQuery = 'quiet study spots near USYD';
    setQuery(voiceQuery);
    triggerSearch(voiceQuery);
  };

  const handleDismissTip = () => {
    setAiTip(null);
    setQuery('');
  };

  // Monitor location changes
  useEffect(() => {
    console.log('[ExploreScreen] Location state changed:', {
      coords,
      cityName,
      suburb,
      locationName
    });
  }, [coords, cityName, suburb, locationName]);

  // Handle pull-to-refresh to update location and data
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const onRefresh = async () => {
    console.log('[ExploreScreen] Manual refresh triggered');
    setIsRefreshing(true);
    
    try {
      // Priority 1: Fast API calls (no location dependency)
      console.log('[ExploreScreen] Step 1: Fetching recommended places...');
      const recommended = await discoveryService.getRecommendedPlaces();
      setRecommendedPlaces(recommended.slice(0, 3));
      console.log('[ExploreScreen] Recommended places updated');
      
      // Priority 2: Fetch nearest places with current coords
      if (coords) {
        console.log('[ExploreScreen] Step 2: Fetching nearest places...');
        const nearest = await discoveryService.getNearestPlaces(coords);
        setNearestPlaces(nearest.slice(0, 3));
        console.log('[ExploreScreen] Nearest places updated');
      }
      
      // Priority 3: Background location update (non-blocking)
      console.log('[ExploreScreen] Step 3: Updating location in background...');
      refreshLocation().then(() => {
        console.log('[ExploreScreen] Location updated in background');
      }).catch(err => {
        console.warn('[ExploreScreen] Background location update failed:', err.message);
      });
      
      console.log('[ExploreScreen] Refresh completed - APIs done, location updating...');
    } catch (error) {
      console.error('[ExploreScreen] Refresh failed:', error);
    } finally {
      // End refresh state immediately after API calls complete
      setIsRefreshing(false);
      console.log('[ExploreScreen] Refresh indicator hidden');
    }
  };

  // Fetch nearest places when location changes
  useEffect(() => {
    const fetchNearestPlaces = async () => {
      if (!coords) return;
      
      setIsLoadingPlaces(true);
      try {
        const places = await discoveryService.getNearestPlaces(coords);
        // Only take the first 3 places
        setNearestPlaces(places.slice(0, 3));
      } catch (error) {
        console.error('[ExploreScreen] Failed to fetch nearest places:', error);
      } finally {
        setIsLoadingPlaces(false);
      }
    };

    fetchNearestPlaces();
  }, [coords]);

  // Fetch recommended places on mount
  useEffect(() => {
    const fetchRecommendedPlaces = async () => {
      setIsLoadingRecommended(true);
      try {
        const places = await discoveryService.getRecommendedPlaces();
        // Only take the first 3 places
        setRecommendedPlaces(places.slice(0, 3));
      } catch (error) {
        console.error('[ExploreScreen] Failed to fetch recommended places:', error);
      } finally {
        setIsLoadingRecommended(false);
      }
    };

    fetchRecommendedPlaces();
  }, []);

  return (
    <SafeAreaView style={s.screen} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scroll}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
      >

        {/* ── Page header ──────────────────────────────────────────────────── */}
        <View style={s.pageHeader}>
          <Text style={s.pageMeta}>DISCOVER</Text>
          <Text style={s.pageTitle}>Explore {displayCityName} 🗺️</Text>
        </View>

        {/* ── Search bar ───────────────────────────────────────────────────── */}
        <View style={s.searchRow}>
          <View style={s.searchBar}>
            <Search size={17} color={colors.primary} strokeWidth={2.2} />
            <TextInput
              style={s.searchInput}
              placeholder="Search places"
              placeholderTextColor={colors.textMuted}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              onSubmitEditing={() => triggerSearch(query)}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => triggerSearch(query)}
                activeOpacity={0.75}
                style={s.searchSubmitBtn}
              >
                <Text style={s.searchSubmitText}>Search</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>



        {/* ── Aura Insider tip ─────────────────────────────────────────────── */}
        {(isSearchingAI || aiTip) && (
          <InsiderTipCard
            tip={aiTip}
            isLoading={isSearchingAI}
            onDismiss={handleDismissTip}
          />
        )}

        {/* ── Map preview card ─────────────────────────────────────────────── */}
        <MapPreviewCard />

        {/* ── Trending Now ─────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title="🔥 Trending Now" />
          {isLoadingRecommended ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.trendingScroll}
            >
              {[1, 2, 3].map((i) => (
                <View key={i} style={[s.trendingShell, { backgroundColor: colors.surface, width: 168, height: 168, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }]}>
                  <ActivityIndicator size="small" color={colors.primary} />
                </View>
              ))}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={s.trendingScroll}
            >
              {recommendedPlaces.map(t => <TrendingCard key={t.id} item={t} />)}
            </ScrollView>
          )}
        </View>

        {/* ── Near Current Location ────────────────────────────────────────────────────── */}
        <View style={s.section}>
          <SectionHeader title={`📍 Near ${locationName}`} />
          {isLoadingPlaces ? (
            <View style={[s.nearbyList, { alignItems: 'center', paddingVertical: 20 }]}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : (
            <View style={s.nearbyList}>
              {nearestPlaces.map((item, i) => (
                <NearbyCard
                  key={item.id}
                  item={item}
                  isLast={i === nearestPlaces.length - 1}
                />
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 24 }} />
      </ScrollView>

      <VoiceModal
        visible={voiceVisible}
        onUse={handleVoiceUse}
        onClose={() => setVoiceVisible(false)}
      />

      <SearchResultsModal
        visible={showSearchModal}
        onClose={() => setShowSearchModal(false)}
        results={searchResults}
        isLoading={isSearching}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors = {}, isDark = false) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scroll: { paddingBottom: 8 },

  // ── Page header
  pageHeader: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 3,
  },
  pageMeta: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1.4,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.4,
  },

  // ── Search bar
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surface,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    fontWeight: '500',
    padding: 0,
  },
  searchSubmitBtn: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
  },
  searchSubmitText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#000',
  },
  micBtn: { padding: 4 },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },

  // ── Filter pills
  filtersContainer: { marginBottom: 20 },
  filtersScroll: { paddingHorizontal: 16, gap: 8 },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterEmoji: { fontSize: 13 },
  filterLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  filterLabelActive: {
    color: '#000000',
    fontWeight: '700',
  },

  // ── Map card
  mapCard: {
    marginHorizontal: 16,
    height: 190,
    borderRadius: 26,
    overflow: 'hidden',
    marginBottom: 28,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(45,212,191,0.2)' : 'rgba(45,212,191,0.1)',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  mapPark: {
    position: 'absolute',
    backgroundColor: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.18)',
    borderRadius: 8,
  },
  mapWater: {
    position: 'absolute',
    bottom: 0, right: 0,
    width: '28%', height: '42%',
    backgroundColor: isDark ? 'rgba(14,165,233,0.15)' : 'rgba(14,165,233,0.22)',
    borderTopLeftRadius: 40,
  },
  road: { position: 'absolute', backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.7)' },
  roadH: { left: 0, right: 0, height: 2.5 },
  roadV: { top: 0, bottom: 0, width: 2.5 },
  block: {
    position: 'absolute',
    backgroundColor: isDark ? 'rgba(130,165,158,0.2)' : 'rgba(130,165,158,0.38)',
    borderRadius: 5,
  },
  mapDotRing: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: isDark ? 'rgba(45,212,191,0.15)' : 'rgba(45,212,191,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapDotCore: {
    width: 9,
    height: 9,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#fff',
  },
  mapDotTeal: { backgroundColor: colors.primary },
  mapDotAmber: { backgroundColor: '#F59E0B' },
  usydPin: {
    position: 'absolute',
    top: '44%',
    left: '37%',
    alignItems: 'center',
  },
  usydTag: {
    backgroundColor: '#EF4444',
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    marginTop: 1,
  },
  usydTagText: { fontSize: 8, color: '#fff', fontWeight: '800' },
  mapBarGrad: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: 58,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  mapBarLeft: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  mapBarText: { fontSize: 12, color: '#fff', fontWeight: '600' },
  fullMapBtn: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  fullMapBtnText: { fontSize: 11, color: '#000', fontWeight: '800' },
  miniMapUserContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(45,212,191,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapUserPin: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: '#fff',
  },

  // ── Section wrapper
  section: { marginBottom: 26 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontWeight: '800', color: colors.text },
  sectionRight: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionRightText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

  // ── Trending cards
  trendingScroll: { paddingHorizontal: 16, gap: 12 },
  trendingShell: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  trendingCard: { width: 168, height: 168 },
  trendingImg: { borderRadius: 24 },
  trendingGrad: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
    borderRadius: 24,
  },
  trendingBadge: {
    alignSelf: 'flex-start',
    borderRadius: 7,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  trendingBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 0.5,
  },
  trendingBottom: { gap: 4 },
  trendingTitle: { fontSize: 14, fontWeight: '800', color: '#fff' },
  trendingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trendingRating: { fontSize: 11, color: '#D1D5DB', fontWeight: '600' },
  trendingDot: { color: '#6B7280', fontSize: 11 },
  trendingDist: { fontSize: 11, color: '#D1D5DB', fontWeight: '500' },

  // ── Nearby list
  nearbyList: {
    marginHorizontal: 16,
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
    backgroundColor: colors.surfaceLight,
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
  nearbyCategory: {
    fontSize: 12,
    color: colors.textSecondary,
    fontWeight: '500',
  },
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

const getInsiderStyles = (colors = {}) => StyleSheet.create({
  loadingCard: {
    marginHorizontal: 16,
    marginBottom: 20,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  loadingText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 24,
    borderRadius: 20,
    padding: 16,
    elevation: 8,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  topAccent: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(45,212,191,0.4)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sparkle: { fontSize: 14 },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: 'rgba(45,212,191,0.9)',
    letterSpacing: 1.2,
  },
  dismissBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(0,0,0,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dismissX: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    lineHeight: 22,
    fontWeight: '500',
  },
});

const getVoiceStyles = (colors = {}, isDark = false) => StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  sheet: {
    backgroundColor: colors.surface,
    borderRadius: 30,
    padding: 30,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    gap: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  micWrap: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micRing: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(45,212,191,0.2)',
  },
  micCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: colors.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  micCircleDone: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  statusLabel: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  transcriptBox: {
    backgroundColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    borderRadius: 16,
    padding: 16,
    width: '100%',
  },
  transcriptText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  useBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 20,
    width: '100%',
    alignItems: 'center',
  },
  useBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#000',
  },
  cancelBtn: {
    paddingVertical: 10,
  },
  cancelText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '600',
  },
});

// ─── Search Results Modal Styles ──────────────────────────────────────────────

const getSearchModalStyles = (colors = {}, isDark = false) => StyleSheet.create({
  searchModalRoot: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  searchSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: height * 0.6,
    paddingBottom: 20,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginVertical: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  sheetCloseBtn: {
    padding: 4,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: '500',
  },
  resultsScroll: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
});
