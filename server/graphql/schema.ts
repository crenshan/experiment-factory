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
import { logEvent, type EventType } from "../data/events";
import { getExperimentMetrics } from "../data/metrics";

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

    enum EventType {
      EXPOSURE
      INTERACTION
      CONVERSION
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

    type Event {
      id: ID!
      experimentId: ID!
      userKey: ID!
      variantId: ID!
      variantName: String!
      type: EventType!
      name: String!
      idempotencyKey: String
      createdAt: String!
    }

    type VariantMetrics {
      variantId: ID!
      variantName: String!
      exposures: Int!
      conversions: Int!
      conversionRate: Float!
    }

    type TotalsMetrics {
      exposures: Int!
      conversions: Int!
      conversionRate: Float!
    }

    type ExperimentMetrics {
      experimentId: ID!
      generatedAt: String!
      variants: [VariantMetrics!]!
      totals: TotalsMetrics!
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

    input LogEventInput {
      experimentId: ID!
      variantId: ID!
      type: EventType!
      name: String!
      idempotencyKey: String
    }

    type Query {
      me: Viewer

      experiments: [Experiment!]!
      experiment(id: ID!): Experiment

      getAssignment(experimentId: ID!): Assignment!

      experimentMetrics(experimentId: ID!): ExperimentMetrics!
    }

    type Mutation {
      createExperiment(input: CreateExperimentInput!): Experiment!
      updateExperiment(id: ID!, patch: UpdateExperimentPatch!): Experiment!
      setExperimentStatus(id: ID!, status: ExperimentStatus!): Experiment!

      logEvent(input: LogEventInput!): Event!
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
      },

      experimentMetrics: async (_parent, args: { experimentId: string }, ctx) => {
        requireAdmin(ctx);
        return getExperimentMetrics(args.experimentId);
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

      logEvent: async (
        _parent,
        args: { input: { experimentId: string; variantId: string; type: EventType; name: string; idempotencyKey?: string } },
        ctx
      ) => {
        if (!ctx.userKey) throw new Error('Missing user identity. Sign in or enable cookies.');

        const exp = await getExperiment(args.input.experimentId);
        if (!exp) throw new Error('Experiment not found');

        const variant = exp.variants.find((v) => v.id === args.input.variantId);
        if (!variant) throw new Error('Variant not found for experiment');

        return logEvent({
          experimentId: args.input.experimentId,
          userKey: ctx.userKey,
          variantId: variant.id,
          variantName: variant.name,
          type: args.input.type,
          name: args.input.name,
          idempotencyKey: args.input.idempotencyKey ?? null,
        });
      },
    },
  }
});
