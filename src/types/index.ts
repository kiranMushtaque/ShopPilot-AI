/**
 * Shared Type Definitions for ShopPilot AI
 */

export type UserRole = 'ADMIN' | 'SUPPORT' | 'CUSTOMER';

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED';

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Store {
  id: string;
  name: string;
  slug: string;
  currency: string;
  createdAt: string;
  updatedAt: string;
}

export interface User {
  id: string;
  storeId: string;
  email: string;
  name: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSession {
  userId: string;
  storeId: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface Category {
  id: string;
  storeId: string;
  name: string;
  slug: string;
  description?: string;
  parentId?: string;
  icon?: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  title: string;
  pricePkr: number;
  stockQuantity: number;
  attributes: Record<string, string>;
  createdAt: string;
}

export interface Product {
  id: string;
  storeId: string;
  categoryId?: string;
  categoryName?: string;
  name: string;
  slug: string;
  brand: string;
  description: string;
  specifications: Record<string, string>;
  pricePkr: number;
  compareAtPricePkr?: number;
  stockQuantity: number;
  isActive: boolean;
  rating: number;
  reviewsCount: number;
  imageUrl: string;
  variants?: ProductVariant[];
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string;
  product: Product;
  variant?: ProductVariant;
  quantity: number;
  unitPricePkr: number; // Server-authoritative
  totalPricePkr: number;
  createdAt: string;
}

export interface Cart {
  id: string;
  storeId: string;
  userId?: string;
  sessionToken: string;
  items: CartItem[];
  itemCount: number;
  subtotalPkr: number;
  shippingPkr: number;
  totalPkr: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShippingAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine: string;
  city: string;
  province?: string;
  postalCode?: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  variantId?: string;
  productName: string;
  productImage?: string;
  unitPricePkr: number;
  quantity: number;
  totalPricePkr: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  storeId: string;
  userId?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotalPkr: number;
  shippingPkr: number;
  totalAmountPkr: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentStatus: string;
  trackingCode?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeDocument {
  id: string;
  storeId: string;
  title: string;
  category: 'FAQ' | 'SHIPPING' | 'RETURN' | 'WARRANTY' | 'POLICY';
  rawContent: string;
  createdAt: string;
  updatedAt: string;
}

export interface KnowledgeChunk {
  id: string;
  documentId: string;
  storeId: string;
  chunkIndex: number;
  chunkText: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  storeId: string;
  conversationId?: string;
  userId?: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  subject: string;
  reason: string;
  status: TicketStatus;
  priority: TicketPriority;
  transcriptSnippet?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLog {
  id: string;
  storeId: string;
  actorId?: string;
  actorType: 'ADMIN' | 'SUPPORT' | 'CUSTOMER' | 'AI_AGENT' | 'SYSTEM';
  actorName?: string;
  action: string;
  entityType: 'ORDER' | 'PRODUCT' | 'INVENTORY' | 'TICKET' | 'CONVERSATION' | 'AUTH';
  entityId: string;
  oldState?: Record<string, unknown>;
  newState?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'USER' | 'AGENT' | 'HUMAN_SUPPORT' | 'SYSTEM';
  content: string;
  suggestedProducts?: Product[];
  toolCalls?: Array<{
    name: string;
    args: Record<string, unknown>;
    status: 'PENDING' | 'SUCCESS' | 'FAILED';
    result?: unknown;
  }>;
  createdAt: string;
}

export interface Conversation {
  id: string;
  storeId: string;
  userId?: string;
  sessionToken: string;
  status: 'ACTIVE' | 'HUMAN_REQUIRED' | 'RESOLVED';
  customerName?: string;
  metadata: {
    budget?: number;
    preferredCategory?: string;
    preferredBrand?: string;
    lastViewedProductIds?: string[];
    language?: 'en' | 'ur' | 'roman_ur';
  };
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
}

export interface HealthCheckResponse {
  status: 'ok' | 'degraded' | 'error';
  timestamp: string;
  uptimeSeconds: number;
  environment: string;
  database: 'connected' | 'in_memory_fallback';
  app: {
    name: string;
    version: string;
    aiProvider: string;
    model: string;
    ollamaStatus: 'online' | 'fallback_mode';
  };
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}
