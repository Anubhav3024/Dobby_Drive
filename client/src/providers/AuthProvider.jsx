import { createContext, useContext, useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getMe,
  login as apiLogin,
  logout as apiLogout,
  signup as apiSignup,
} from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    retry: false,
  });

  const loginMutation = useMutation({
    mutationFn: apiLogin,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
    },
  });

  const signupMutation = useMutation({
    mutationFn: apiSignup,
    onSuccess: (user) => {
      queryClient.setQueryData(["me"], user);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: apiLogout,
    onSuccess: () => {
      queryClient.setQueryData(["me"], null);
    },
  });

  const value = useMemo(() => {
    return {
      user: meQuery.data || null,
      isLoading: meQuery.isLoading,
      isAuthenticated: Boolean(meQuery.data),
      login: (payload) => loginMutation.mutateAsync(payload),
      signup: (payload) => signupMutation.mutateAsync(payload),
      logout: () => logoutMutation.mutateAsync(),
      authError: meQuery.isError ? meQuery.error : null,
    };
  }, [
    meQuery.data,
    meQuery.isLoading,
    meQuery.isError,
    meQuery.error,
    loginMutation,
    signupMutation,
    logoutMutation,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

