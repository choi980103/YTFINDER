export function generateCustomerKey(): string {
  return `cust_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateOrderId(): string {
  return `ord_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function nowMs(): number {
  return Date.now();
}
