/**
 * InsiderTip.jsx
 *
 * Renders a single AI-generated insider tip with a distinctive glassmorphism
 * aesthetic that visually separates it from standard app data. The layered
 * semi-transparent background + colored left accent border signals "AI source"
 * without needing a heavy design treatment.
 *
 * Tip types and their visual language:
 *   gem          → teal  — a hidden advantage the user wouldn't find otherwise
 *   local-secret → purple — knowledge only regulars hold
 *   timing       → amber  — time-sensitive information
 *   warning      → red    — something to avoid
 *   answer       → teal  — a direct response from the AI agent
 */

import { View, Text, StyleSheet } from 'react-native';
import { Gem, KeyRound, Clock, AlertTriangle, Sparkles, Brain } from 'lucide-react-native';
import { useTheme } from '../hooks/useTheme';

// ─── Type config ──────────────────────────────────────────────────────────────

const TYPE_CONFIG = {
  'gem': {
    label:       'Hidden Gem',
    Icon:        Gem,
    color:       '#2DD4BF',
    bg:          'rgba(45,212,191,0.07)',
    border:      'rgba(45,212,191,0.35)',
    leftAccent:  '#2DD4BF',
    badgeBg:     'rgba(45,212,191,0.14)',
    badgeBorder: 'rgba(45,212,191,0.3)',
  },
  'local-secret': {
    label:       'Local Secret',
    Icon:        KeyRound,
    color:       '#A78BFA',
    bg:          'rgba(167,139,250,0.07)',
    border:      'rgba(167,139,250,0.3)',
    leftAccent:  '#A78BFA',
    badgeBg:     'rgba(167,139,250,0.14)',
    badgeBorder: 'rgba(167,139,250,0.28)',
  },
  'timing': {
    label:       'Timing Tip',
    Icon:        Clock,
    color:       '#F59E0B',
    bg:          'rgba(245,158,11,0.07)',
    border:      'rgba(245,158,11,0.28)',
    leftAccent:  '#F59E0B',
    badgeBg:     'rgba(245,158,11,0.14)',
    badgeBorder: 'rgba(245,158,11,0.28)',
  },
  'warning': {
    label:       'Heads Up',
    Icon:        AlertTriangle,
    color:       '#EF4444',
    bg:          'rgba(239,68,68,0.06)',
    border:      'rgba(239,68,68,0.25)',
    leftAccent:  '#EF4444',
    badgeBg:     'rgba(239,68,68,0.12)',
    badgeBorder: 'rgba(239,68,68,0.25)',
  },
  'answer': {
    label:       'AURA Response',
    Icon:        Brain,
    color:       '#2DD4BF',
    bg:          'rgba(45,212,191,0.07)',
    border:      'rgba(45,212,191,0.35)',
    leftAccent:  '#2DD4BF',
    badgeBg:     'rgba(45,212,191,0.14)',
    badgeBorder: 'rgba(45,212,191,0.3)',
  },
};

const DEFAULT_TYPE = TYPE_CONFIG['gem'];

// ─── Confidence bar ───────────────────────────────────────────────────────────

function ConfidenceBar({ value, color }) {
  return (
    <View style={barStyles.track}>
      <View style={[barStyles.fill, { width: `${value}%`, backgroundColor: color }]} />
    </View>
  );
}

const barStyles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
    flex: 1,
  },
  fill: { height: '100%', borderRadius: 2 },
});

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Props:
 *   tip  — { id, text, type, confidence }
 *   isAnswer — if true, shows the "AURA Response" header variant
 */
export default function InsiderTip({ tip }) {
  const { colors, isDark } = useTheme();
  const cfg = TYPE_CONFIG[tip.type] ?? DEFAULT_TYPE;
  const { Icon } = cfg;
  const s = getStyles(colors, isDark);

  return (
    <View style={[s.card, { backgroundColor: cfg.bg, borderColor: cfg.border }]}>

      {/* Left accent line — the primary glassmorphism differentiator */}
      <View style={[s.leftAccent, { backgroundColor: cfg.leftAccent }]} />

      <View style={s.inner}>

        {/* ── Header row: type chip + AI badge + confidence ─────────────── */}
        <View style={s.headerRow}>

          {/* Type chip */}
          <View style={[s.typeChip, { backgroundColor: cfg.badgeBg, borderColor: cfg.badgeBorder }]}>
            <Icon size={10} color={cfg.color} strokeWidth={2.2} />
            <Text style={[s.typeLabel, { color: cfg.color }]}>{cfg.label}</Text>
          </View>

          {/* AI-Generated badge — always present to signal source */}
          <View style={s.aiBadge}>
            <Sparkles size={9} color="#A78BFA" strokeWidth={2} />
            <Text style={s.aiBadgeText}>AI · RAG</Text>
          </View>

          {/* Confidence score */}
          {tip.confidence != null && (
            <View style={s.confidenceWrap}>
              <ConfidenceBar value={tip.confidence} color={cfg.color} />
              <Text style={[s.confidenceText, { color: cfg.color }]}>{tip.confidence}%</Text>
            </View>
          )}
        </View>

        {/* ── Tip text ──────────────────────────────────────────────────── */}
        <Text style={s.tipText}>{tip.text}</Text>

      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(colors, isDark) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      borderRadius: 16,
      borderWidth: 1,
      overflow: 'hidden',
      // Glassmorphism shadow
      elevation: 3,
      shadowColor: '#2DD4BF',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.12,
      shadowRadius: 10,
    },

    // 3px colored left accent bar
    leftAccent: {
      width: 3,
      alignSelf: 'stretch',
      borderTopLeftRadius: 16,
      borderBottomLeftRadius: 16,
    },

    inner: {
      flex: 1,
      padding: 14,
      gap: 10,
    },

    // Header row
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      flexWrap: 'wrap',
    },

    // Type chip
    typeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 8,
      borderWidth: 1,
      paddingHorizontal: 8,
      paddingVertical: 3,
    },
    typeLabel: {
      fontSize: 10,
      fontWeight: '800',
      letterSpacing: 0.3,
    },

    // AI badge
    aiBadge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: isDark ? 'rgba(167,139,250,0.12)' : 'rgba(167,139,250,0.08)',
      borderRadius: 7,
      paddingHorizontal: 7,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: 'rgba(167,139,250,0.25)',
    },
    aiBadgeText: {
      fontSize: 9,
      color: '#A78BFA',
      fontWeight: '800',
      letterSpacing: 0.5,
    },

    // Confidence
    confidenceWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      flex: 1,
      justifyContent: 'flex-end',
    },
    confidenceText: {
      fontSize: 10,
      fontWeight: '800',
    },

    // Tip text
    tipText: {
      fontSize: 13.5,
      color: colors.textSecondary,
      lineHeight: 21,
      fontWeight: '500',
    },
  });
}
