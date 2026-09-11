import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { TextInput } from '../../components/ui/TextInput';
import { Card } from '../../components/ui/Card';
import { useToast } from '../../components/ui/Toast';
import { COLORS, RADIUS, SPACING, TYPOGRAPHY } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, loginAsDemo } = useAuthStore();
  const { showToast } = useToast();

  const [email, setEmail] = useState('operator@relayai.com');
  const [password, setPassword] = useState('RelayOperator123!');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in both email and password');
      return;
    }
    setError('');
    setIsLoading(true);
    try {
      await login(email, password);
      showToast('Logged in successfully', 'success');
      router.replace('/(tabs)/inbox');
    } catch (e: any) {
      setError(e.message || 'Login failed. Please verify credentials.');
      showToast(e.message || 'Invalid credentials', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDemoLogin = (role: 'operator' | 'supervisor' = 'operator') => {
    setError('');
    loginAsDemo(role);
    showToast(`Logged in as ${role === 'operator' ? 'Operator' : 'Supervisor'} (Demo Mode)`, 'info');
    router.replace('/(tabs)/inbox');
  };

  const fillDemoCredentials = (role: 'operator' | 'supervisor') => {
    if (role === 'operator') {
      setEmail('operator@relayai.com');
      setPassword('RelayOperator123!');
    } else {
      setEmail('supervisor@relayai.com');
      setPassword('RelaySupervisor123!');
    }
    setError('');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoText}>⚡ RelayAI</Text>
          </View>
          <Text style={styles.subtitle}>
            Unified AI Business Communication & Customer Operations Platform
          </Text>
        </View>

        <Card variant="elevated" padding="lg" style={styles.card}>
          <Text style={styles.cardTitle}>Sign in to Operator Console</Text>
          <Text style={styles.cardDesc}>
            Manage cross-channel customer conversations, review AI suggested responses, and inspect live call telemetry.
          </Text>

          {error ? (
            <View style={styles.errorBanner}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
              <TouchableOpacity
                onPress={() => handleDemoLogin('operator')}
                style={styles.demoBannerBtn}
              >
                <Text style={styles.demoBannerBtnText}>🚀 Continue in Demo Mode (No Backend Required)</Text>
              </TouchableOpacity>
            </View>
          ) : null}

          <TextInput
            label="Work Email"
            value={email}
            onChangeText={(val) => {
              setEmail(val);
              setError('');
            }}
            placeholder="name@company.com"
            autoCapitalize="none"
            keyboardType="email-address"
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={(val) => {
              setPassword(val);
              setError('');
            }}
            placeholder="••••••••••••"
            secureTextEntry
          />

          <Button
            title="Sign In to RelayAI"
            size="lg"
            loading={isLoading}
            onPress={handleLogin}
            style={styles.loginBtn}
          />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>DEMO CREDENTIALS</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.demoButtonsRow}>
            <Button
              title="Fill Operator (Jordan)"
              variant="outline"
              size="sm"
              onPress={() => fillDemoCredentials('operator')}
              style={styles.demoBtn}
            />
            <Button
              title="Fill Supervisor (Morgan)"
              variant="outline"
              size="sm"
              onPress={() => fillDemoCredentials('supervisor')}
              style={styles.demoBtn}
            />
          </View>

          <TouchableOpacity
            onPress={() => handleDemoLogin('operator')}
            style={styles.demoDirectLink}
          >
            <Text style={styles.demoDirectLinkText}>✨ Enter Interactive Demo Mode (Offline)</Text>
          </TouchableOpacity>
        </Card>

        <Text style={styles.footerNote}>
          Production-grade architecture featuring TanStack Query v5, Zustand, WebSockets, and safe SQL AST compilation.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#18181B', // Charcoal Zinc 900
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: SPACING.lg,
    maxWidth: 480,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    backgroundColor: '#27272A',
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#EA580C', // Orange accent border
    marginBottom: SPACING.sm,
  },
  logoText: {
    color: '#FB923C', // Warm Orange 400
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  subtitle: {
    color: '#A1A1AA',
    fontSize: TYPOGRAPHY.size.sm,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    borderColor: '#E4E4E7',
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.size.lg,
    fontWeight: TYPOGRAPHY.weight.bold,
    color: COLORS.text,
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: TYPOGRAPHY.size.xs,
    color: COLORS.textMuted,
    lineHeight: 16,
    marginBottom: SPACING.lg,
  },
  errorBanner: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.medium,
  },
  demoBannerBtn: {
    marginTop: SPACING.xs,
    backgroundColor: '#EA580C',
    paddingVertical: 6,
    paddingHorizontal: SPACING.sm,
    borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  demoBannerBtnText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  loginBtn: {
    marginTop: SPACING.sm,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.border,
  },
  dividerText: {
    fontSize: 10,
    color: COLORS.textSubtle,
    fontWeight: TYPOGRAPHY.weight.bold,
    paddingHorizontal: SPACING.sm,
    letterSpacing: 0.5,
  },
  demoButtonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  demoBtn: {
    flex: 1,
  },
  demoDirectLink: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: RADIUS.md,
  },
  demoDirectLinkText: {
    color: '#0284C7',
    fontSize: TYPOGRAPHY.size.xs,
    fontWeight: TYPOGRAPHY.weight.bold,
  },
  footerNote: {
    color: '#64748B',
    fontSize: 11,
    textAlign: 'center',
    marginTop: SPACING.xl,
    lineHeight: 15,
  },
});
