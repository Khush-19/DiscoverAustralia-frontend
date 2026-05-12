import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Mail, Lock, User } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import useFadeIn from '../../hooks/useFadeIn';

// Auth Components
import AuthWrapper from '../../components/auth/AuthWrapper';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(displayName, email, password, confirmPassword) {
  if (!displayName.trim()) return 'Display name is required.';
  if (displayName.trim().length < 2) return 'Display name must be at least 2 characters.';
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  if (password !== confirmPassword) return 'Passwords do not match.';
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function RegisterScreen({ navigation }) {
  const { signUp } = useAuth();
  const { setUserName } = useUser();
  const { colors, isDark } = useTheme();
  const fadeStyle = useFadeIn(300);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const confirmPasswordRef = useRef(null);

  const s = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  async function handleRegister() {
    const validationError = validate(displayName, email.trim(), password, confirmPassword);
    if (validationError) { setError(validationError); return; }

    setError('');
    setIsLoading(true);
    try {
      const user = await signUp(email.trim().toLowerCase(), password, displayName.trim());
      // Sync displayName into UserContext so screens personalise immediately
      setUserName(user.displayName);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  function clearError() { setError(''); }

  return (
    <AuthWrapper fadeStyle={fadeStyle}>
      <AuthHeader
        title="Create an account"
        subtitle="Join our community today"
      />

      <View style={s.card}>
        <AuthInput
          label="Display Name"
          icon={User}
          placeholder="John Doe"
          value={displayName}
          onChangeText={v => { setDisplayName(v); clearError(); }}
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
        />

        <AuthInput
          ref={emailRef}
          label="Email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChangeText={v => { setEmail(v); clearError(); }}
          keyboardType="email-address"
          autoCapitalize="none"
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
        />

        <AuthInput
          ref={passwordRef}
          label="Password"
          icon={Lock}
          placeholder="Min. 6 characters"
          value={password}
          onChangeText={v => { setPassword(v); clearError(); }}
          secureTextEntry
          showPasswordToggle
          isPasswordVisible={showPass}
          onTogglePassword={() => setShowPass(p => !p)}
          returnKeyType="next"
          onSubmitEditing={() => confirmPasswordRef.current?.focus()}
        />

        <AuthInput
          ref={confirmPasswordRef}
          label="Confirm Password"
          icon={Lock}
          placeholder="Repeat password"
          value={confirmPassword}
          onChangeText={v => { setConfirmPassword(v); clearError(); }}
          secureTextEntry
          showPasswordToggle
          isPasswordVisible={showConfirm}
          onTogglePassword={() => setShowConfirm(p => !p)}
          returnKeyType="done"
          onSubmitEditing={handleRegister}
        />

        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <AuthButton
          title="Sign Up"
          isLoading={isLoading}
          onPress={handleRegister}
          style={{ marginTop: 10 }}
        />

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <AuthButton
          variant="secondary"
          title="Already have an account? Log in"
          onPress={() => navigation.navigate('Login')}
        />
      </View>
    </AuthWrapper>
  );
}

// 用于切换主题

function getStyles(colors, isDark) {
  return StyleSheet.create({
    // Card
    card: {
      backgroundColor: isDark ? 'rgba(28,31,42,0.9)' : 'rgba(255,255,255,0.95)',
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 24,
      elevation: 10,
    },

    // Error
    errorBox: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginBottom: 4,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
    },
    errorText: { color: colors.error, fontSize: 13, fontWeight: '500' },

    // Terms (Only in Register)
    terms: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 14,
      lineHeight: 18,
    },
    termsLink: { color: colors.primary, fontWeight: '600' },

    // Divider
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { marginHorizontal: 12, color: colors.textMuted, fontSize: 13 },
  });
}

