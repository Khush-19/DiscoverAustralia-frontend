import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Moon,
  Activity,
  Brain,
  Zap,
  X,
  ChevronRight,
  TrendingUp,
  MapPin,
} from 'lucide-react-native';
import { useUser } from '../context/UserContext';
import { colors } from '../constants/theme';

const { height } = Dimensions.get('window');

// Thresholds used for colouring the stat bars and triggering the alert
const SLEEP_THRESHOLD = 7;    // hours
const STEPS_THRESHOLD = 7000; // daily steps goal

// ─── Stat bar (used inside the modal) ────────────────────────────────────────
//   Shows a label, a current/max value, and a coloured progress bar.

function StatBar({ Icon, label, value, maxValue, unit, threshold }) {
  const pct   = Math.min(value / maxValue, 1);
  const isLow = value < threshold;
  const fill  = isLow ? '#F59E0B' : colors.primary;

  return (
    <View style={s.statBar}>
      {/* Label row */}
      <View style={s.statBarHeader}>
        <View style={s.statBarLeft}>
          <Icon size={14} color={fill} strokeWidth={2} />
          <Text style={s.statBarLabel}>{label}</Text>
          {isLow && (
            <View style={s.statLowPill}>
              <Text style={s.statLowText}>Low</Text>
            </View>
          )}
        </View>
        <Text style={s.statBarValue}>
          <Text style={[s.statBarNum, { color: fill }]}>{value}</Text>
          <Text style={s.statBarDenom}>
            {' '}/ {maxValue}
            {unit}
          </Text>
        </Text>
      </View>

      {/* Progress track */}
      <View style={s.statTrack}>
        {/* Glow behind the fill on iOS */}
        <View
          style={[
            s.statGlow,
            { width: `${pct * 100}%`, shadowColor: fill },
          ]}
        />
        <View style={[s.statFill, { width: `${pct * 100}%`, backgroundColor: fill }]} />
      </View>
    </View>
  );
}

// ─── Reasoning modal (bottom sheet) ──────────────────────────────────────────

function ReasoningModal({ visible, onClose, onFindSpots, wearableStats }) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={s.modalRoot}>
        {/* Tappable backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={StyleSheet.absoluteFill} />
        </TouchableWithoutFeedback>

        {/* Bottom sheet */}
        <View style={s.sheet}>
          {/* Drag handle */}
          <View style={s.sheetHandle} />

          {/* Header */}
          <View style={s.sheetHeader}>
            <View style={s.sheetTitleRow}>
              <Brain size={18} color={colors.primary} strokeWidth={2} />
              <Text style={s.sheetTitle}>Why this recommendation?</Text>
            </View>
            <TouchableOpacity
              style={s.sheetCloseBtn}
              onPress={onClose}
              activeOpacity={0.7}
            >
              <X size={16} color={colors.textMuted} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={s.sheetScroll}
          >
            {/* ── Wearable stats ─────────────────────────────────────────── */}
            <Text style={s.sheetMeta}>YOUR STATS TODAY</Text>
            <View style={s.statsBlock}>
              <StatBar
                Icon={Moon}
                label="Sleep"
                value={wearableStats.sleepHours}
                maxValue={8}
                unit="h"
                threshold={SLEEP_THRESHOLD}
              />
              <StatBar
                Icon={Activity}
                label="Steps"
                value={wearableStats.steps}
                maxValue={10000}
                unit=""
                threshold={STEPS_THRESHOLD}
              />
            </View>

            {/* ── AI reasoning ───────────────────────────────────────────── */}
            <Text style={[s.sheetMeta, { marginTop: 22 }]}>
              AURA ENGINE REASONING
            </Text>
            <View style={s.reasonBlock}>
              <View style={s.reasonRow}>
                <View style={s.reasonDot} />
                <Text style={s.reasonText}>
                  Your sleep ({wearableStats.sleepHours} hrs) falls below the{' '}
                  <Text style={s.reasonHighlight}>{SLEEP_THRESHOLD} hr threshold</Text>.
                  Research links low sleep to reduced cognitive performance and
                  elevated cortisol levels.
                </Text>
              </View>
              <View style={s.reasonRow}>
                <View style={s.reasonDot} />
                <Text style={s.reasonText}>
                  Your step count ({wearableStats.steps.toLocaleString()}) suggests
                  low physical output today. The engine weights low-intensity
                  activities higher to prevent burnout.
                </Text>
              </View>
              <View style={s.reasonRow}>
                <View style={[s.reasonDot, { backgroundColor: colors.primary }]} />
                <Text style={s.reasonText}>
                  <Text style={s.reasonHighlight}>"Study Break"</Text> activities
                  (quiet cafés, short library walks, campus gardens) match your
                  biometric profile — mental restoration without physical overload
                  keeps your Aura Score climbing.
                </Text>
              </View>
            </View>

            {/* ── Recommended vibe card ──────────────────────────────────── */}
            <Text style={[s.sheetMeta, { marginTop: 22 }]}>TOP MATCH</Text>
            <LinearGradient
              colors={['#075985', '#0369A1', '#38BDF8']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={s.recCard}
            >
              <View style={s.recIconWrap}>
                <Text style={s.recEmoji}>📚</Text>
              </View>
              <View style={s.recInfo}>
                <Text style={s.recTitle}>Study Break</Text>
                <Text style={s.recSub}>+10–25 Aura pts · Low energy</Text>
              </View>
              <View style={s.recBadge}>
                <TrendingUp size={11} color="#fff" strokeWidth={2.5} />
                <Text style={s.recBadgeText}>Best fit</Text>
              </View>
            </LinearGradient>

            <View style={{ height: 8 }} />
          </ScrollView>

          {/* CTA */}
          <TouchableOpacity
            style={s.gotItBtn}
            onPress={onFindSpots}
            activeOpacity={0.85}
          >
            <MapPin size={15} color="#000" strokeWidth={2.5} />
            <Text style={s.gotItText}>Find Nearby Spots</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.dismissBtn}
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text style={s.dismissText}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── InsightCard (public export) ──────────────────────────────────────────────
//   Renders nothing when sleepHours >= SLEEP_THRESHOLD.

