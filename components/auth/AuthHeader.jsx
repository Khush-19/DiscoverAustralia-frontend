import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MapPin } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';

export default function AuthHeader({ title, subtitle }) {
  const { colors, isDark } = useTheme();

  return (
    <View style={s.logoArea}>
      <View style={[
        s.logoIconWrap,
        {
          backgroundColor: isDark ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.1)',
          borderColor: 'rgba(45,212,191,0.3)',
        }
      ]}>
        <MapPin size={30} color={colors.primary} strokeWidth={2.5} />
      </View>
      <Text style={[s.appName, { color: colors.text }]}>Discover Australia</Text>
      <Text style={[s.tagline, { color: colors.textMuted }]}>Your community. Your adventure.</Text>
      
      {title && <Text style={[s.heading, { color: colors.text }]}>{title}</Text>}
      {subtitle && <Text style={[s.subheading, { color: colors.textMuted }]}>{subtitle}</Text>}
    </View>
  );
}

const s = StyleSheet.create({
  logoArea: { alignItems: 'center', marginBottom: 24 },
  logoIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  appName: {
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  heading: { fontSize: 22, fontWeight: '700', marginBottom: 4, textAlign: 'center' },
  subheading: { fontSize: 14, marginBottom: 8, textAlign: 'center' },
});
