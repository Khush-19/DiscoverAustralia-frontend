import React, { useState, useRef, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, Eye, EyeOff, User, MapPin } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import useFadeIn from '../../hooks/useFadeIn';

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
  const { signUp }       = useAuth();
  const { setUserName }  = useUser();
  const { colors, isDark } = useTheme();
  const fadeStyle        = useFadeIn(300);

  const [displayName,     setDisplayName]     = useState('');
  const [email,           setEmail]           = useState('');
  const [password,        setPassword]        = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPass,        setShowPass]        = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [error,           setError]           = useState('');
  const [isLoading,       setIsLoading]       = useState(false);

  const emailRef          = useRef(null);
  const passwordRef       = useRef(null);
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
    <LinearGradient
      colors={colors.authGradient}
      style={s.gradient}
    >
      <SafeAreaView style={s.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={s.flex}
        >
          <ScrollView
            contentContainerStyle={s.scrollContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Animated.View style={[s.container, fadeStyle]}>

              {/* ── Logo ──────────────────────────────────────────────── */}
              <View style={s.logoArea}>
                <View style={s.logoIconWrap}>
                  <MapPin size={30} color={colors.primary} strokeWidth={2.5} />
                </View>
                <Text style={s.appName}>Discover Australia</Text>
                <Text style={s.tagline}>Join the community</Text>
              </View>

              {/* ── Card ──────────────────────────────────────────────── */}
              <View style={s.card}>
                <Text style={s.heading}>Create account</Text>
                <Text style={s.subheading}>Start your Australian adventure</Text>

                {/* Display Name — shown first because it's the most personal */}
                <View style={s.inputGroup}>
                  <Text style={s.label}>Display Name</Text>
                  <Text style={s.hint}>This is how other explorers will see you</Text>
                  <View style={s.inputRow}>
                    <User size={18} color={colors.textMuted} strokeWidth={1.8} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="e.g. Maya"
                      placeholderTextColor={colors.textMuted}
                      value={displayName}
                      onChangeText={v => { setDisplayName(v); clearError(); }}
                      autoCapitalize="words"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => emailRef.current?.focus()}
                    />
                  </View>
                </View>

                {/* Email */}
                <View style={s.inputGroup}>
                  <Text style={s.label}>Email</Text>
                  <View style={s.inputRow}>
                    <Mail size={18} color={colors.textMuted} strokeWidth={1.8} style={s.inputIcon} />
                    <TextInput
                      ref={emailRef}
                      style={s.input}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={v => { setEmail(v); clearError(); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      autoCorrect={false}
                      returnKeyType="next"
                      onSubmitEditing={() => passwordRef.current?.focus()}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={s.inputGroup}>
                  <Text style={s.label}>Password</Text>
                  <View style={s.inputRow}>
                    <Lock size={18} color={colors.textMuted} strokeWidth={1.8} style={s.inputIcon} />
                    <TextInput
                      ref={passwordRef}
                      style={[s.input, s.inputWithToggle]}
                      placeholder="Min. 6 characters"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={v => { setPassword(v); clearError(); }}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                      returnKeyType="next"
                      onSubmitEditing={() => confirmPasswordRef.current?.focus()}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPass(p => !p)}
                      style={s.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showPass
                        ? <EyeOff size={18} color={colors.textMuted} strokeWidth={1.8} />
                        : <Eye    size={18} color={colors.textMuted} strokeWidth={1.8} />
                      }
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Confirm Password */}
                <View style={s.inputGroup}>
                  <Text style={s.label}>Confirm Password</Text>
                  <View style={[
                    s.inputRow,
                    confirmPassword.length > 0 && password !== confirmPassword && s.inputRowError,
                  ]}>
                    <Lock size={18} color={colors.textMuted} strokeWidth={1.8} style={s.inputIcon} />
                    <TextInput
                      ref={confirmPasswordRef}
                      style={[s.input, s.inputWithToggle]}
                      placeholder="Re-enter your password"
                      placeholderTextColor={colors.textMuted}
                      value={confirmPassword}
                      onChangeText={v => { setConfirmPassword(v); clearError(); }}
                      secureTextEntry={!showConfirm}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleRegister}
                    />
                    <TouchableOpacity
                      onPress={() => setShowConfirm(p => !p)}
                      style={s.eyeBtn}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      {showConfirm
                        ? <EyeOff size={18} color={colors.textMuted} strokeWidth={1.8} />
                        : <Eye    size={18} color={colors.textMuted} strokeWidth={1.8} />
                      }
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Inline error */}
                {!!error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                {/* Register button */}
                <TouchableOpacity
                  style={[s.primaryBtn, isLoading && s.primaryBtnDisabled]}
                  onPress={handleRegister}
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
                      : <Text style={s.primaryBtnText}>Create Account</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                {/* Terms note */}
                <Text style={s.terms}>
                  By creating an account you agree to our{' '}
                  <Text style={s.termsLink}>Terms of Service</Text>
                  {' & '}
                  <Text style={s.termsLink}>Privacy Policy</Text>
                </Text>

                {/* Divider */}
                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>or</Text>
                  <View style={s.dividerLine} />
                </View>

                {/* Login link */}
                <TouchableOpacity
                  style={s.secondaryBtn}
                  onPress={() => navigation.navigate('Login')}
                  activeOpacity={0.75}
                >
                  <Text style={s.secondaryBtnText}>Already have an account? Log in</Text>
                </TouchableOpacity>

              </View>
            </Animated.View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(colors, isDark) {
  return StyleSheet.create({
    gradient:  { flex: 1 },
    safeArea:  { flex: 1 },
    flex:      { flex: 1 },

    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 32,
    },

    container: { width: '100%' },

    // Logo
    logoArea: { alignItems: 'center', marginBottom: 28 },
    logoIconWrap: {
      width: 60,
      height: 60,
      borderRadius: 18,
      backgroundColor: isDark ? 'rgba(45,212,191,0.12)' : 'rgba(45,212,191,0.1)',
      borderWidth: 1,
      borderColor: 'rgba(45,212,191,0.3)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 12,
    },
    appName: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
    },
    tagline: { fontSize: 14, color: colors.textMuted, marginTop: 4 },

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
    heading:    { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
    subheading: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },

    // Inputs
    inputGroup:  { marginBottom: 14 },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
      marginBottom: 4,
    },
    hint: {
      fontSize: 12,
      color: colors.textMuted,
      marginBottom: 8,
    },
    inputRow: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 14,
      height: 50,
    },
    inputRowError: {
      borderColor: colors.error,
      backgroundColor: 'rgba(239,68,68,0.05)',
    },
    inputIcon:       { marginRight: 10 },
    input:           { flex: 1, color: colors.text, fontSize: 15 },
    inputWithToggle: { paddingRight: 8 },
    eyeBtn:          { padding: 4 },

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

    // Primary button
    primaryBtn:          { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
    primaryBtnDisabled:  { opacity: 0.7 },
    primaryBtnGradient:  { height: 52, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: colors.buttonText,
      letterSpacing: 0.3,
    },

    // Terms
    terms: {
      fontSize: 12,
      color: colors.textMuted,
      textAlign: 'center',
      marginTop: 14,
      lineHeight: 18,
    },
    termsLink: { color: colors.primary, fontWeight: '600' },

    // Divider
    divider:     { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { marginHorizontal: 12, color: colors.textMuted, fontSize: 13 },

    // Secondary button
    secondaryBtn: {
      height: 52,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    secondaryBtnText: { fontSize: 15, fontWeight: '600', color: colors.primary },
  });
}
