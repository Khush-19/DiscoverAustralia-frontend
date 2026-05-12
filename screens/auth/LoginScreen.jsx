import { useState, useRef, useMemo } from 'react';
// 导入 React Native 核心组件：View, Text, TextInput, 动画(Animated)等
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Mail, Lock } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { useUser } from '../../context/UserContext';
import { useTheme } from '../../context/ThemeContext';
import useFadeIn from '../../hooks/useFadeIn';

// Auth Components
import AuthWrapper from '../../components/auth/AuthWrapper';
import AuthHeader from '../../components/auth/AuthHeader';
import AuthInput from '../../components/auth/AuthInput';
import AuthButton from '../../components/auth/AuthButton';

// ==================================================================

// Email正则校验
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 验证函数
function validate(email, password) {
  if (!email.trim()) return 'Email is required.';
  if (!EMAIL_REGEX.test(email)) return 'Please enter a valid email address.';
  if (!password) return 'Password is required.';
  if (password.length < 6) return 'Password must be at least 6 characters.';
  return null;
}

// ==================================================================

export default function LoginScreen({ navigation }) {
  const { signIn } = useAuth();
  const { setUserName } = useUser();
  const { colors, isDark } = useTheme();
  const fadeStyle = useFadeIn(300);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const passwordRef = useRef(null);

  const s = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

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
    <AuthWrapper fadeStyle={fadeStyle}>
      <AuthHeader 
        title="Welcome back" 
        subtitle="Sign in to continue exploring" 
      />

      <View style={s.card}>
        <AuthInput
          label="Email"
          icon={Mail}
          placeholder="you@example.com"
          value={email}
          onChangeText={v => { setEmail(v); setError(''); }}
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
          onChangeText={v => { setPassword(v); setError(''); }}
          secureTextEntry
          showPasswordToggle
          isPasswordVisible={showPass}
          onTogglePassword={() => setShowPass(p => !p)}
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />

        <TouchableOpacity
          style={s.forgotWrap}
          onPress={() => { /* TODO: ForgotPasswordScreen */ }}
        >
          <Text style={s.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        {!!error && (
          <View style={s.errorBox}>
            <Text style={s.errorText}>{error}</Text>
          </View>
        )}

        <AuthButton
          title="Log In"
          isLoading={isLoading}
          onPress={handleLogin}
          style={{ marginTop: 10 }}
        />

        <View style={s.divider}>
          <View style={s.dividerLine} />
          <Text style={s.dividerText}>or</Text>
          <View style={s.dividerLine} />
        </View>

        <AuthButton
          variant="secondary"
          title="Create an account"
          onPress={() => navigation.navigate('Register')}
        />
      </View>
    </AuthWrapper>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function getStyles(colors, isDark) {
  return StyleSheet.create({
    gradient: { flex: 1 },
    safeArea: { flex: 1 },
    flex: { flex: 1 },

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
    heading: { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
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
    inputIcon: { marginRight: 10 },
    input: { flex: 1, color: colors.text, fontSize: 15 },
    inputWithToggle: { paddingRight: 8 },
    eyeBtn: { padding: 4 },

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
      color: colors.buttonText,
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
