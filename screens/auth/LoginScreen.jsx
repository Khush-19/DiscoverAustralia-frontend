import { useState, useRef } from 'react';
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
import { Mail, Lock, Eye, EyeOff, MapPin } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import useFadeIn from '../../hooks/useFadeIn';

// ─── Validation ───────────────────────────────────────────────────────────────

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(email, password) {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function LoginScreen({ navigation }) {
  const { signIn }       = useAuth();
  const { setUserName }  = useUser();
  const { colors, isDark } = useTheme();
  const fadeStyle        = useFadeIn(300);

  const [email,       setEmail]       = useState('');
  const [password,    setPassword]    = useState('');
  const [showPass,    setShowPass]    = useState(false);
  const [error,       setError]       = useState('');
  const [isLoading,   setIsLoading]   = useState(false);

  const passwordRef = useRef(null);

  const s = getStyles(colors, isDark);

  async function handleLogin() {
    const validationError = validate(email.trim(), password);
    if (validationError) { setError(validationError); return; }

    setError('');
    setIsLoading(true);
    try {
      const user = await signIn(email.trim().toLowerCase(), password);
      // Sync displayName into the existing UserContext so all screens
      // personalise immediately (e.g., HomeScreen greeting).
      setUserName(user.displayName);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <LinearGradient
      colors={isDark ? ['#0A0D14', '#111827', '#0D1A1A'] : ['#F0FAFA', '#F9FAFB', '#ECFDF5']}
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
                <Text style={s.tagline}>Your community. Your adventure.</Text>
              </View>

              {/* ── Card ──────────────────────────────────────────────── */}
              <View style={s.card}>
                <Text style={s.heading}>Welcome back</Text>
                <Text style={s.subheading}>Sign in to continue exploring</Text>

                {/* Email */}
                <View style={s.inputGroup}>
                  <Text style={s.label}>Email</Text>
                  <View style={s.inputRow}>
                    <Mail size={18} color={colors.textMuted} strokeWidth={1.8} style={s.inputIcon} />
                    <TextInput
                      style={s.input}
                      placeholder="you@example.com"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={v => { setEmail(v); setError(''); }}
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
                      onChangeText={v => { setPassword(v); setError(''); }}
                      secureTextEntry={!showPass}
                      autoCapitalize="none"
                      returnKeyType="done"
                      onSubmitEditing={handleLogin}
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

                {/* Forgot password */}
                <TouchableOpacity
                  style={s.forgotWrap}
                  onPress={() => { /* TODO: ForgotPasswordScreen */ }}
                >
                  <Text style={s.forgotText}>Forgot password?</Text>
                </TouchableOpacity>

                {/* Inline error */}
                {!!error && (
                  <View style={s.errorBox}>
                    <Text style={s.errorText}>{error}</Text>
                  </View>
                )}

                {/* Login button */}
                <TouchableOpacity
                  style={[s.primaryBtn, isLoading && s.primaryBtnDisabled]}
                  onPress={handleLogin}
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
                      ? <ActivityIndicator color={isDark ? '#000' : '#fff'} size="small" />
                      : <Text style={s.primaryBtnText}>Log In</Text>
                    }
                  </LinearGradient>
                </TouchableOpacity>

                {/* Divider */}
                <View style={s.divider}>
                  <View style={s.dividerLine} />
                  <Text style={s.dividerText}>or</Text>
                  <View style={s.dividerLine} />
                </View>

                {/* Register link */}
                <TouchableOpacity
                  style={s.secondaryBtn}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.75}
                >
                  <Text style={s.secondaryBtnText}>Create an account</Text>
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
    gradient:    { flex: 1 },
    safeArea:    { flex: 1 },
    flex:        { flex: 1 },

    scrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 32,
    },

    container: { width: '100%' },

    // Logo
    logoArea: { alignItems: 'center', marginBottom: 32 },
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
    tagline: {
      fontSize: 14,
      color: colors.textMuted,
      marginTop: 4,
    },

    // Card
    card: {
      backgroundColor: isDark ? 'rgba(28,31,42,0.9)' : 'rgba(255,255,255,0.95)',
      borderRadius: 24,
      padding: 24,
      borderWidth: 1,
      borderColor: colors.border,
      // shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 24,
      elevation: 10,
    },
    heading:    { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
    subheading: { fontSize: 14, color: colors.textMuted, marginBottom: 24 },

    // Inputs
    inputGroup: { marginBottom: 16 },
    label: {
      fontSize: 13,
      fontWeight: '600',
      color: colors.textSecondary,
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
    inputIcon:       { marginRight: 10 },
    input:           { flex: 1, color: colors.text, fontSize: 15 },
    inputWithToggle: { paddingRight: 8 },
    eyeBtn:          { padding: 4 },

    // Forgot
    forgotWrap: { alignSelf: 'flex-end', marginBottom: 4 },
    forgotText: { fontSize: 13, color: colors.primary, fontWeight: '600' },

    // Error
    errorBox: {
      backgroundColor: 'rgba(239,68,68,0.1)',
      borderRadius: 10,
      paddingVertical: 10,
      paddingHorizontal: 14,
      marginTop: 12,
      borderWidth: 1,
      borderColor: 'rgba(239,68,68,0.25)',
    },
    errorText: { color: colors.error, fontSize: 13, fontWeight: '500' },

    // Primary button
    primaryBtn: { marginTop: 20, borderRadius: 14, overflow: 'hidden' },
    primaryBtnDisabled: { opacity: 0.7 },
    primaryBtnGradient: { height: 52, alignItems: 'center', justifyContent: 'center' },
    primaryBtnText: {
      fontSize: 16,
      fontWeight: '700',
      color: isDark ? '#000000' : '#ffffff',
      letterSpacing: 0.3,
    },

    // Divider
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
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
