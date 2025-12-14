import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { db } from "@/lib/firebase/firestore";

export type ExperimentStatus = 'DRAFT' | 'RUNNING' | 'PAUSED';

export type Variant = {
  id: string;
  name: string;
  weight: number;
  journeyId: string | null;
};

export type Experiment = {
  id: string;
  name: string;
  status: ExperimentStatus;
  variants: Variant[];
  createdAt: string;
  updatedAt: string;
  createdByEmail?: string | null;
};

const COLLECTION = 'experiments';

const toIso = (value: unknown): string => {
  if (value instanceof Timestamp) return value.toDate().toISOString();
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return new Date(value).toISOString();

  return new Date().toISOString();
}

const docToExperiment = (id: string, data: FirebaseFirestore.DocumentData): Experiment => ({
  id,
  name: String(data.name ?? ''),
  status: (data.status ?? 'DRAFT') as ExperimentStatus,
  variants: Array.isArray(data.variants) ? data.variants : [],
  createdAt: toIso(data.createdAt),
  updatedAt: toIso(data.updatedAt),
  createdByEmail: (data.createdByEmail ?? null) as string | null
})

export const listExperiments = async (): Promise<Experiment[]> => {
  const snap = await db.collection(COLLECTION).orderBy('updatedAt', 'desc').get();
  return snap.docs.map(doc => docToExperiment(doc.id, doc.data()));
}

export const getExperiment = async (id: string): Promise<Experiment | null> => {
  const doc = await db.collection(COLLECTION).doc(id).get();
  if (!doc.exists) return null;
  return docToExperiment(doc.id, doc.data()!)
}

export const createExperiment = async (args: {
  name: string;
  createdByEmail?: string | null;
  variants?: Variant[]
}): Promise<Experiment> => {
  const ref = db.collection(COLLECTION).doc();

  const variants = args.variants && args.variants.length > 0
    ? args.variants
    : [
      { id: 'A', name: 'Variant A', weight: 50, journeyId: null },
      { id: 'B', name: 'Variant B', weight: 50, journeyId: null }
    ];

  await ref.set({
    name: args.name,
    status: 'DRAFT',
    variants,
    createdByEmail: args.createdByEmail ?? null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  })

  const created = await ref.get();
  return docToExperiment(created.id, created.data()!);
}

export const updateExperiment = async (
  id: string,
  patch: Partial<Pick<Experiment, 'name' | 'status' | 'variants'>>
): Promise<Experiment> => {
  const ref = db.collection(COLLECTION).doc(id);

  await ref.set(
    {
    ...patch,
    updatedAt: FieldValue.serverTimestamp()
    },
    { merge: true }
  );

  const updated = await ref.get();
  if(!updated.exists) {
    throw new Error('Experiment not found');
  }

  return docToExperiment(updated.id, updated.data()!);
};
