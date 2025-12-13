"use client";

import { useEffect } from 'react'
import {useRouter} from 'next/navigation'
import {useAuth} from '../providers'

export default function AdminPage() {
  const router = useRouter();
  const { user, loading, isAdmin } = useAuth();

  useEffect(() => {
    if(!loading && (!user || !isAdmin)) {
      router.replace('/');
    }
  }, [isAdmin, loading, router, user]);

  if (loading) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Admin</h1>
        <p>Loading...</p>
      </main>
    )
  }

  if (!user || !isAdmin) {
    return (
      <main style={{ padding: 24 }}>
        <h1>Admin</h1>
        <p>Redirecting...</p>
      </main>
    )
  }

  return (
    <main style={{ padding: 24 }}>
      <h1>Admin</h1>
      <p>Phase 3+ will add experiment CURD here.</p>
    </main>
  )
}
