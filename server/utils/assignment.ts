import type { Variant } from "@/server/data/experiments";
import { fnv1a32 } from "./hash";

export const pickVariantDeterministically = ({ experimentId, userKey, variants }: {
  experimentId: string;
  userKey: string;
  variants: Variant[];
}): Variant => {
  const weights = variants.map(v => Math.max(0, Number(v.weight) || 0));
  const total = weights.reduce((sum, w) => sum + w, 0);

  if (variants.length === 0) throw new Error('Experiment has no variants');
  if (total <= 0) throw new Error('Variant weights must sum to > 0');

  const seed = `${experimentId}::${userKey}`;
  const bucket = fnv1a32(seed) % total;

  let running = 0;
  for (let i = 0; i < variants.length; i++) {
    running += weights[i];
    if (bucket < running) return variants[i];
  }

  return variants[variants.length - 1];
}
