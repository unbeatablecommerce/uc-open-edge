export type Role = 'admin' | 'operator' | 'viewer';

export type EventStatus =
  'pending' | 'processing' | 'normalized' | 'invalid' | 'duplicate' | 'failed';

export type DeliveryStatus = 'pending' | 'in_progress' | 'delivered' | 'failed' | 'skipped';

export type ConnectorStatus = 'active' | 'error' | 'idle' | 'disabled';
export type DestinationStatus = 'active' | 'error' | 'idle' | 'disabled';

export type ConnectorType =
  | 'webhook'
  | 'file_drop'
  | 'csv'
  | 'rest_poll'
  | 'mqtt'
  | 'opcua'
  | 'wms_template'
  | 'wes_template'
  | 'amr_template'
  | 'manufacturing_template';

export type DestinationType = 'http' | 'file' | 'webhook' | 'mqtt';

export type MappingType = 'sku' | 'location' | 'equipment' | 'robot' | 'custom';

export type AuditAction =
  | 'login'
  | 'logout'
  | 'user.created'
  | 'user.updated'
  | 'user.deleted'
  | 'user.deactivated'
  | 'api_key.created'
  | 'api_key.revoked'
  | 'api_key.rotated'
  | 'connector.created'
  | 'connector.updated'
  | 'connector.enabled'
  | 'connector.disabled'
  | 'connector.deleted'
  | 'destination.created'
  | 'destination.updated'
  | 'destination.enabled'
  | 'destination.disabled'
  | 'destination.deleted'
  | 'event.reprocessed'
  | 'delivery.retried'
  | 'mapping.created'
  | 'mapping.updated'
  | 'mapping.deleted'
  | 'source_system.created'
  | 'source_system.updated';

export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function paginate<T>(
  items: T[],
  total: number,
  page: number,
  limit: number,
): PaginatedResult<T> {
  return {
    data: items,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