export default function InsightCard() {
  const [modalVisible, setModalVisible] = useState(false);
  const { wearableStats } = useUser();
  const navigation = useNavigation();

  if (!wearableStats || wearableStats.sleepHours >= SLEEP_THRESHOLD) return null;

  return (
    <>
      {/* ── Card shell with teal glow ──────────────────────────────────────── */}
      <View style={s.cardShell}>
        <LinearGradient
          colors={[
            'rgba(45,212,191,0.11)',
            'rgba(14,165,233,0.07)',
            'rgba(17,20,24,0.0)',
          ]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={s.cardGrad}
        >
          {/* ── Header row: badge + sleep pill ─────────────────────────────── */}
          <View style={s.cardHeader}>
            <View style={s.alertBadge}>
              <Moon size={12} color={colors.primary} strokeWidth={2} />
              <Text style={s.alertBadgeText}>Aura Alert</Text>
            </View>
            <View style={s.sleepPill}>
              <Text style={s.sleepPillText}>
                {wearableStats.sleepHours}h sleep
              </Text>
            </View>
          </View>

          {/* ── Body copy ──────────────────────────────────────────────────── */}
          <Text style={s.cardBody}>
            Your sleep is low. We recommend the{' '}
            <Text style={s.cardBodyVibe}>"Study Break"</Text> vibe today to keep
            your Aura Score climbing.
          </Text>

          {/* ── CTA ────────────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={s.viewReasoningBtn}
            onPress={() => setModalVisible(true)}
            activeOpacity={0.85}
          >
            <Zap size={13} color="#000" fill="#000" strokeWidth={0} />
            <Text style={s.viewReasoningText}>View Reasoning</Text>
            <ChevronRight size={13} color="#000" strokeWidth={2.8} />
          </TouchableOpacity>
        </LinearGradient>
      </View>

      {/* ── Modal ────────────────────────────────────────────────────────────── */}
      <ReasoningModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onFindSpots={() => {
          setModalVisible(false);
          navigation.navigate('LocationDetail');
        }}
        wearableStats={wearableStats}
      />
    </>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({

  // ── InsightCard shell
  cardShell: {
    marginHorizontal: 16,
    marginBottom: 18,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
    // Teal ambient glow
    elevation: 8,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.22,
    shadowRadius: 18,
  },
  cardGrad: { padding: 16 },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(45,212,191,0.14)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(45,212,191,0.3)',
  },
  alertBadgeText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  sleepPill: {
    backgroundColor: 'rgba(245,158,11,0.13)',
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.32)',
  },
  sleepPillText: {
    fontSize: 11,
    color: '#F59E0B',
    fontWeight: '700',
  },
  cardBody: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 21,
    fontWeight: '500',
    marginBottom: 14,
  },
  cardBodyVibe: {
    color: colors.primary,
    fontWeight: '700',
  },
  viewReasoningBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: colors.primary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 9,
    // Teal button glow
    elevation: 5,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
  },
  viewReasoningText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#000',
  },

  // ── Modal
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: height * 0.82,
    // Teal top edge glow
    borderTopWidth: 1,
    borderColor: 'rgba(45,212,191,0.25)',
    elevation: 24,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignSelf: 'center',
    marginBottom: 18,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceLight,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetScroll: { paddingBottom: 4 },
  sheetMeta: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.4,
    marginBottom: 12,
  },

  // ── Stat bars (inside sheet)
  statsBlock: { gap: 14 },
  statBar:    { gap: 8 },
  statBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statBarLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
  },
  statLowPill: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  statLowText: {
    fontSize: 9,
    color: '#F59E0B',
    fontWeight: '800',
  },
  statBarValue: {},
  statBarNum: {
    fontSize: 13,
    fontWeight: '800',
  },
  statBarDenom: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: '500',
  },
  statTrack: {
    height: 7,
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderRadius: 6,
    overflow: 'visible',
    position: 'relative',
  },
  statGlow: {
    position: 'absolute',
    top: -3,
    left: 0,
    height: 13,
    borderRadius: 8,
    opacity: 0.3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
  },
  statFill: {
    position: 'absolute',
    top: 0,
    left: 0,
    height: '100%',
    borderRadius: 6,
  },

  // ── Reasoning block
  reasonBlock: { gap: 12 },
  reasonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  reasonDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#F59E0B',
    marginTop: 6,
    flexShrink: 0,
  },
  reasonText: {
    flex: 1,
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  reasonHighlight: {
    color: colors.primary,
    fontWeight: '700',
  },

  // ── Recommended vibe card
  recCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 14,
    gap: 12,
  },
  recIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
  },
  recEmoji:  { fontSize: 22 },
  recInfo:   { flex: 1 },
  recTitle:  { fontSize: 15, fontWeight: '800', color: '#fff' },
  recSub:    { fontSize: 11, color: 'rgba(255,255,255,0.72)', marginTop: 2 },
  recBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
  },
  recBadgeText: { fontSize: 10, color: '#fff', fontWeight: '700' },

  // ── Got it button
  gotItBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
    backgroundColor: colors.primary,
    borderRadius: 22,
    paddingVertical: 14,
    marginTop: 16,
    elevation: 5,
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
  },
  gotItText: { fontSize: 15, fontWeight: '800', color: '#000' },
  dismissBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  dismissText: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '600',
  },
});
