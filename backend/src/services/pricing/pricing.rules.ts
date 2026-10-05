import { IService, IServiceOptionRule, IPricingBreakdownItem } from '../../models/Service';
import { IPricingSnapshot, IWorkRequestItem } from '../../models/WorkRequest';
import { Types } from 'mongoose';

export interface PricingCalculationResult {
  serviceId: string;
  serviceName: { en: string; ta: string };
  pricingVersion: number;
  baseAmount: number;
  additionalAmount: number;
  totalAmount: number;
  currency: string;
  breakdown: IPricingBreakdownItem[];
  selectedOptions: Record<string, any>;
  quantity: number;
  items?: IWorkRequestItem[];
}

export interface MultiItemCalculationResult {
  items: IWorkRequestItem[];
  totalAmount: number;
  breakdown: IPricingBreakdownItem[];
  currency: string;
}

export class PricingEngine {
  /**
   * Calculates dynamic price for a single option rule based on user input value.
   * e.g., PER_MONAI (12 monai * ₹6 = ₹72), PER_INCH (8 inches * ₹100 = ₹800), PER_SET (2 sets * ₹180 = ₹360), FIXED_AMOUNT (₹1500)
   */
  public static calculateItem(
    service: IService,
    optionKey: string,
    rawInputValue: number = 1
  ): IWorkRequestItem {
    if (!service.active) {
      throw new Error(`Service "${service.name.en}" is currently inactive.`);
    }

    const optionRule = service.options?.find((opt) => opt.optionKey === optionKey && opt.active !== false);
    
    if (!optionRule) {
      // If service has no specific option rules, check if it's a fixed service with pricingConfig
      if (service.pricingConfig && service.pricingConfig.basePrice > 0) {
        const qty = Math.max(1, Number(rawInputValue) || 1);
        const subtotal = service.pricingConfig.basePrice * qty;
        return {
          serviceId: service._id as Types.ObjectId,
          serviceCode: service.code,
          serviceName: service.name,
          optionKey: 'DEFAULT',
          optionName: service.name,
          pricingModel: 'FIXED_AMOUNT',
          unit: 'FIXED',
          rate: service.pricingConfig.basePrice,
          inputValue: qty,
          subtotal,
          pricingVersion: service.version || 1
        };
      }
      throw new Error(`Invalid or inactive option "${optionKey}" selected for service "${service.name.en}".`);
    }

    const inputValue = Math.max(0, Number(rawInputValue) || 0);

    // Validate min / max quantity constraints
    if (optionRule.minQuantity !== undefined && inputValue < optionRule.minQuantity) {
      throw new Error(
        `Quantity/Measurement for "${optionRule.name.en}" must be at least ${optionRule.minQuantity} ${optionRule.unit}.`
      );
    }
    if (optionRule.maxQuantity !== undefined && inputValue > optionRule.maxQuantity) {
      throw new Error(
        `Quantity/Measurement for "${optionRule.name.en}" cannot exceed ${optionRule.maxQuantity} ${optionRule.unit}.`
      );
    }

    let subtotal = 0;
    switch (optionRule.pricingModel) {
      case 'PER_MONAI':
      case 'PER_SET':
      case 'PER_INCH':
        subtotal = Math.round(optionRule.rate * inputValue * 100) / 100;
        break;
      case 'FIXED_AMOUNT':
      default:
        // If fixed, inputValue is usually 1 (or number of instances)
        const instances = inputValue > 0 ? inputValue : 1;
        subtotal = Math.round(optionRule.rate * instances * 100) / 100;
        break;
    }

    return {
      serviceId: service._id as Types.ObjectId,
      serviceCode: service.code,
      serviceName: service.name,
      optionKey: optionRule.optionKey,
      optionName: optionRule.name,
      pricingModel: optionRule.pricingModel,
      unit: optionRule.unit || 'UNIT',
      rate: optionRule.rate,
      inputValue: optionRule.pricingModel === 'FIXED_AMOUNT' && inputValue === 0 ? 1 : inputValue,
      subtotal,
      pricingVersion: service.version || 1
    };
  }

