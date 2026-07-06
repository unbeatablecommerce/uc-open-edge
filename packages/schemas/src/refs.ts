import { z } from 'zod';

export const SkuRefSchema = z
  .object({
    externalSku: z.string().optional(),
    sku: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const ItemRefSchema = z
  .object({
    externalItemId: z.string().optional(),
    itemId: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const LocationRefSchema = z
  .object({
    externalLocationId: z.string().optional(),
    locationId: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export const ContainerRefSchema = z
  .object({
    externalContainerId: z.string().optional(),
    containerId: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export const EquipmentRefSchema = z
  .object({
    externalEquipmentId: z.string().optional(),
    equipmentId: z.string().optional(),
    name: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export const RobotRefSchema = z
  .object({
    externalRobotId: z.string().optional(),
    robotId: z.string().optional(),
    name: z.string().optional(),
    model: z.string().optional(),
  })
  .passthrough();

export const TaskRefSchema = z
  .object({
    externalTaskId: z.string().optional(),
    taskId: z.string().optional(),
    type: z.string().optional(),
  })
  .passthrough();

export const WorkOrderRefSchema = z
  .object({
    externalWorkOrderId: z.string().optional(),
    workOrderId: z.string().optional(),
    description: z.string().optional(),
  })
  .passthrough();

export const SiteRefSchema = z
  .object({
    siteId: z.string().optional(),
    siteName: z.string().optional(),
  })
  .passthrough();

export const AreaRefSchema = z
  .object({
    areaId: z.string().optional(),
    areaName: z.string().optional(),
  })
  .passthrough();

export const ZoneRefSchema = z
  .object({
    zoneId: z.string().optional(),
    zoneName: z.string().optional(),
  })
  .passthrough();

export type SkuRef = z.infer<typeof SkuRefSchema>;
export type ItemRef = z.infer<typeof ItemRefSchema>;
export type LocationRef = z.infer<typeof LocationRefSchema>;
export type ContainerRef = z.infer<typeof ContainerRefSchema>;
export type EquipmentRef = z.infer<typeof EquipmentRefSchema>;
export type RobotRef = z.infer<typeof RobotRefSchema>;
export type TaskRef = z.infer<typeof TaskRefSchema>;
export type WorkOrderRef = z.infer<typeof WorkOrderRefSchema>;
export type SiteRef = z.infer<typeof SiteRefSchema>;
export type AreaRef = z.infer<typeof AreaRefSchema>;
export type ZoneRef = z.infer<typeof ZoneRefSchema>;
