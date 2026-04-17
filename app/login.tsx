import { supabase } from "@/lib/supabase";
import { Image } from "expo-image";
import { Stack } from "expo-router";
import { useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

export default function LoginScreen() {
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [signUpFullName, setSignUpFullName] = useState("");
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignInPress() {
    setIsLoading(true);
    setError(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: loginEmail.trim(),
      password: loginPassword,
    });

    if (signInError) setError(signInError.message);
    setIsLoading(false);
  }

  async function onSignUpPress() {
    setIsLoading(true);
    setError(null);

    const normalizedName = signUpFullName.trim();
    if (!normalizedName) {
      setError("Name cannot be empty");
      setIsLoading(false);
      return;
    }

    const { error: signUpError } = await supabase.auth.signUp({
      email: signUpEmail.trim(),
      password: signUpPassword,
      options: {
        data: {
          full_name: normalizedName,
        },
      },
    });

    if (signUpError) setError(signUpError.message);
    setIsLoading(false);
  }

  function onPasswordSubmit() {
    if (isLoading) return;

    if (mode === "login") {
      if (loginEmail && loginPassword) onSignInPress();
      return;
    }

    if (signUpFullName.trim() && signUpEmail && signUpPassword) onSignUpPress();
  }

  return (
    <>
      <Stack.Screen options={{ title: "Log in", headerShown: false }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.header}>
          <Image
            source={require("../assets/images/remainder_logo.svg")}
            contentFit="contain"
            style={styles.logo}
          />

          <Text style={styles.title}>
            {mode === "login" ? "Welcome back!" : "Sign up"}
          </Text>
          <Text style={styles.subtitle}>
            {mode === "login"
              ? "Log in to see your reminders"
              : "Create an account to get started"}
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.tabRow}>
            <Pressable
              onPress={() => {
                setMode("login");
                setError(null);
              }}
              style={[styles.tab, mode === "login" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "login" && styles.tabTextActive,
                ]}
              >
                Log in
              </Text>
            </Pressable>

            <Pressable
              onPress={() => {
                setMode("signup");
                setError(null);
              }}
              style={[styles.tab, mode === "signup" && styles.tabActive]}
            >
              <Text
                style={[
                  styles.tabText,
                  mode === "signup" && styles.tabTextActive,
                ]}
              >
                Sign up
              </Text>
            </Pressable>
          </View>

          {mode === "signup" ? <Text style={styles.label}>Name</Text> : null}

          {mode === "signup" ? (
            <TextInput
              autoCapitalize="words"
              autoComplete="name"
              blurOnSubmit={false}
              onChangeText={setSignUpFullName}
              onSubmitEditing={() => emailInputRef.current?.focus()}
              placeholder="What should we call you?"
              placeholderTextColor="#8a8f98"
              returnKeyType="next"
              style={styles.input}
              value={signUpFullName}
            />
          ) : null}

          {mode === "login" ? <Text style={styles.label}>Email</Text> : null}
          {mode === "signup" ? <Text style={styles.label}>Email</Text> : null}

          <TextInput
            autoCapitalize="none"
            autoComplete="email"
            blurOnSubmit={false}
            keyboardType="email-address"
            onChangeText={mode === "login" ? setLoginEmail : setSignUpEmail}
            onSubmitEditing={() => passwordInputRef.current?.focus()}
            placeholder="email@example.com"
            placeholderTextColor="#8a8f98"
            ref={emailInputRef}
            returnKeyType="next"
            style={styles.input}
            value={mode === "login" ? loginEmail : signUpEmail}
          />

          {mode === "login" ? <Text style={styles.label}>Password</Text> : null}
          {mode === "signup" ? (
            <Text style={styles.label}>Password</Text>
          ) : null}

          <TextInput
            autoCapitalize="none"
            autoComplete="password"
            onChangeText={
              mode === "login" ? setLoginPassword : setSignUpPassword
            }
            onSubmitEditing={onPasswordSubmit}
            placeholder="Password"
            placeholderTextColor="#8a8f98"
            ref={passwordInputRef}
            returnKeyType="done"
            secureTextEntry
            style={styles.input}
            value={mode === "login" ? loginPassword : signUpPassword}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {mode === "login" ? (
            <Pressable
              disabled={isLoading || !loginEmail || !loginPassword}
              onPress={onSignInPress}
              style={({ pressed }) => [
                styles.primaryButton,
                (pressed || isLoading || !loginEmail || !loginPassword) &&
                  styles.primaryButtonPressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.primaryButtonText}>Log in</Text>
              )}
            </Pressable>
          ) : (
            <Pressable
              disabled={
                isLoading ||
                !signUpFullName.trim() ||
                !signUpEmail ||
                !signUpPassword
              }
              onPress={onSignUpPress}
              style={({ pressed }) => [
                styles.secondaryButton,
                (pressed ||
                  isLoading ||
                  !signUpFullName.trim() ||
                  !signUpEmail ||
                  !signUpPassword) &&
                  styles.secondaryButtonPressed,
              ]}
            >
              {isLoading ? (
                <ActivityIndicator color="#2E7D32" />
              ) : (
                <Text style={styles.secondaryButtonText}>Sign up</Text>
              )}
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F1F8E9",
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
  },
  logo: {
    width: 180,
    height: 96,
    marginBottom: 16,
  },
  card: {
    flex: 1,
    backgroundColor: "#ffffff",
    borderRadius: 30,
    padding: 24,
    gap: 8,
    shadowColor: "#000000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    overflow: "scroll",
  },
  tabRow: {
    flexDirection: "row",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 40,
    borderBottomColor: "#F1F8E9",
    borderBottomWidth: 2,
    marginBottom: 8,
  },
  tabActive: {
    backgroundColor: "#ffffff",
    borderBottomColor: "#2E7D32",
    borderBottomWidth: 2,
  },
  tabText: {
    color: "#212121",
    opacity: 0.6,
    fontFamily: "Nunito_400Regular",
    fontSize: 16,
  },
  tabTextActive: {
    color: "#2E7D32",
    opacity: 1,
    fontFamily: "Nunito_700Bold",
  },
  title: {
    fontSize: 28,
    fontFamily: "Nunito_700Bold",
    color: "#173404",
  },
  subtitle: {
    fontSize: 15,
    fontFamily: "Nunito_400Regular",
    color: "#2E7D32",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: "#2E7D32",
    fontFamily: "Nunito_700Bold",
    textTransform: "uppercase",
    marginTop: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#F1F8E9",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#212121",
    backgroundColor: "#ffffff",
  },
  primaryButton: {
    backgroundColor: "#2E7D32",
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  primaryButtonPressed: {
    opacity: 0.7,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: "#2E7D32",
    borderRadius: 12,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  secondaryButtonPressed: {
    opacity: 0.6,
  },
  secondaryButtonText: {
    color: "#2E7D32",
    fontFamily: "Nunito_700Bold",
    fontSize: 16,
  },
  errorText: {
    color: "#d03535",
    fontFamily: "Nunito_400Regular",
    fontSize: 14,
  },
});