  /**
   * Calculates pricing for multiple line items in a single work request.
   */
  public static calculateItems(
    itemList: Array<{ service: IService; optionKey: string; inputValue: number }>
  ): MultiItemCalculationResult {
    if (!itemList || itemList.length === 0) {
      throw new Error('At least one service line item must be selected.');
    }

    const calculatedItems: IWorkRequestItem[] = [];
    const breakdown: IPricingBreakdownItem[] = [];
    let totalAmount = 0;

    for (const item of itemList) {
      const calculatedItem = this.calculateItem(item.service, item.optionKey, item.inputValue);
      calculatedItems.push(calculatedItem);
      totalAmount += calculatedItem.subtotal;

      const unitDisplay = calculatedItem.unit ? ` ${calculatedItem.unit}` : '';
      const inputStr = calculatedItem.pricingModel === 'FIXED_AMOUNT' && calculatedItem.inputValue === 1
        ? ''
        : ` (${calculatedItem.inputValue}${unitDisplay} @ ₹${calculatedItem.rate}/${calculatedItem.unit})`;

      breakdown.push({
        label: {
          en: `${calculatedItem.serviceName.en} - ${calculatedItem.optionName.en}${inputStr}`,
          ta: `${calculatedItem.serviceName.ta} - ${calculatedItem.optionName.ta}${inputStr}`
        },
        amount: calculatedItem.subtotal
      });
    }

    return {
      items: calculatedItems,
      totalAmount: Math.round(totalAmount * 100) / 100,
      breakdown,
      currency: 'INR'
    };
  }

  /**
   * Calculates the deterministic fixed price for a service given selected options and quantity.
   * Preserved for backward compatibility with legacy custom forms and matrix rules.
   */
  public static calculate(
    service: IService,
    selectedOptions: Record<string, any> = {},
    quantity: number = 1
  ): PricingCalculationResult {
    if (!service.active) {
      throw new Error(`Service "${service.name.en}" is currently inactive.`);
    }

    // If service has modern options and selectedOptions contains optionKey and inputValue, use modern rule
    if (selectedOptions && selectedOptions.optionKey && service.options && service.options.length > 0) {
      const optionKey = selectedOptions.optionKey;
      const inputValue = selectedOptions.inputValue !== undefined ? Number(selectedOptions.inputValue) : quantity;
      const item = this.calculateItem(service, optionKey, inputValue);
      return {
        serviceId: service._id.toString(),
        serviceName: service.name,
        pricingVersion: service.version || 1,
        baseAmount: item.subtotal,
        additionalAmount: 0,
        totalAmount: item.subtotal,
        currency: 'INR',
        breakdown: [
          {
            label: {
              en: `${item.serviceName.en} - ${item.optionName.en} (${item.inputValue} ${item.unit} @ ₹${item.rate}/${item.unit})`,
              ta: `${item.serviceName.ta} - ${item.optionName.ta} (${item.inputValue} ${item.unit} @ ₹${item.rate}/${item.unit})`
            },
            amount: item.subtotal
          }
        ],
        selectedOptions,
        quantity: item.inputValue,
        items: [item]
      };
    }

    const qty = Math.max(1, Number(quantity) || 1);
    const breakdown: IPricingBreakdownItem[] = [];

    // 1. Validate required fields from service definition
    for (const field of service.fieldDefinitions || []) {
      const val = selectedOptions[field.fieldKey];
      if (field.required && (val === undefined || val === null || val === '')) {
        throw new Error(`Missing required option: "${field.label.en}".`);
      }

      // If options list exists, ensure selected value is one of the valid options
      if (field.options && field.options.length > 0 && val !== undefined && val !== null && val !== '') {
        const optionExists = field.options.some((opt) => String(opt.key) === String(val));
        if (!optionExists) {
          throw new Error(
            `Invalid option value "${val}" selected for "${field.label.en}".`
          );
        }
      }
    }

    let baseAmount = 0;
    let additionalAmount = 0;

    const pricingConfig = service.pricingConfig || {
      basePrice: 0,
      pricingType: 'PER_LOOM',
      optionAddons: [],
      matrixRules: []
    };

    // 2. Check if a Matrix Rule matches
    let matchedMatrixRule = false;
    if (pricingConfig.matrixRules && pricingConfig.matrixRules.length > 0) {
      for (const rule of pricingConfig.matrixRules) {
        let isMatch = true;
        const conditions = rule.conditions instanceof Map
          ? Object.fromEntries(rule.conditions)
          : rule.conditions;

        for (const [condKey, condVal] of Object.entries(conditions || {})) {
          if (String(selectedOptions[condKey]) !== String(condVal)) {
            isMatch = false;
            break;
          }
        }

        if (isMatch) {
          baseAmount = rule.price * qty;
          matchedMatrixRule = true;
          breakdown.push({
            label: rule.description || {
              en: `Base Setup (${service.name.en})`,
              ta: `அடிப்படை அமைப்பு (${service.name.ta})`
            },
            amount: baseAmount
          });
          break;
        }
      }
    }

    // If no matrix rule matched, fallback to basePrice
    if (!matchedMatrixRule) {
      if (pricingConfig.pricingType === 'PER_LOOM') {
        baseAmount = pricingConfig.basePrice * qty;
      } else {
        baseAmount = pricingConfig.basePrice;
      }

      breakdown.push({
        label: {
          en: `Base Service Charge (${service.name.en})`,
          ta: `அடிப்படை சேவைக் கட்டணம் (${service.name.ta})`
        },
        amount: baseAmount
      });
    }

    // 3. Process Option Add-ons
    for (const addon of pricingConfig.optionAddons || []) {
      const selectedVal = selectedOptions[addon.fieldKey];
      if (selectedVal !== undefined && String(selectedVal) === String(addon.optionKey)) {
        const addonAmount = addon.additionalAmount * (pricingConfig.pricingType === 'PER_LOOM' ? qty : 1);
        additionalAmount += addonAmount;

        breakdown.push({
          label: addon.label || {
            en: `Option Add-on: ${addon.fieldKey} (${addon.optionKey})`,
            ta: `கூடுதல் தேர்வு: ${addon.fieldKey} (${addon.optionKey})`
          },
          amount: addonAmount
        });
      }
    }

    // 4. Process FieldOption additional prices if defined directly on field options
    for (const field of service.fieldDefinitions || []) {
      const selectedVal = selectedOptions[field.fieldKey];
      if (selectedVal !== undefined && field.options) {
        const matchingOpt = field.options.find((opt) => String(opt.key) === String(selectedVal));
        if (matchingOpt && matchingOpt.additionalPrice && matchingOpt.additionalPrice > 0) {
          const optAddon = matchingOpt.additionalPrice * (pricingConfig.pricingType === 'PER_LOOM' ? qty : 1);
          additionalAmount += optAddon;
          breakdown.push({
            label: {
              en: `${field.label.en}: ${matchingOpt.label.en}`,
              ta: `${field.label.ta}: ${matchingOpt.label.ta}`
            },
            amount: optAddon
          });
        }
      }
    }

    const totalAmount = baseAmount + additionalAmount;

    return {
      serviceId: service._id.toString(),
      serviceName: service.name,
      pricingVersion: service.version || 1,
      baseAmount,
      additionalAmount,
      totalAmount,
      currency: 'INR',
      breakdown,
      selectedOptions,
      quantity: qty
    };
  }

