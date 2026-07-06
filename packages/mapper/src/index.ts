import type { PrismaClient } from '@uc-open-edge/db';

export interface MappingContext {
  prisma: PrismaClient;
  sourceSystemId?: string;
}

/**
 * Look up the internal key for an external key of a given mapping type.
 * Returns the externalKey unchanged if no mapping is found (pass-through).
 */
export async function resolveMapping(
  ctx: MappingContext,
  type: 'sku' | 'location' | 'equipment' | 'robot' | 'custom',
  externalKey: string,
): Promise<string> {
  const mapping = await ctx.prisma.mapping.findFirst({
    where: {
      type,
      externalKey,
      active: true,
      OR: [{ sourceSystemId: ctx.sourceSystemId ?? null }, { sourceSystemId: null }],
    },
    orderBy: { sourceSystemId: 'desc' },
  });
  return mapping?.internalKey ?? externalKey;
}

/**
 * Apply SKU mapping to a skuRef object.
 * Returns the original ref if no mapping exists (non-destructive).
 */
export async function mapSkuRef(
  ctx: MappingContext,
  ref: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const externalSku = ref['externalSku'];
  if (typeof externalSku !== 'string') return ref;
  const sku = await resolveMapping(ctx, 'sku', externalSku);
  return { ...ref, sku };
}

/**
 * Apply location mapping to a locationRef object.
 */
export async function mapLocationRef(
  ctx: MappingContext,
  ref: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const externalLocationId = ref['externalLocationId'];
  if (typeof externalLocationId !== 'string') return ref;
  const locationId = await resolveMapping(ctx, 'location', externalLocationId);
  return { ...ref, locationId };
}

/**
 * Apply equipment mapping to an equipmentRef object.
 */
export async function mapEquipmentRef(
  ctx: MappingContext,
  ref: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const externalEquipmentId = ref['externalEquipmentId'];
  if (typeof externalEquipmentId !== 'string') return ref;
  const equipmentId = await resolveMapping(ctx, 'equipment', externalEquipmentId);
  return { ...ref, equipmentId };
}

/**
 * Apply robot mapping to a robotRef object.
 */
export async function mapRobotRef(
  ctx: MappingContext,
  ref: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const externalRobotId = ref['externalRobotId'];
  if (typeof externalRobotId !== 'string') return ref;
  const robotId = await resolveMapping(ctx, 'robot', externalRobotId);
  return { ...ref, robotId };
}
