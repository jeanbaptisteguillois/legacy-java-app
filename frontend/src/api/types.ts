/** Domain models, shaped exactly as the /api endpoints return them. */

export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string;
  unitPrice: number;
  quantityOnHand: number;
  reorderThreshold: number;
  /** Server-computed flag used by the product list row highlight. */
  lowStock?: boolean;
}

/** Blank product the "new product" form starts from. */
export type ProductDraft = Omit<Product, 'id' | 'lowStock'> & { id?: number };

export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  shippingAddress: string;
}

export type CustomerDraft = Omit<Customer, 'id'> & { id?: number };

export interface OrderLineItem {
  id: number;
  productId: number;
  sku: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

export type OrderStatus = 'NEW' | 'CONFIRMED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED';

export interface Order {
  id: number;
  customer: Customer;
  orderDate: string;
  status: OrderStatus;
  totalAmount: number;
  lineItems: OrderLineItem[];
}

export interface OrderRequestLineItem {
  productId: number | null;
  quantity: number;
}

export interface OrderRequest {
  customerId: number | null;
  lineItems: OrderRequestLineItem[];
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  order: Order;
  issueDate: string;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paymentStatus: 'PENDING' | 'PAID';
  paidDate?: string | null;
}

export interface Notification {
  id: number;
  sentDate: string;
  channel: string;
  recipient: string;
  subject: string;
  successful: boolean;
}

export interface SalesSummary {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  pendingInvoices: number;
}

export interface LowStockAlert {
  productId: number;
  sku: string;
  productName: string;
  quantityOnHand: number;
  reorderThreshold: number;
}
