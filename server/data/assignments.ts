import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/firestore";
import { getExperiment, type Variant } from "./experiments";
import { pickVariantDeterministically } from "@/server/utils/assignment";

export type Assignment = {
  experimentId: string;
  userKey: string;
  variant: Variant;
  assignedAt: string;
};

const COLLECTION = "assignments";

function toIso(value: unknown): string {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date().toISOString();
}

function safeDocId(experimentId: string, userKey: string) {
  return `${experimentId}__${userKey}`.replaceAll("/", "_");
}

function toInt(value: unknown, fallback = 0): number {
  const n =
    typeof value === "number"
      ? value
      : typeof value === "string"
      ? Number(value)
      : NaN;

  if (!Number.isFinite(n)) return fallback;
  // GraphQL Int must be an integer
  return Math.trunc(n);
}

function normalizeVariant(v: Partial<Variant>): Variant {
  return {
    id: String(v.id ?? "A"),
    name: String(v.name ?? "Variant"),
    weight: toInt(v.weight, 0),
    journeyId: (v.journeyId ?? null) as string | null,
  };
}

export async function getOrCreateAssignment(args: {
  experimentId: string;
  userKey: string;
}): Promise<Assignment> {
  const { experimentId, userKey } = args;
  const docId = safeDocId(experimentId, userKey);
  const ref = db.collection(COLLECTION).doc(docId);

  return db.runTransaction(async (tx) => {
    const existing = await tx.get(ref);

    if (existing.exists) {
      const data = existing.data()!;
      return {
        experimentId: String(data.experimentId),
        userKey: String(data.userKey),
        variant: normalizeVariant({
          id: data.variantId,
          name: data.variantName,
          weight: data.variantWeight,
          journeyId: data.journeyId ?? null,
        }),
        assignedAt: toIso(data.assignedAt),
      };
    }

    const exp = await getExperiment(experimentId);
    if (!exp) throw new Error("Experiment not found");

    const picked = pickVariantDeterministically({
      experimentId,
      userKey,
      variants: exp.variants,
    });

    // Ensure what we store is always an Int-compatible number
    const variant = normalizeVariant(picked);

    tx.set(ref, {
      experimentId,
      userKey,
      variantId: variant.id,
      variantName: variant.name,
      variantWeight: variant.weight,
      journeyId: variant.journeyId ?? null,
      assignedAt: FieldValue.serverTimestamp(),
    });

    return {
      experimentId,
      userKey,
      variant,
      assignedAt: new Date().toISOString(),
    };
  });
}
