import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { ArrowLeft, Check, Sun, Moon, Smartphone } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../hooks/useTheme';

export default function ThemeSettingsScreen() {
  const navigation = useNavigation();
  const { colors, isDark, themeMode, setThemeMode } = useTheme();

  // State
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  // Animation values
  const cardScaleLight = useRef(new Animated.Value(1)).current;
  const cardScaleDark = useRef(new Animated.Value(1)).current;
  const cardScaleSystem = useRef(new Animated.Value(1)).current;

  // Load existing setting on mount
  useEffect(() => {
    // Simulate a brief loading state for smooth UX
    const timer = setTimeout(() => {
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  // Perform card tap/selection change
  const handleSelect = async (newValue) => {
    if (loading || syncing || newValue === themeMode) return;

    // Visual card click animation
    let activeAnim;
    if (newValue === 'light') activeAnim = cardScaleLight;
    else if (newValue === 'dark') activeAnim = cardScaleDark;
    else activeAnim = cardScaleSystem;

    Animated.sequence([
      Animated.timing(activeAnim, { toValue: 0.96, duration: 100, useNativeDriver: true }),
      Animated.timing(activeAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();

    setSyncing(true);

    try {
      // Update theme mode
      await setThemeMode(newValue);
    } catch (err) {
      console.log('[ThemeSettingsScreen] Error updating theme:', err);
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
          <Text style={s.loaderText}>Loading preferences...</Text>
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
        <Text style={s.headerTitle}>Appearance</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={s.scrollContent}
      >
        {/* ── Title & Intro ────────────────────────────────────────────── */}
        <View style={s.introWrap}>
          <Text style={s.title}>Choose Your Style</Text>
          <Text style={s.subtitle}>
            Customize how DiscoverAustralia looks and feels. Select the theme that matches your vibe and environment.
          </Text>
        </View>

        {/* ── Option Cards ─────────────────────────────────────────────── */}
        <View style={s.cardsContainer}>
          
          {/* 1. LIGHT MODE CARD */}
          <Animated.View style={{ transform: [{ scale: cardScaleLight }] }}>
            <TouchableOpacity
              onPress={() => handleSelect('light')}
              activeOpacity={0.9}
              style={[
                s.optionCard,
                themeMode === 'light' && s.activeCardBorder,
              ]}
            >
              <LinearGradient
                colors={
                  themeMode === 'light'
                    ? ['rgba(45, 212, 191, 0.12)', 'rgba(13, 148, 136, 0.04)']
                    : [colors.surface, colors.surface]
                }
                style={s.cardGradient}
              >
                <View style={s.cardHeader}>
                  <View style={[s.iconBox, themeMode === 'light' && s.activeIconBox]}>
                    <Sun size={20} color={themeMode === 'light' ? colors.primary : colors.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={s.cardHeaderMiddle}>
                    <Text style={[s.cardLabel, themeMode === 'light' && s.activeCardLabel]}>
                      Light Mode
                    </Text>
                  </View>
                  {/* Select circle indicator */}
                  <View style={[s.circleIndicator, themeMode === 'light' && s.activeCircleIndicator]}>
                    {themeMode === 'light' && <Check size={12} color="#000" strokeWidth={3} />}
                  </View>
                </View>
                <Text style={s.cardDesc}>
                  Bright and clean interface. Perfect for daytime use or well-lit environments. Easy on the eyes with crisp contrast.
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* 2. DARK MODE CARD */}
          <Animated.View style={{ transform: [{ scale: cardScaleDark }] }}>
            <TouchableOpacity
              onPress={() => handleSelect('dark')}
              activeOpacity={0.9}
              style={[
                s.optionCard,
                themeMode === 'dark' && s.activeCardBorder,
              ]}
            >
              <LinearGradient
                colors={
                  themeMode === 'dark'
                    ? ['rgba(45, 212, 191, 0.12)', 'rgba(13, 148, 136, 0.04)']
                    : [colors.surface, colors.surface]
                }
                style={s.cardGradient}
              >
                <View style={s.cardHeader}>
                  <View style={[s.iconBox, themeMode === 'dark' && s.activeIconBox]}>
                    <Moon size={20} color={themeMode === 'dark' ? colors.primary : colors.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={s.cardHeaderMiddle}>
                    <Text style={[s.cardLabel, themeMode === 'dark' && s.activeCardLabel]}>
                      Dark Mode
                    </Text>
                  </View>
                  {/* Select circle indicator */}
                  <View style={[s.circleIndicator, themeMode === 'dark' && s.activeCircleIndicator]}>
                    {themeMode === 'dark' && <Check size={12} color="#000" strokeWidth={3} />}
                  </View>
                </View>
                <Text style={s.cardDesc}>
                  Sleek and modern dark interface. Ideal for nighttime browsing or low-light conditions. Reduces eye strain and saves battery.
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* 3. SYSTEM DEFAULT CARD */}
          <Animated.View style={{ transform: [{ scale: cardScaleSystem }] }}>
            <TouchableOpacity
              onPress={() => handleSelect('system')}
              activeOpacity={0.9}
              style={[
                s.optionCard,
                themeMode === 'system' && s.activeCardBorder,
              ]}
            >
              <LinearGradient
                colors={
                  themeMode === 'system'
                    ? ['rgba(45, 212, 191, 0.12)', 'rgba(13, 148, 136, 0.04)']
                    : [colors.surface, colors.surface]
                }
                style={s.cardGradient}
              >
                <View style={s.cardHeader}>
                  <View style={[s.iconBox, themeMode === 'system' && s.activeIconBox]}>
                    <Smartphone size={20} color={themeMode === 'system' ? colors.primary : colors.textSecondary} strokeWidth={2} />
                  </View>
                  <View style={s.cardHeaderMiddle}>
                    <Text style={[s.cardLabel, themeMode === 'system' && s.activeCardLabel]}>
                      System Default
                    </Text>
                  </View>
                  {/* Select circle indicator */}
                  <View style={[s.circleIndicator, themeMode === 'system' && s.activeCircleIndicator]}>
                    {themeMode === 'system' && <Check size={12} color="#000" strokeWidth={3} />}
                  </View>
                </View>
                <Text style={s.cardDesc}>
                  Automatically matches your device's system theme. Seamlessly adapts when you switch between light and dark mode in your phone settings.
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

        </View>

        {/* ── Footer Info Note ─────────────────────────────────────────── */}
        <View style={s.infoBanner}>
          <Text style={s.infoText}>
            Your preference is saved automatically and will persist across app restarts. Changes take effect immediately.
          </Text>
        </View>

        {/* ── Loading/Syncing Overlay ──────────────────────────────────── */}
        {syncing && (
          <View style={s.syncingContainer}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={s.syncingText}>Applying theme...</Text>
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
    cardHeaderMiddle: {
      flex: 1,
    },
    cardLabel: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.textSecondary,
    },
    activeCardLabel: {
      color: colors.text,
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
    cardDesc: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 20,
      fontWeight: '500',
    },
    infoBanner: {
      marginHorizontal: 20,
      marginTop: 28,
      backgroundColor: colors.surfaceLight,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 16,
    },
    infoText: {
      fontSize: 12,
      color: colors.textSecondary,
      lineHeight: 18,
      fontWeight: '500',
      textAlign: 'center',
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
