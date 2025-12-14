import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/firestore";

export type EventType = 'EXPOSURE' | 'INTERACTION' | 'CONVERSION';

export type EventRecord = {
  id: string;
  experimentId: string;
  userKey: string;
  variantId: string;
  variantName: string;
  type: EventType;
  name: string;
  idempotencyKey?: string | null;
  createdAt: string;
};

const COLLECTION = 'events';

const toIso = (value: unknown): string => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();
  return new Date().toISOString();
}

const safeDocId = (key: string) => {
  return key.replace('/', '_');
}


export const logEvent = async (args: {
  experimentId :string;
  userKey: string;
  variantId: string;
  variantName: string;
  type: EventType;
  name: string;
  idempotencyKey?: string | null;
}): Promise<EventRecord> => {
  const col = db.collection(COLLECTION);

  if (args.idempotencyKey) {
    const id = safeDocId(args.idempotencyKey);
    const ref = col.doc(id);

    // transaction makes idempotency safe under concurrency.
    return db.runTransaction(async (tx) => {
      const existing = await tx.get(ref);
      if (existing.exists) {
        const data = existing.data()!;
        return {
          id: existing.id,
          experimentId: args.experimentId,
          userKey: String(data.userKey),
          variantId: String(data.variantId),
          variantName: String(data.variantName),
          type: String(data.type) as EventType,
          name: String(data.name),
          idempotencyKey: (data.idempotencyKey ?? null) as string | null,
          createdAt: toIso(data.createdAt)
        }
      }

      tx.set(ref, {
        experimentId: args.experimentId,
        userKey: args.userKey,
        variantId: args.variantId,
        variantName: args.variantName,
        type: args.type,
        name: args.name,
        idempotencyKey: args.idempotencyKey ?? null,
        createdAt: FieldValue.serverTimestamp()
      });

      return {
        id: ref.id,
        experimentId: args.experimentId,
        userKey: args.userKey,
        variantId: args.variantId,
        variantName: args.variantName,
        type: args.type,
        name: args.name,
        idempotencyKey: args.idempotencyKey ?? null,
        createdAt: new Date().toISOString()
      };
    });
  }

  // Non-idempotent events: auto-ID
  const ref = col.doc();

  await ref.set({
    experimentId: args.experimentId,
    userKey: args.userKey,
    variantId: args.variantId,
    variantName: args.variantName,
    type: args.type,
    name: args.name,
    idempotencyKey: null,
    createdAt: FieldValue.serverTimestamp(),
  });

  return {
    id: ref.id,
    experimentId: args.experimentId,
    userKey: args.userKey,
    variantId: args.variantId,
    variantName: args.variantName,
    type: args.type,
    name: args.name,
    idempotencyKey: null,
    createdAt: new Date().toISOString(),
  };
}
