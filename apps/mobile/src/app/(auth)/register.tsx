import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, ScrollView,
} from 'react-native';
import { Link } from 'expo-router';
import { useAuth } from '@/contexts/auth';

export default function RegisterScreen() {
  const { register } = useAuth();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError]       = useState('');

  const handleRegister = async () => {
    if (password !== confirm) { setError('Las contraseñas no coinciden'); return; }
    if (password.length < 8)  { setError('La contraseña debe tener al menos 8 caracteres'); return; }
    setIsLoading(true);
    setError('');
    try {
      await register(email.trim(), password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={s.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand */}
        <View style={s.brand}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>P</Text>
          </View>
          <Text style={s.logoText}>Crea tu cuenta</Text>
          <Text style={s.tagline}>Únete a la red deportiva moderna</Text>
        </View>

        {/* Form */}
        <View style={s.form}>
          {!!error && (
            <View style={s.errorBox}>
              <Text style={s.errorText}>{error}</Text>
            </View>
          )}

          <Text style={s.label}>Correo electrónico</Text>
          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="tu@ejemplo.com"
            placeholderTextColor="#475569"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardAppearance="dark"
          />

          <Text style={s.label}>Contraseña</Text>
          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Al menos 8 caracteres"
            placeholderTextColor="#475569"
            secureTextEntry
            keyboardAppearance="dark"
          />

          <Text style={s.label}>Confirmar contraseña</Text>
          <TextInput
            style={s.input}
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            placeholderTextColor="#475569"
            secureTextEntry
            keyboardAppearance="dark"
          />

          <TouchableOpacity
            style={[s.button, isLoading && s.buttonDisabled]}
            onPress={handleRegister}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <Text style={s.buttonText}>Crear cuenta</Text>
            }
          </TouchableOpacity>

          <View style={s.footer}>
            <Text style={s.footerText}>¿Ya tienes cuenta? </Text>
            <Link href="/(auth)/login">
              <Text style={s.link}>Inicia sesión</Text>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  scroll: { flexGrow: 1, justifyContent: 'center' },

  brand: { alignItems: 'center', paddingTop: 56, paddingBottom: 40 },
  logoBox: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: '#14b8a6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#14b8a6',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  logoLetter: { color: '#fff', fontSize: 32, fontWeight: '900' },
  logoText:   { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  tagline:    { color: '#64748b', fontSize: 14, marginTop: 6 },

  form: { paddingHorizontal: 28, paddingBottom: 40 },

  label: { fontSize: 13, fontWeight: '600', color: '#94a3b8', marginBottom: 8, letterSpacing: 0.3 },

  input: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#fff',
    marginBottom: 18,
  },

  button: {
    backgroundColor: '#14b8a6',
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 6,
    shadowColor: '#14b8a6',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 28 },
  footerText: { color: '#475569', fontSize: 14 },
  link: { color: '#14b8a6', fontSize: 14, fontWeight: '700' },

  errorBox: {
    backgroundColor: 'rgba(239,68,68,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
    borderRadius: 10,
    padding: 12,
    marginBottom: 18,
  },
  errorText: { color: '#f87171', fontSize: 14 },
});
