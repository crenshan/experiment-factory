import { db } from '@/lib/firebase/firestore';
import { getExperiment } from './experiments';

export type VariantMatrics = {
  variantId: string;
  variantName: string;
  exposures: number;
  conversions: number;
  conversionRate: number;
}

export type ExperimentMetrics = {
  experimentId: string;
  generatedAt: string;
  variants: VariantMatrics[];
  totals: {
    exposures: number;
    conversions: number;
    conversionRate: number;
  }
}

export const getExperimentMetrics = async (experimentId: string): Promise<ExperimentMetrics> => {
  const exp = await getExperiment(experimentId);

  if (!exp) throw new Error('Experiment not found');

  const snap = await db.collection('events').where('experimentId', '==', experimentId).get();

  const map = new Map<string, { exposures: number; conversions: number; varianName?: string }>();

  for (const doc of snap.docs) {
    const data = doc.data();
    const variantId = String(data.variantId ?? '');
    if (!variantId) continue;

    const type = String(data.type ?? '');
    const variantName = (data.variantName ? String(data.variantName) : undefined) as string | undefined;

    const entry: {
      exposures: number;
      conversions: number;
      variantName?: string;
    } = map.get(variantId) ?? { exposures: 0, conversions: 0, variantName };

    if (variantName && !entry.variantName) entry.variantName = variantName;

    if (type === 'EXPOSURE') entry.exposures += 1;
    if (type === 'CONVERSION') entry.conversions += 1;

    map.set(variantId, entry);
  }

  const variants: VariantMatrics[] = exp.variants.map(v => {
    const entry = map.get(v.id) ?? { exposures: 0, conversions: 0, varianName: v.name };
    const exposures = entry.exposures;
    const conversions = entry.conversions;
    const conversionRate = exposures > 0 ? conversions / exposures : 0;

    return {
      variantId: v.id,
      variantName: entry.varianName ?? v.name,
      exposures,
      conversions,
      conversionRate
    }
  });

  const totalExposures = variants.reduce((sum, v) => sum + v.exposures, 0);
  const totalConversions = variants.reduce((sum, v) => sum + v.conversions, 0);

  return {
    experimentId,
    generatedAt: new Date().toISOString(),
    variants,
    totals: {
      exposures: totalExposures,
      conversions: totalConversions,
      conversionRate: totalExposures > 0 ? totalConversions / totalExposures : 0
    }
  }
}
