export interface QuantityRange {
    min: number;
    max: number;
    preferred: number;
}

export interface Requirements {
    mandatory: string[];
    optional: string[];
}

export interface OrderObject {
    item: string;
    quantity: QuantityRange;
    budget: number;
    currency: string;
    requirements: Requirements;
    urgency: string;
}
