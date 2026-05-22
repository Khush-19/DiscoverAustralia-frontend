import { useState, useRef, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useUser } from '../hooks/useUser';
import { useTheme } from '../hooks/useTheme';
import {
  X,
  Sparkles,
} from 'lucide-react-native';
import { VIBES } from '../constants/vibes';
import { ReasoningModal } from '../components/InsightCard';
import { requestHealthPermissions, openHealthConnectSettings } from '../services/HealthService';
import { fetchVibeCounts } from '../services/AuraAPI';

// ─── Vibe Card ───────────────────────────────────────────────────────────────

function VibeCard({ item, dynamicCount }) {
  const scale      = useRef(new Animated.Value(1)).current;
  const navigation = useNavigation();
  const { colors } = useTheme();
  const s = getStyles(colors);

  // Use dynamic count if available, otherwise fall back to static spots count
  const displayCount = dynamicCount !== undefined ? dynamicCount : item.spots;

  const onPressIn  = () => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, speed: 40 }).start();
  const onPressOut = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, speed: 40 }).start();

  const onPress = () => {
    navigation.navigate('VibeDetail', { vibe: item });
  };

  return (
    <Animated.View
      style={[
        s.vibeCardShell,
        { transform: [{ scale }] },
      ]}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        onPress={onPress}
        style={s.vibeCardTouch}
      >
        <LinearGradient
          colors={item.colorGradientFull}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={s.vibeCard}
        >
          {/* Left — emoji circle */}
          <View style={s.emojiCircle}>
            <Text style={s.emojiText}>{item.emoji}</Text>
          </View>

          {/* Centre — title + subtitle */}
          <View style={s.vibeTextBlock}>
            <Text style={s.vibeTitle}>{item.label}</Text>
            <Text style={s.vibeSub} numberOfLines={1}>{item.subtitle}</Text>
          </View>

          {/* Right — events badge */}
          <View style={[s.spotsBadge, { backgroundColor: item.spotsAlpha }]}>
            <Text style={s.spotsCount}>{displayCount}</Text>
            <Text style={s.spotsLabel}>Events</Text>
          </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── AI Search Bar ────────────────────────────────────────────────────────────

function AISearchBar() {
  const [query, setQuery] = useState('');
  const { colors, isDark } = useTheme();
  const s = getStyles(colors);

  return (
    <View style={s.searchWrapper}>
      {/* Glass container */}
      <View style={s.searchBar}>
        <TextInput
          style={s.searchInput}
          placeholder="Find somewhere quiet to study near USYD..."
          placeholderTextColor={colors.textMuted}
          value={query}
          onChangeText={setQuery}
          returnKeyType="send"
          multiline={false}
        />
        {/* Teal submit button */}
        <TouchableOpacity
          style={[s.searchSubmitBtn, query.length > 0 && s.searchSubmitBtnActive]}
          activeOpacity={0.8}
        >
          <Sparkles
            size={16}
            color={query.length > 0 ? '#000' : colors.primary}
            strokeWidth={2.2}
          />
        </TouchableOpacity>
      </View>

      {/* Attribution */}
      <Text style={s.searchAttribution}>
        Powered by Aura AI · 7 international students nearby
      </Text>
    </View>
  );
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function VibeScreen() {
  const [modalVisible, setModalVisible] = useState(false);
  const [vibeCounts, setVibeCounts] = useState({});
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();
  const { wearableStats } = useUser();
  const { colors, isDark } = useTheme();
  const s = useMemo(() => getStyles(colors), [colors]);

  // Fetch vibe counts when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      
      const fetchCounts = async () => {
        if (!isActive) return;
        
        setLoading(true);
        try {
          const counts = await fetchVibeCounts();
          if (isActive) {
            setVibeCounts(counts);
          }
        } catch (error) {
          console.error('Failed to fetch vibe counts:', error);
          // Don't show alert for now, just log the error
        } finally {
          if (isActive) {
            setLoading(false);
          }
        }
      };

      fetchCounts();

      return () => {
        isActive = false;
      };
    }, [])
  );

  // Handle Health Connect permission request
  const handleHealthConnectRequest = async () => {
    console.log('=== VibeScreen: Requesting Health Connect permissions ===');
    
    try {
      const granted = await requestHealthPermissions();
      
      if (granted) {
        console.log('Health Connect permissions granted!');
        Alert.alert(
          '✅ 权限已授予',
          'Health Connect 步数权限已成功获取！',
          [{ text: '好的' }]
        );
      } else {
        console.log('Health Connect permissions not granted');
        Alert.alert(
          '⚠️ 需要权限',
          '无法自动打开权限对话框。请手动在 Health Connect 应用中授权。\n\n是否打开 Health Connect 设置页面？',
          [
            {
              text: '取消',
              style: 'cancel',
            },
            {
              text: '打开设置',
              onPress: async () => {
                await openHealthConnectSettings();
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Failed to request Health Connect permissions:', error);
      Alert.alert(
        '❌ 错误',
        '请求 Health Connect 权限时出错：' + error.message,
        [{ text: '好的' }]
      );
    }
  };

  return (
    <SafeAreaView style={s.screen} edges={['top']}>

      {/* ── Fixed header ─────────────────────────────────────────────────── */}
      <View style={s.header}>
        {/* Close / X */}
        <TouchableOpacity
          style={s.closeBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.75}
        >
          <X size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>

        {/* Title block */}
        <View style={s.headerTitles}>
          <Text style={s.headerTitle}>Find Your Vibe ✨</Text>
          <Text style={s.headerSub}>What's calling you today?</Text>
        </View>

        {/* AI Recommendation button */}
        <TouchableOpacity
          style={s.recommendBtn}
          activeOpacity={0.7}
          onPress={() => setModalVisible(true)}
        >
          <Sparkles size={18} color={colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* ── Scrollable list + sticky search bar ──────────────────────────── */}
      <KeyboardAvoidingView
        style={s.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={s.flex}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={s.scrollContent}
        >
          {/* ── Vibe cards ──────────────────────────────────────────────── */}
          <View style={s.cardList}>
            {VIBES.map(v => (
              <VibeCard 
                key={v.id} 
                item={v} 
                dynamicCount={vibeCounts[v.label]} 
              />
            ))}
          </View>

          <View style={{ height: 16 }} />
        </ScrollView>

        {/* ── AI Search bar — sticks above keyboard ────────────────────── */}
        <AISearchBar />
      </KeyboardAvoidingView>

      {/* ── AI Reasoning Modal ─────────────────────────────────────────── */}
      <ReasoningModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onFindSpots={() => {
          setModalVisible(false);
          // Navigate to a vibe detail or explore screen
          console.log('Find nearby spots clicked');
        }}
        wearableStats={wearableStats}
      />
    </SafeAreaView>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors = {}) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  flex:   { flex: 1 },

  // ── Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recommendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary + '20',
    borderWidth: 1.5,
    borderColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  headerTitles: { alignItems: 'center', gap: 2 },
  headerTitle:  {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.3,
  },
  headerSub: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '500',
  },

  // ── Card list
  scrollContent: { paddingBottom: 12 },
  cardList: {
    paddingHorizontal: 16,
    gap: 12,
    marginTop: 4,
    marginBottom: 20,
  },

  // ── Vibe card
  vibeCardShell: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  // Teal ring when this vibe is the currently selected one
  vibeCardShellActive: {
    elevation: 12,
    shadowColor: '#2DD4BF',
    shadowOpacity: 0.55,
    shadowRadius: 16,
    borderWidth: 2,
    borderColor: '#2DD4BF',
  },
  vibeCardTouch: { borderRadius: 24 },
  // Checkmark shown instead of spots badge when active
  activeCheckWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeCheckText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '800',
  },
  vibeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 20,
    gap: 14,
  },
  emojiCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  emojiText: { fontSize: 26 },
  vibeTextBlock: { flex: 1, gap: 3 },
  vibeTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  vibeSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.72)',
    fontWeight: '500',
  },
  spotsBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    minWidth: 48,
  },
  spotsCount: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 18,
  },
  spotsLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.75)',
    letterSpacing: 0.3,
  },

  // ── AI Search bar
  searchWrapper: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    gap: 10,
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.border,
    paddingLeft: 18,
    paddingRight: 6,
    paddingVertical: 6,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: colors.text,
    fontWeight: '500',
    paddingVertical: 7,
  },
  searchSubmitBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(45,212,191,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  searchSubmitBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  searchAttribution: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
});
