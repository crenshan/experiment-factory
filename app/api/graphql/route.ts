import { createYoga } from "graphql-yoga";
import { schema } from "@/server/graphql/schema";
import type { GraphQLContext, NextContext } from "@/server/graphql/types";
import { adminAuth } from "@/lib/firebase/admin";

export const runtime = "nodejs";

async function getViewerFromRequest(request: Request): Promise<GraphQLContext["viewer"]> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader) return null;

  // Accept either "Bearer <token>" or raw token (helps during debugging)
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
    return { viewer };
  },
});

export { handleRequest as GET, handleRequest as POST, handleRequest as OPTIONS };