  /**
   * Formats a calculation result into an immutable pricing snapshot for WorkRequest / Job.
   */
  public static createSnapshot(result: PricingCalculationResult | MultiItemCalculationResult): IPricingSnapshot {
    if ('items' in result && result.items && result.items.length > 0) {
      const firstItem = result.items[0];
      const serviceNameSnapshot = result.items.length === 1
        ? firstItem.serviceName
        : {
            en: `${result.items.length} Jacquard Services`,
            ta: `${result.items.length} ஜாக்கார்ட் சேவைகள்`
          };

      return {
        serviceNameSnapshot,
        selectedOptionsSnapshot: { items: result.items },
        pricingVersion: firstItem.pricingVersion || 1,
        baseAmount: result.totalAmount,
        additionalAmount: 0,
        totalAmount: result.totalAmount,
        currency: result.currency || 'INR',
        breakdown: result.breakdown,
        calculatedAt: new Date()
      };
    }

    const singleResult = result as PricingCalculationResult;
    return {
      serviceNameSnapshot: singleResult.serviceName,
      selectedOptionsSnapshot: singleResult.selectedOptions,
      pricingVersion: singleResult.pricingVersion,
      baseAmount: singleResult.baseAmount,
      additionalAmount: singleResult.additionalAmount,
      totalAmount: singleResult.totalAmount,
      currency: singleResult.currency,
      breakdown: singleResult.breakdown,
      calculatedAt: new Date()
    };
  }
}

