import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../../hooks/useTheme';

export default function AuthButton({ 
  title, 
  onPress, 
  isLoading, 
  variant = 'primary', 
  style 
}) {
  const { colors } = useTheme();

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[s.secondaryBtn, { borderColor: colors.primary }, style]}
        onPress={onPress}
        activeOpacity={0.75}
      >
        <Text style={[s.secondaryBtnText, { color: colors.primary }]}>{title}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[s.primaryBtn, isLoading && s.primaryBtnDisabled, style]}
      onPress={onPress}
      disabled={isLoading}
      activeOpacity={0.85}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={s.primaryBtnGradient}
      >
        {isLoading
          ? <ActivityIndicator color={colors.buttonText} size="small" />
          : <Text style={[s.primaryBtnText, { color: colors.buttonText }]}>{title}</Text>
        }
      </LinearGradient>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  primaryBtn: { marginTop: 10, borderRadius: 14, overflow: 'hidden' },
  primaryBtnDisabled: { opacity: 0.7 },
  primaryBtnGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
  primaryBtnText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  secondaryBtn: {
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
  },
  secondaryBtnText: { fontSize: 15, fontWeight: '600' },
});
