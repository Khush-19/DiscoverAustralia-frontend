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
      // shadow
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: isDark ? 0.4 : 0.08,
      shadowRadius: 24,
      elevation: 10,
    },

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

    // Divider
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { marginHorizontal: 12, color: colors.textMuted, fontSize: 13 },
  });
}

