import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Bell, BellOff, Check, Sparkles, AlertCircle } from 'lucide-react-native';
import * as SecureStore from 'expo-secure-store';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../hooks/useTheme';
import { useAuth } from '../hooks/useAuth';
import { notificationService } from '../services/notificationService';

const { width } = Dimensions.get('window');
const SECURE_STORE_KEY = 'discover_au_notification_enabled';

export default function NotificationSettingsScreen() {
  const navigation = useNavigation();
  const { colors, isDark } = useTheme();
  const { userToken } = useAuth();

  // State
  const [isEnabled, setIsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [statusMsg, setStatusMsg] = useState({ type: null, text: '' });

  // Animation values
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const cardScaleEnabled = useRef(new Animated.Value(1)).current;
  const cardScaleDisabled = useRef(new Animated.Value(1)).current;

  // Load existing setting on mount
  useEffect(() => {
    async function loadSetting() {
      try {
        const savedVal = await SecureStore.getItemAsync(SECURE_STORE_KEY);
        if (savedVal !== null) {
          setIsEnabled(savedVal === 'true');
        } else {
          setIsEnabled(true); // Default to Enabled
        }
      } catch (err) {
        console.log('[NotificationSettingsScreen] Error loading local setting:', err);
      } finally {
        setLoading(false);
      }
    }
    loadSetting();
  }, []);

  // Show status toast helper
  const showToast = (type, text) => {
    setStatusMsg({ type, text });
    Animated.sequence([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(2500),
      Animated.timing(toastOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setStatusMsg({ type: null, text: '' });
    });
  };

  // Perform card tap/selection change
  const handleSelect = async (newValue) => {
    if (loading || syncing || newValue === isEnabled) return;

    // Visual card click animation
    const activeAnim = newValue ? cardScaleEnabled : cardScaleDisabled;
    Animated.sequence([
      Animated.timing(activeAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(activeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    // Optimistic UI update
    const previousValue = isEnabled;
    setIsEnabled(newValue);
    setSyncing(true);

    try {
      // 1. Update backend setting
      if (userToken) {
        await notificationService.setNotification(userToken, newValue);
      }

      // 2. Persist locally
      await SecureStore.setItemAsync(SECURE_STORE_KEY, newValue ? 'true' : 'false');
      
      showToast('success', `Notifications ${newValue ? 'Enabled' : 'Disabled'}!`);
    } catch (err) {
      console.log('[NotificationSettingsScreen] Error updating setting:', err);
      // Revert optimistic update on failure
      setIsEnabled(previousValue);
      showToast('error', 'Sync failed. Check your internet connection.');
    } finally {
      setSyncing(false);
    }
  };

  const s = getStyles(colors, isDark);

  if (loading) {
    return (
      <SafeAreaView style={s.screen} edges={['top']}>
        <View style={s.loaderWrap}>
          <ActivityIndicator color={colors.primary} size="large" />
          <Text style={s.loaderText}>Loading configuration...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.screen} edges={['top', 'bottom']}>
      
      {/* ── Header Row ─────────────────────────────────────────────────── */}
      <View style={s.headerRow}>
        <TouchableOpacity
          style={s.backBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.8}
        >
          <ArrowLeft size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Notifications</Text>
        {/* Spacer to center the title */}
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── Title & Intro ────────────────────────────────────────────── */}
        <View style={s.introWrap}>
          <Text style={s.title}>Alert & Insights</Text>
          <Text style={s.subtitle}>
            DiscoverAustralia keeps you connected in real time. Choose how you want to receive active squad alerts, message notifications, and lifestyle aura recommendations.
          </Text>
        </View>

        {/* ── Status Toast banner ────────────────────────────────────────── */}
        {statusMsg.type && (
          <Animated.View style={[s.toastContainer, { opacity: toastOpacity }]}>
            <LinearGradient
              colors={
                statusMsg.type === 'success'
                  ? ['rgba(16, 185, 129, 0.15)', 'rgba(4, 120, 87, 0.2)']
                  : ['rgba(239, 68, 68, 0.15)', 'rgba(185, 28, 28, 0.2)']
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                s.toastGradient,
                { borderColor: statusMsg.type === 'success' ? '#10B981' : '#EF4444' }
              ]}
            >
              {statusMsg.type === 'success' ? (
                <Check size={14} color="#10B981" strokeWidth={3} />
              ) : (
                <AlertCircle size={14} color="#EF4444" strokeWidth={2.5} />
              )}
              <Text style={[s.toastText, { color: statusMsg.type === 'success' ? '#A7F3D0' : '#FCA5A5' }]}>
                {statusMsg.text}
              </Text>
            </LinearGradient>
          </Animated.View>
        )}

        {/* ── Option Cards ─────────────────────────────────────────────── */}
        <View style={s.cardsContainer}>
          
          {/* 1. ENABLED CARD */}
          <Animated.View style={{ transform: [{ scale: cardScaleEnabled }] }}>
            <TouchableOpacity
              onPress={() => handleSelect(true)}
              activeOpacity={0.9}
              style={[
                s.optionCard,
                isEnabled && s.activeCardBorder,
              ]}
            >
              <LinearGradient
                colors={
                  isEnabled
                    ? ['rgba(45, 212, 191, 0.12)', 'rgba(13, 148, 136, 0.04)']
                    : [colors.surface, colors.surface]
                }
                style={s.cardGradient}
              >
                <View style={s.cardHeader}>
                  <View style={[s.iconBox, isEnabled && s.activeIconBox]}>
                    <Bell size={20} color={isEnabled ? colors.primary : colors.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={s.cardHeaderMiddle}>
                    <Text style={[s.cardLabel, isEnabled && s.activeCardLabel]}>
                      Enabled
                    </Text>
                    {isEnabled && (
                      <View style={s.recommendBadge}>
                        <Sparkles size={8} color="#0D9488" strokeWidth={2.5} />
                        <Text style={s.recommendText}>RECOMMENDED</Text>
                      </View>
                    )}
                  </View>
                  {/* Select circle indicator */}
                  <View style={[s.circleIndicator, isEnabled && s.activeCircleIndicator]}>
                    {isEnabled && <Check size={12} color="#000" strokeWidth={3} />}
                  </View>
                </View>
                <Text style={s.cardDesc}>
                  Stay fully connected. Get live updates on active squads near you, real-time message notifications, and exclusive aura-intelligence insights.
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* 2. DISABLED CARD */}
          <Animated.View style={{ transform: [{ scale: cardScaleDisabled }] }}>
            <TouchableOpacity
              onPress={() => handleSelect(false)}
              activeOpacity={0.9}
              style={[
                s.optionCard,
                !isEnabled && s.activeCardBorderErr,
              ]}
            >
              <LinearGradient
                colors={
                  !isEnabled
                    ? ['rgba(239, 68, 68, 0.1)', 'rgba(239, 68, 68, 0.03)']
                    : [colors.surface, colors.surface]
                }
                style={s.cardGradient}
              >
                <View style={s.cardHeader}>
                  <View style={[s.iconBox, !isEnabled && s.activeIconBoxErr]}>
                    <BellOff size={20} color={!isEnabled ? '#EF4444' : colors.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={s.cardHeaderMiddle}>
                    <Text style={[s.cardLabel, !isEnabled && s.activeCardLabelErr]}>
                      Disabled
                    </Text>
                  </View>
                  {/* Select circle indicator */}
                  <View style={[s.circleIndicator, !isEnabled && s.activeCircleIndicatorErr]}>
                    {!isEnabled && <Check size={12} color="#000" strokeWidth={3} />}
                  </View>
                </View>
                <Text style={s.cardDesc}>
                  Mute all alerts. You won't receive push notifications for chats, squad sessions or location-matching reminders. You must check everything manually.
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </View>

        {/* ── Footer Proximity Note ────────────────────────────────────── */}
        <View style={s.infoBanner}>
          <Sparkles size={14} color={colors.primary} strokeWidth={2} />
          <Text style={s.infoText}>
            Our matching engine utilizes offline calculations to respect your device battery while providing immediate live proximity matches when you squad up.
          </Text>
        </View>

        {/* ── Loading/Syncing Overlay ───────────────────────────────────── */}
        {syncing && (
          <View style={s.syncingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={s.syncingText}>Updating configuration...</Text>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
}

const getStyles = (colors, isDark) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    loaderWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
    },
    loaderText: {
      fontSize: 14,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingTop: 10,
      paddingBottom: 14,
    },
    backBtn: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
    },
    headerTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text,
      letterSpacing: -0.2,
    },
    scrollContent: {
      paddingBottom: 40,
    },
    introWrap: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 24,
      gap: 10,
    },
    title: {
      fontSize: 28,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.6,
    },
    subtitle: {
      fontSize: 14,
      color: colors.textSecondary,
      lineHeight: 22,
      fontWeight: '500',
    },
    toastContainer: {
      marginHorizontal: 20,
      marginBottom: 16,
    },
    toastGradient: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderRadius: 16,
      paddingVertical: 12,
      paddingHorizontal: 16,
      borderWidth: 1,
    },
    toastText: {
      fontSize: 13,
      fontWeight: '600',
    },
    cardsContainer: {
      paddingHorizontal: 20,
      gap: 16,
    },
    optionCard: {
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.surface,
      borderWidth: 1.5,
      borderColor: colors.border,
      elevation: 3,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    cardGradient: {
      padding: 20,
      gap: 12,
    },
    activeCardBorder: {
      borderColor: 'rgba(45, 212, 191, 0.45)',
      elevation: 6,
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    activeCardBorderErr: {
      borderColor: 'rgba(239, 68, 68, 0.35)',
      elevation: 6,
      shadowColor: '#EF4444',
      shadowOpacity: 0.12,
      shadowRadius: 12,
    },
    cardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    iconBox: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: colors.surfaceLight,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: colors.border,
    },
    activeIconBox: {
      backgroundColor: 'rgba(45, 212, 191, 0.15)',
      borderColor: 'rgba(45, 212, 191, 0.35)',
    },
    activeIconBoxErr: {
      backgroundColor: 'rgba(239, 68, 68, 0.15)',
      borderColor: 'rgba(239, 68, 68, 0.3)',
    },
    cardHeaderMiddle: {
      flex: 1,
      gap: 4,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    activeCardLabel: {
      color: colors.text,
    },
    activeCardLabelErr: {
      color: '#EF4444',
    },
    recommendBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: '#CCFBF1',
      borderRadius: 6,
      paddingHorizontal: 6,
      paddingVertical: 2,
      alignSelf: 'flex-start',
    },
    recommendText: {
      fontSize: 8,
      fontWeight: '800',
      color: '#0D9488',
      letterSpacing: 0.5,
    },
    circleIndicator: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 2,
      borderColor: colors.textMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activeCircleIndicator: {
      borderColor: colors.primary,
      backgroundColor: colors.primary,
    },
    activeCircleIndicatorErr: {
      borderColor: '#EF4444',
      backgroundColor: '#EF4444',
    },
    cardDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      fontWeight: '500',
    },
    infoBanner: {
      flexDirection: 'row',
      marginHorizontal: 20,
      marginTop: 28,
      backgroundColor: colors.surfaceLight,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
      gap: 12,
    },
    infoText: {
      flex: 1,
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      fontWeight: '500',
    },
    syncingContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      marginTop: 24,
    },
    syncingText: {
      fontSize: 12,
      color: colors.textMuted,
      fontWeight: '600',
    },
  });
