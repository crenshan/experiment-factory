import { createSchema } from "graphql-yoga";
import type { SchemaContext } from "./types";

export const schema = createSchema<SchemaContext>({
  typeDefs: `
    type Viewer {
      uid: ID!
      email: String
    }

    type Query {
      greetings: String!
      me: Viewer
    }
  `,
  resolvers: {
    Query: {
      greetings: () => "Hello from Yoga running inside Next.js.",
      me: (_parent, _args, ctx) => ctx.viewer,
    },
  },
});
