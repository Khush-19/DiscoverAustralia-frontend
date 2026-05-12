import { useState, useRef, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { AlertTriangle, X, TrendingDown, Brain } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';
import { detectNegativeTrend, ACTIVITY_DROP_PCT } from '../services/TrendAnalysis';

export default function TrendAlert() {
  const [dismissed, setDismissed] = useState(false);
  const { colors, isDark } = useTheme();
  const s = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const pulse = useRef(new Animated.Value(0.55)).current;

  const hasTrend = detectNegativeTrend();

  useEffect(() => {
    if (!hasTrend) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1,    duration: 950, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.55, duration: 950, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [hasTrend]);

  if (!hasTrend || dismissed) return null;

  return (
    <View style={s.shell}>
      {/* Soft pulsing glow ring behind the card */}
      <Animated.View style={[s.glowRing, { opacity: pulse }]} />

      <LinearGradient
        colors={isDark ? [
          'rgba(239,68,68,0.11)',
          'rgba(245,158,11,0.07)',
          'rgba(17,20,24,0.0)',
        ] : [
          'rgba(239,68,68,0.08)',
          'rgba(245,158,11,0.05)',
          'rgba(255,255,255,0)',
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.grad}
      >
        {/* ── Header: badge + dismiss ─────────────────────────────────────── */}
        <View style={s.header}>
          <View style={s.warningBadge}>
            <AlertTriangle size={11} color="#EF4444" strokeWidth={2.5} />
            <Text style={s.warningBadgeText}>Early Warning</Text>
          </View>
          <TouchableOpacity
            onPress={() => setDismissed(true)}
            style={s.closeBtn}
            activeOpacity={0.7}
            hitSlop={{ top: 10, right: 10, bottom: 10, left: 10 }}
          >
            <X size={14} color={colors.textMuted} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>

        {/* ── Body ────────────────────────────────────────────────────────── */}
        <Text style={s.body}>
          Your wellness trend is{' '}
          <Text style={s.bodyRed}>declining.</Text>{' '}
          Your activity has dropped{' '}
          <Text style={s.bodyRed}>{ACTIVITY_DROP_PCT}% this week.</Text>{' '}
          We've adjusted your suggested Vibe to{' '}
          <Text style={s.bodyAmber}>"Rest & Recover"</Text>.
        </Text>

        {/* ── Stat pills ──────────────────────────────────────────────────── */}
        <View style={s.pillRow}>
          <View style={s.pillRed}>
            <TrendingDown size={10} color="#EF4444" strokeWidth={2.5} />
            <Text style={s.pillRedText}>3-day drop</Text>
          </View>
          <View style={s.pillAmber}>
            <Brain size={10} color="#F59E0B" strokeWidth={2} />
            <Text style={s.pillAmberText}>Aura at risk</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const getStyles = (colors = {}, isDark = false) => StyleSheet.create({
  shell: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(239,68,68,0.28)' : 'rgba(239,68,68,0.15)',
    // Red ambient glow
    elevation: 8,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 18,
    position: 'relative',
  },

  // Pulsing fill that sits behind the gradient
  glowRing: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)',
    borderRadius: 24,
  },

  grad: { padding: 16 },

  // Header row
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239,68,68,0.14)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  warningBadgeText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },

  // Body
  body: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 14,
  },
  bodyRed:   { color: '#EF4444', fontWeight: '700' },
  bodyAmber: { color: '#F59E0B', fontWeight: '700' },

  // Pills row
  pillRow: {
    flexDirection: 'row',
    gap: 8,
  },
  pillRed: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
  },
  pillRedText: {
    fontSize: 11,
    color: '#EF4444',
    fontWeight: '700',
  },
  pillAmber: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.25)',
  },
  pillAmberText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
});
