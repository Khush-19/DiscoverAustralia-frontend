import { ScrollView, TouchableOpacity, Text, View, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../hooks/useTheme';

// ─── Single tile ──────────────────────────────────────────────────────────────

function VibeTile({ vibe, isSelected, onPress, squareMode, hideSubtitle }) {
  const { colors, isDark } = useTheme();
  const s = getStyles(colors, isDark, squareMode);

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.82}
      style={[s.tileShell, isSelected && s.tileShellSelected]}
    >
      <LinearGradient
        colors={vibe.colorGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.tile}
      >
        {/* Selection check-ring top-right */}
        {isSelected && (
          <View style={[s.selectedRing, { borderColor: vibe.accentColor ?? '#fff' }]}>
            <View style={[s.selectedDot, { backgroundColor: vibe.accentColor ?? '#fff' }]} />
          </View>
        )}

        <Text style={s.emoji}>{vibe.emoji}</Text>
        <Text style={s.label} numberOfLines={2}>{vibe.label}</Text>
        {!hideSubtitle && <Text style={s.subtitle} numberOfLines={1}>{vibe.subtitle}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── Picker ───────────────────────────────────────────────────────────────────

/**
 * Controlled horizontal vibe selector.
 *
 * Props:
 *   vibes         — array from constants/vibes.js
 *   selectedId    — id of the currently selected vibe (or null/undefined)
 *   onSelect      — called with the full vibe object when a tile is tapped
 *   squareMode    — if true, tiles are square (default: false)
 *   hideSubtitle  — if true, subtitle text is hidden (default: false)
 */
export default function VibePicker({ vibes, selectedId, onSelect, squareMode = false, hideSubtitle = false }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
    >
      {vibes.map(vibe => (
        <VibeTile
          key={vibe.id}
          vibe={vibe}
          isSelected={selectedId === vibe.id}
          onPress={() => onSelect(vibe)}
          squareMode={squareMode}
          hideSubtitle={hideSubtitle}
        />
      ))}
    </ScrollView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 16, gap: 10 },
});

function getStyles(colors, isDark, squareMode) {
  return StyleSheet.create({
    tileShell: {
      borderRadius: 20,
      overflow: 'hidden',
      // Subtle lift shadow on all tiles
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.22,
      shadowRadius: 8,
    },
    // Selected state: white outer ring
    tileShellSelected: {
      elevation: 10,
      shadowOpacity: 0.4,
      shadowRadius: 14,
      // Border lives on the shell so it sits outside the gradient
      borderWidth: 2,
      borderColor: '#fff',
    },
    tile: squareMode
      ? {
          width: 120,
          height: 120,
          padding: 10,
          justifyContent: 'center',
          alignItems: 'center',
        }
      : {
          width: 132,
          height: 120,
          padding: 13,
          justifyContent: 'flex-end',
        },

    // Selection indicator (top-right ring)
    selectedRing: {
      position: 'absolute',
      top: 10,
      right: 10,
      width: 18,
      height: 18,
      borderRadius: 9,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0,0,0,0.25)',
    },
    selectedDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },

    emoji:    { fontSize: 24, marginBottom: 4 },
    label: {
      fontSize: squareMode ? 12 : 13,
      fontWeight: '800',
      color: '#fff',
      lineHeight: squareMode ? 15 : 17,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: 10,
      color: 'rgba(255,255,255,0.68)',
      fontWeight: '500',
      marginTop: 2,
    },
  });
}
