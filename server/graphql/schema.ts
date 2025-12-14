import { createSchema } from "graphql-yoga";
import type { SchemaContext } from "./types";
import {
  createExperiment,
  getExperiment,
  listExperiments,
  updateExperiment,
  type ExperimentStatus,
  type Variant
} from "@/server/data/experiments";
import { getOrCreateAssignment } from "../data/assignments";

const parseAllowList = (value: string | undefined) => {
  return (value ?? '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
}

const ADMIN_ALLOWLIST = parseAllowList(
  process.env.ADMIN_EMAIL_ALLOWLIST ?? process.env.NEXT_PUBLIC_ADMIN_EMAIL_ALLOWLIST
)

const requireAdmin = (ctx: SchemaContext) => {
  const email = (ctx.viewer?.email ?? '').toLowerCase();
  if (!email || !ADMIN_ALLOWLIST.includes(email)) {
    throw new Error('Not authorized');
  }
}

export const schema = createSchema<SchemaContext>({
  typeDefs: /* GraphQL */ `
    enum ExperimentStatus {
      DRAFT
      RUNNING
      PAUSED
    }

    type Viewer {
      uid: ID!
      email: String
    }

    type Variant {
      id: ID!
      name: String!
      weight: Int!
      journeyId: ID
    }

    type Experiment {
      id: ID!
      name: String!
      status: ExperimentStatus!
      variants: [Variant!]!
      createdAt: String!
      updatedAt: String!
      createdByEmail: String
    }

    type Assignment {
      experimentId: ID!
      userKey: ID!
      variant: Variant!
      assignedAt: String!
    }

    input VariantInput {
      id: ID!
      name: String!
      weight: Int!
      journeyId: ID
    }

    input CreateExperimentInput {
      name: String!
      variants: [VariantInput!]
    }

    input UpdateExperimentPatch {
      name: String
      status: ExperimentStatus
      variants: [VariantInput!]
    }

    type Query {
      me: Viewer

      experiments: [Experiment!]!
      experiment(id: ID!): Experiment

      getAssignment(experimentId: ID!): Assignment!
    }

    type Mutation {
      createExperiment(input: CreateExperimentInput!): Experiment!
      updateExperiment(id: ID!, patch: UpdateExperimentPatch!): Experiment!
      setExperimentStatus(id: ID!, status: ExperimentStatus!): Experiment!
    }
  `,
  resolvers: {
    Query: {
      me: (_parent, _args, ctx) => ctx.viewer,

      experiments: async (_parent, _args, ctx) => {
        requireAdmin(ctx);
        return listExperiments();
      },

      experiment: async (_parent, args: { id: string }, ctx) => {
        requireAdmin(ctx);
        return getExperiment(args.id);
      },

      getAssignment: async (_parent, args: { experimentId: string }, ctx) => {
        if (!ctx.userKey) {
          throw new Error('Missing user identity. Sign in or enable cookies.');
        }

        const assignment = await getOrCreateAssignment({
          experimentId: args.experimentId,
          userKey: ctx.userKey
        });

        return assignment;
      }
    },

    Mutation: {
      createExperiment: async (
        _parent,
        args: { input: { name: string; variants?: Variant[] } },
        ctx
      ) => {
        requireAdmin(ctx);
        return createExperiment({
          name: args.input.name,
          variants: args.input.variants,
          createdByEmail: ctx.viewer?.email ?? null,
        });
      },

      updateExperiment: async (
        _parent,
        args: { id: string; patch: { name?: string; status?: ExperimentStatus; variants?: Variant[] } },
        ctx
      ) => {
        requireAdmin(ctx);
        return  updateExperiment(args.id, args.patch);
      },

      setExperimentStatus: async (
        _parent,
        args: { id: string; status?: ExperimentStatus },
        ctx
      ) => {
        requireAdmin(ctx);
        return  updateExperiment(args.id, { status: args.status });
      },
    },
  }
});
