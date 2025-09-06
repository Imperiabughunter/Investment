import { Redirect } from "expo-router";
import { useAuth } from "../contexts/AuthContext";

export default function Index() {
  const { isAuthenticated } = useAuth();
  
  // Redirect to login if not authenticated, otherwise to dashboard
  return isAuthenticated ? (
    <Redirect href="/(tabs)/dashboard" />
  ) : (
    <Redirect href="/auth/login" />
  );
}
