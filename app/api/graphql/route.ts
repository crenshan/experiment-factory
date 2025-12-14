import { createYoga } from "graphql-yoga";
import { schema } from "@/server/graphql/schema";
import type { GraphQLContext, NextContext } from "@/server/graphql/types";
import { adminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";

const getCookie = (cookieHeader: string | null, name: string): string | null => {
  if (!cookieHeader) return null;

  const parts = cookieHeader.split(';').map(p => p.trim());

  for (const part of parts) {
    if (!part.startsWith(`${name}=`)) continue;
    const value = part.slice(name.length + 1);
    return value ? decodeURIComponent(value) : null;
  }

  return null;
}


/**
 * Extract and verify a Firebase ID token from the Authorization header (if present)
 */
async function getViewerFromRequest(request: Request): Promise<GraphQLContext["viewer"]> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) return null;

  // Accept either "Bearer <token>" or raw token (debugging)
  const token = authHeader.startsWith("Bearer ")
    ? authHeader.slice("Bearer ".length).trim()
    : authHeader.trim();

  if (!token) return null;

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    return {
      uid: decoded.uid,
      email: (decoded).email ?? null,
    };
  } catch {
    return null;
  }
}

const { handleRequest } = createYoga<NextContext>({
  schema,
  graphqlEndpoint: "/api/graphql",
  fetchAPI: { Request, Response },
  context: async ({ request }) => {
    const viewer = await getViewerFromRequest(request);

    const anon = getCookie(request.headers.get('cookie'), 'ef_anon');
    const userKey = viewer?.uid ?? anon ?? null

    return { viewer, userKey };
  },
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
