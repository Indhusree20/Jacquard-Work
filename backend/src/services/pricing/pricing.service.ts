import { Service } from '../../models/Service';
import { PricingEngine, PricingCalculationResult, MultiItemCalculationResult } from './pricing.rules';
import { IPricingSnapshot, IWorkRequestItem } from '../../models/WorkRequest';

export interface RequestItemInput {
  serviceId: string;
  optionKey: string;
  inputValue: number;
}

export class PricingService {
  /**
   * Retrieves active service and calculates deterministic price from options.
   */
  public static async calculatePrice(
    serviceId: string,
    selectedOptions: Record<string, any> = {},
    quantity: number = 1
  ): Promise<PricingCalculationResult> {
    const service = await Service.findById(serviceId);
    if (!service) {
      throw new Error('Service not found in catalogue.');
    }

    return PricingEngine.calculate(service, selectedOptions, quantity);
  }

  /**
   * Calculates pricing for an array of input items (multi-service line items).
   */
  public static async calculateItems(
    rawItems: RequestItemInput[]
  ): Promise<MultiItemCalculationResult> {
    if (!rawItems || rawItems.length === 0) {
      throw new Error('At least one service item is required.');
    }

    const itemsWithServices = await Promise.all(
      rawItems.map(async (item) => {
        const service = await Service.findById(item.serviceId);
        if (!service) {
          throw new Error(`Service with ID ${item.serviceId} was not found in catalogue.`);
        }
        return {
          service,
          optionKey: item.optionKey,
          inputValue: item.inputValue
        };
      })
    );

    return PricingEngine.calculateItems(itemsWithServices);
  }

  /**
   * Retrieves active service, calculates price, and returns an immutable snapshot object.
   */
  public static async generateSnapshot(
    serviceId: string,
    selectedOptions: Record<string, any> = {},
    quantity: number = 1
  ): Promise<IPricingSnapshot> {
    const result = await PricingService.calculatePrice(serviceId, selectedOptions, quantity);
    return PricingEngine.createSnapshot(result);
  }

  /**
   * Calculates multi-item price and generates an immutable snapshot.
   */
  public static async generateMultiItemSnapshot(
    rawItems: RequestItemInput[]
  ): Promise<{ snapshot: IPricingSnapshot; items: IWorkRequestItem[]; totalAmount: number }> {
    const result = await PricingService.calculateItems(rawItems);
    const snapshot = PricingEngine.createSnapshot(result);
    return {
      snapshot,
      items: result.items,
      totalAmount: result.totalAmount
    };
  }
}

