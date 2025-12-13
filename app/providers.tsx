"use client";

import React, { createContext, PropsWithChildren, useContext, useEffect, useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../lib/firebase/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
};

const AuthContext = createContext<AuthContextValue | null>(null);


function parseAllowlist(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

const ADMIN_ALLOWLIST = parseAllowlist(process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, nextUser => {
      setUser(nextUser);
      setLoading(false);
    });

    return () => unsub();
  });

  const value = useMemo<AuthContextValue>(() => {
    const email = (user?.email ?? '').toLowerCase();
    const isAdmin = Boolean(email) && ADMIN_ALLOWLIST.includes(email);

    return { user, loading, isAdmin };
  }, [loading, user]);

  return <AuthContext.Provider value={value}>{ children }</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if(!ctx) throw new Error('useAuth must be used within <AuthProvider />');
  return ctx;
}
