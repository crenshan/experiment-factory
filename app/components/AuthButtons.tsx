"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import { auth } from "@/lib/firebase/client";
import { useAuth } from "@/app/providers";
import { ui } from "@/lib/ui";

export default function AuthButtons() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (loading) return <span className="text-sm text-zinc-600">Loading…</span>;

  if (!user) {
    return (
      <button type="button" className={ui.button.primary} onClick={handleSignIn}>
        Sign in with Google
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm text-zinc-700">{user.email ?? "Signed in"}</span>
      <button type="button" className={ui.button.secondary} onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  );
}
