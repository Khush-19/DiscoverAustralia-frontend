import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Eye, EyeOff } from 'lucide-react-native';
import { useTheme } from '../../hooks/useTheme';

export default function AuthInput({ 
  label, 
  icon: Icon, 
  value, 
  onChangeText, 
  secureTextEntry, 
  showPasswordToggle, 
  onTogglePassword,
  isPasswordVisible,
  ...props 
}) {
  const { colors, isDark } = useTheme();

  return (
    <View style={s.inputGroup}>
      {label && <Text style={[s.label, { color: colors.textSecondary }]}>{label}</Text>}
      <View style={[
        s.inputRow, 
        { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
          borderColor: colors.border 
        }
      ]}>
        {Icon && <Icon size={18} color={colors.textMuted} strokeWidth={1.8} style={s.inputIcon} />}
        <TextInput
          style={[s.input, { color: colors.text }]}
          placeholderTextColor={colors.textMuted}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !isPasswordVisible}
          {...props}
        />
        {showPasswordToggle && (
          <TouchableOpacity
            onPress={onTogglePassword}
            style={s.eyeBtn}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            {isPasswordVisible
              ? <EyeOff size={18} color={colors.textMuted} strokeWidth={1.8} />
              : <Eye size={18} color={colors.textMuted} strokeWidth={1.8} />
            }
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  inputGroup: { marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 15 },
  eyeBtn: { padding: 4 },
});
