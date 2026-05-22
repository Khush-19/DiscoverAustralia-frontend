import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, MessageCircle, Users } from 'lucide-react-native';
import { useSquad } from '../hooks/useSquad';
import { useTheme } from '../hooks/useTheme';

// ─── Pulsing live dot ─────────────────────────────────────────────────────────

function LiveDot({ color }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 2.2, duration: 900, useNativeDriver: true }),
          Animated.timing(scale, { toValue: 1, duration: 0, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0, duration: 900, useNativeDriver: true }),
          Animated.timing(opacity, { toValue: 0.6, duration: 0, useNativeDriver: true }),
        ]),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  return (
    <View style={styles.dotWrap}>
      <Animated.View style={[styles.dotRing, { backgroundColor: color, transform: [{ scale }], opacity }]} />
      <View style={[styles.dotCore, { backgroundColor: color }]} />
    </View>
  );
}

// ─── Overlapping avatar circles with initials ─────────────────────────────────

function AvatarRow({ avatars, extra, cardBg }) {
  // Ensure avatars is an array
  const avatarList = Array.isArray(avatars) ? avatars : [];
  
  return (
    <View style={styles.avatarRow}>
      {avatarList.slice(0, 3).map((a, i) => (
        <View
          key={i}
          style={[
            styles.avatar,
            {
              backgroundColor: a.color,
              marginLeft: i === 0 ? 0 : -10,
              zIndex: 3 - i,
              borderColor: cardBg,
            },
          ]}
        >
          <Text style={styles.avatarInitials}>{a.initials}</Text>
        </View>
      ))}
      {extra > 0 && (
        <View style={[styles.avatarExtra, { marginLeft: -10, borderColor: cardBg }]}>
          <Text style={styles.avatarExtraText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

// ─── Banner ───────────────────────────────────────────────────────────────────

/**
 * SquadBanner
 *
 * Displays the hottest nearby squad (nearbySquads[0]).
 * States:
 *   no squads   → hidden (returns null)
 *   not joined  → shows Join button (FOMO trigger)
 *   joined      → shows Joined chip + Chat button
 */
export default function SquadBanner() {
  const { nearbySquads, mySquad, joinSquad } = useSquad();
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark);

  // Feature the closest / first squad
  const featured = nearbySquads[0];
  if (!featured) return null;

  const isMySquad = mySquad?.id === featured.id;
  const extra = Math.max(0, featured.memberCount - 3);

  function handleChat() {
    // Navigation stub — wire to SquadChat screen when ready
    console.log('Navigating to Squad Chat:', featured.id, featured.title);
  }

  return (
    <View style={s.banner}>

      {/* ── Left: live indicator + squad info + avatars ──────────────────── */}
      <View style={s.left}>

        {/* Title row */}
        <View style={s.titleRow}>
          <Text style={s.title}>Squad-Up 🏃</Text>
          <View style={s.livePill}>
            <LiveDot color={colors.success} />
            <Text style={s.liveText}>Live</Text>
          </View>
        </View>

        {/* Subtitle — destination + member count */}
        <Text style={s.subtitle} numberOfLines={1}>
          {featured.memberCount} students heading to {featured.spotName || 'this spot'}
        </Text>

        {/* Avatar row + stat pills */}
        <View style={s.metaRow}>
          <AvatarRow
            avatars={featured.memberAvatars}
            extra={extra}
            cardBg={colors.surface}
          />
          <View style={s.statPill}>
            <Text style={s.statPillText}>{featured.memberCount}→</Text>
          </View>
          <View style={[s.statPill, s.statPillBlue]}>
            <Text style={[s.statPillText, s.statPillTextBlue]}>
              {featured.spotName ? featured.spotName.split(' ')[0] : 'Spot'}
            </Text>
          </View>
          {featured.eta ? (
            <View style={[s.statPill, s.statPillAmber]}>
              <Text style={[s.statPillText, s.statPillTextAmber]}>{featured.eta}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* ── Right: action button ─────────────────────────────────────────── */}
      <View style={s.right}>
        {isMySquad ? (
          // ── Joined state: show chip + Chat button
          <View style={s.joinedActions}>
            <View style={s.joinedChip}>
              <Check size={11} color={colors.primary} strokeWidth={2.8} />
              <Text style={s.joinedChipText}>Joined</Text>
            </View>
            <TouchableOpacity
              style={s.chatBtn}
              onPress={handleChat}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[colors.primary, colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.chatBtnGrad}
              >
                <MessageCircle size={13} color="#000" strokeWidth={2.5} />
                <Text style={s.chatBtnText}>Chat</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        ) : (
          // ── Default state: Join button
          <TouchableOpacity
            style={s.joinBtn}
            onPress={() => joinSquad(featured.id)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={[colors.primary, colors.primaryDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.joinBtnGrad}
            >
              <Users size={13} color="#000" strokeWidth={2.5} />
              <Text style={s.joinBtnText}>Join</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Pulsing dot
  dotWrap: { width: 12, height: 12, alignItems: 'center', justifyContent: 'center' },
  dotRing: { position: 'absolute', width: 10, height: 10, borderRadius: 5 },
  dotCore: { width: 7, height: 7, borderRadius: 4 },

  // Avatar row
  avatarRow: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontSize: 9, fontWeight: '800', color: '#fff' },
  avatarExtra: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    backgroundColor: '#374151',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarExtraText: { fontSize: 8, fontWeight: '800', color: '#9CA3AF' },
});

function getStyles(colors, isDark) {
  return StyleSheet.create({
    banner: {
      marginHorizontal: 16,
      backgroundColor: colors.surface,
      borderRadius: 22,
      padding: 16,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 8,
    },

    left: { flex: 1, marginRight: 12 },

    titleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 3,
    },
    title: { fontSize: 15, fontWeight: '800', color: colors.text },
    livePill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.1)',
      borderRadius: 10,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: 'rgba(16,185,129,0.3)',
    },
    liveText: { fontSize: 10, color: colors.success, fontWeight: '700' },

    subtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '500',
      marginBottom: 10,
    },

    metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },

    // Stat pills
    statPill: {
      backgroundColor: isDark ? 'rgba(45,212,191,0.14)' : 'rgba(45,212,191,0.1)',
      borderRadius: 8,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderWidth: 1,
      borderColor: 'rgba(45,212,191,0.25)',
    },
    statPillText: { fontSize: 10, color: colors.primary, fontWeight: '700' },
    statPillBlue: {
      backgroundColor: isDark ? 'rgba(59,130,246,0.14)' : 'rgba(59,130,246,0.08)',
      borderColor: 'rgba(59,130,246,0.25)',
    },
    statPillTextBlue: { color: '#60A5FA' },
    statPillAmber: {
      backgroundColor: isDark ? 'rgba(245,158,11,0.14)' : 'rgba(245,158,11,0.08)',
      borderColor: 'rgba(245,158,11,0.25)',
    },
    statPillTextAmber: { color: '#F59E0B' },

    right: { alignItems: 'flex-end' },

    // Join button
    joinBtn: {
      borderRadius: 18,
      overflow: 'hidden',
      elevation: 5,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    joinBtnGrad: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 18,
      paddingVertical: 11,
    },
    joinBtnText: { color: '#000', fontSize: 13, fontWeight: '800' },

    // Joined state
    joinedActions: { alignItems: 'flex-end', gap: 8 },
    joinedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      backgroundColor: isDark ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.08)',
      borderRadius: 10,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderWidth: 1,
      borderColor: 'rgba(45,212,191,0.3)',
    },
    joinedChipText: { fontSize: 11, color: colors.primary, fontWeight: '700' },

    // Chat button
    chatBtn: {
      borderRadius: 16,
      overflow: 'hidden',
      elevation: 5,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.4,
      shadowRadius: 8,
    },
    chatBtnGrad: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 16,
      paddingVertical: 10,
    },
    chatBtnText: { color: '#000', fontSize: 12, fontWeight: '800' },
  });
}
