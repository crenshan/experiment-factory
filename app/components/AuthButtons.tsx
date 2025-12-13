"use client";

import { GoogleAuthProvider, signInWithPopup, signOut } from "firebase/auth";
import {auth} from '../../lib/firebase/client'
import { useAuth } from "../providers";

export default function AuthButtons() {
  const { user, loading } = useAuth();

  const handleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const handleSignOut = async () => {
    await signOut(auth);
  };

  if (loading) return (<span>Loading...</span>);

  if (!user) {
    return (
      <button type='button' onClick={handleSignIn}>
        Sign in with Google
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
      <span>{user.email ?? "Signed in"}</span>

      <button type='button' onClick={handleSignOut}>
        Sign out
      </button>
    </div>
  )
}
