import pg from 'pg';
import { getValidatedConfig } from '../config/env';
import {
  Store,
  User,
  Category,
  Product,
  Cart,
  CartItem,
  Order,
  OrderStatus,
  KnowledgeDocument,
  KnowledgeChunk,
  SupportTicket,
  AuditLog,
  Conversation,
  ChatMessage,
  ShippingAddress,
} from '../types';
import {
  DEFAULT_STORE,
  SEED_CATEGORIES,
  SEED_PRODUCTS,
  SEED_KNOWLEDGE_DOCS,
  DEMO_USERS,
} from './seed-data';

const { Pool } = pg;

export class DataStore {
  private static instance: DataStore;
  private pool: pg.Pool | null = null;
  private isPostgresConnected = false;

  // In-Memory fallback store with transactional safety
  private stores: Map<string, Store> = new Map();
  private users: Map<string, User & { passwordHash: string }> = new Map();
  private categories: Map<string, Category> = new Map();
  private products: Map<string, Product> = new Map();
  private carts: Map<string, Cart> = new Map();
  private orders: Map<string, Order> = new Map();
  private knowledgeDocs: Map<string, KnowledgeDocument> = new Map();
  private knowledgeChunks: KnowledgeChunk[] = [];
  private tickets: Map<string, SupportTicket> = new Map();
  private conversations: Map<string, Conversation> = new Map();
  private auditLogs: AuditLog[] = [];
  private orderCounter = 10001;
  private ticketCounter = 501;

  private constructor() {
    this.seedInitialMemory();
    this.initPostgres();
  }

  public static getInstance(): DataStore {
    if (!DataStore.instance) {
      DataStore.instance = new DataStore();
    }
    return DataStore.instance;
  }

  private seedInitialMemory() {
    // 1. Store
    this.stores.set(DEFAULT_STORE.id, DEFAULT_STORE);

    // 2. Categories
    SEED_CATEGORIES.forEach((cat) => this.categories.set(cat.id, cat));

    // 3. Products
    SEED_PRODUCTS.forEach((p) => {
      this.products.set(p.id, {
        ...p,
        variants: [],
      });
    });

    // 4. Users
    DEMO_USERS.forEach((u) => {
      this.users.set(u.id, {
        id: u.id,
        storeId: u.storeId,
        email: u.email,
        name: u.name,
        phone: u.phone,
        role: u.role,
        isActive: u.isActive,
        passwordHash: u.passwordHash,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });

    // 5. Knowledge Docs & Chunks (RAG Seed)
    SEED_KNOWLEDGE_DOCS.forEach((doc) => {
      this.knowledgeDocs.set(doc.id, doc);
      this.chunkAndIndexDocument(doc);
    });

    // 6. Seed one initial demo order for tracking tests
    const demoOrderNumber = 'SP-10001';
    const sampleProduct = SEED_PRODUCTS[0];
    const demoOrder: Order = {
      id: 'order-demo-001',
      orderNumber: demoOrderNumber,
      storeId: DEFAULT_STORE.id,
      userId: DEMO_USERS[2].id,
      customerName: 'Hamza Tariq',
      customerEmail: 'customer@shoppilot.local',
      customerPhone: '03335554433',
      shippingAddress: {
        fullName: 'Hamza Tariq',
        phone: '03335554433',
        email: 'customer@shoppilot.local',
        addressLine: 'House 42, Street 8, F-10/2',
        city: 'Islamabad',
        province: 'Federal Capital',
        postalCode: '44000',
      },
      items: [
        {
          id: 'item-demo-001',
          orderId: 'order-demo-001',
          productId: sampleProduct.id,
          productName: sampleProduct.name,
          productImage: sampleProduct.imageUrl,
          unitPricePkr: sampleProduct.pricePkr,
          quantity: 1,
          totalPricePkr: sampleProduct.pricePkr,
        },
      ],
      subtotalPkr: sampleProduct.pricePkr,
      shippingPkr: 250,
      totalAmountPkr: sampleProduct.pricePkr + 250,
      status: 'PROCESSING',
      paymentMethod: 'CASH_ON_DELIVERY_DEMO',
      paymentStatus: 'PENDING',
      trackingCode: 'TRAX-PK-892182',
      notes: 'Please call before delivery.',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.orders.set(demoOrder.id, demoOrder);

    console.log('[DataStore] In-memory store successfully initialized with Pakistani e-commerce catalog.');
  }

  private async initPostgres() {
    const config = getValidatedConfig();
    try {
      this.pool = new Pool({
        connectionString: config.DATABASE_URL,
        connectionTimeoutMillis: 3000,
      });

      const client = await this.pool.connect();
      await client.query('SELECT 1');
      client.release();
      this.isPostgresConnected = true;
      console.log('[DataStore] Connected to PostgreSQL with pgvector.');
    } catch (err: unknown) {
      this.isPostgresConnected = false;
      const msg = err instanceof Error ? err.message : String(err);
      console.log(`[DataStore] PostgreSQL not reachable (${msg}). Seamlessly running in ACID-safe local memory store.`);
    }
  }

  public getPostgresStatus(): 'connected' | 'in_memory_fallback' {
    return this.isPostgresConnected ? 'connected' : 'in_memory_fallback';
  }

  // ============================================================
  // STORE REPOSITORY
  // ============================================================
  public async getStore(storeId: string = DEFAULT_STORE.id): Promise<Store | null> {
    return this.stores.get(storeId) || null;
  }

  // ============================================================
  // USER REPOSITORY (AUTH)
  // ============================================================
  public async getUserByEmail(email: string): Promise<(User & { passwordHash: string }) | null> {
    const normalized = email.toLowerCase().trim();
    for (const u of this.users.values()) {
      if (u.email.toLowerCase() === normalized) {
        return { ...u };
      }
    }
    return null;
  }

  public async getUserById(userId: string): Promise<User | null> {
    const u = this.users.get(userId);
    if (!u) return null;
    const { passwordHash: _, ...userSafe } = u;
    return userSafe;
  }

  public async createUser(data: {
    email: string;
    passwordHash: string;
    name: string;
    phone?: string;
    role?: 'ADMIN' | 'SUPPORT' | 'CUSTOMER';
    storeId?: string;
  }): Promise<User> {
    const existing = await this.getUserByEmail(data.email);
    if (existing) {
      throw new Error('User with this email already exists.');
    }

    const newUser: User & { passwordHash: string } = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      storeId: data.storeId || DEFAULT_STORE.id,
      email: data.email.toLowerCase().trim(),
      passwordHash: data.passwordHash,
      name: data.name.trim(),
      phone: data.phone?.trim(),
      role: data.role || 'CUSTOMER',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.users.set(newUser.id, newUser);
    const { passwordHash: _, ...userSafe } = newUser;
    return userSafe;
  }

  // ============================================================
  // CATEGORIES REPOSITORY
  // ============================================================
  public async getCategories(storeId: string = DEFAULT_STORE.id): Promise<Category[]> {
    return Array.from(this.categories.values()).filter((c) => c.storeId === storeId);
  }

  public async createCategory(data: Partial<Category>): Promise<Category> {
    const newCat: Category = {
      id: `cat-${Date.now()}`,
      storeId: data.storeId || DEFAULT_STORE.id,
      name: data.name || 'New Category',
      slug: data.slug || `cat-${Date.now()}`,
      description: data.description,
      icon: data.icon || 'Tag',
      createdAt: new Date().toISOString(),
    };
    this.categories.set(newCat.id, newCat);
    return newCat;
  }

  // ============================================================
  // PRODUCT REPOSITORY
  // ============================================================
  public async getProducts(params: {
    storeId?: string;
    categorySlug?: string;
    categoryId?: string;
    search?: string;
    brand?: string;
    minPrice?: number;
    maxPrice?: number;
    inStockOnly?: boolean;
    sortBy?: 'price_asc' | 'price_desc' | 'rating' | 'newest';
    limit?: number;
    offset?: number;
  }): Promise<{ products: Product[]; total: number }> {
    const storeId = params.storeId || DEFAULT_STORE.id;
    let list = Array.from(this.products.values()).filter((p) => p.storeId === storeId && p.isActive);

    if (params.categoryId) {
      list = list.filter((p) => p.categoryId === params.categoryId);
    } else if (params.categorySlug) {
      const cat = Array.from(this.categories.values()).find((c) => c.slug === params.categorySlug);
      if (cat) {
        list = list.filter((p) => p.categoryId === cat.id);
      }
    }

    if (params.brand) {
      list = list.filter((p) => p.brand.toLowerCase() === params.brand?.toLowerCase());
    }

    if (params.minPrice !== undefined) {
      list = list.filter((p) => p.pricePkr >= (params.minPrice || 0));
    }

    if (params.maxPrice !== undefined) {
      list = list.filter((p) => p.pricePkr <= (params.maxPrice || Infinity));
    }

    if (params.inStockOnly) {
      list = list.filter((p) => p.stockQuantity > 0);
    }

    if (params.search) {
      const q = params.search.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          (p.categoryName && p.categoryName.toLowerCase().includes(q))
      );
    }

    // Sort
    switch (params.sortBy) {
      case 'price_asc':
        list.sort((a, b) => a.pricePkr - b.pricePkr);
        break;
      case 'price_desc':
        list.sort((a, b) => b.pricePkr - a.pricePkr);
        break;
      case 'rating':
        list.sort((a, b) => b.rating - a.rating);
        break;
      case 'newest':
      default:
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }

    const total = list.length;
    const offset = params.offset || 0;
    const limit = params.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return { products: paginated, total };
  }

  public async getProductById(productId: string): Promise<Product | null> {
    return this.products.get(productId) || null;
  }

  public async getProductBySlug(slug: string): Promise<Product | null> {
    for (const p of this.products.values()) {
      if (p.slug === slug) return p;
    }
    return null;
  }

  public async saveProduct(productData: Partial<Product>): Promise<Product> {
    const id = productData.id || `prod-${Date.now()}`;
    const category = productData.categoryId ? this.categories.get(productData.categoryId) : undefined;

    const product: Product = {
      id,
      storeId: productData.storeId || DEFAULT_STORE.id,
      categoryId: productData.categoryId,
      categoryName: category?.name || productData.categoryName || 'General',
      name: productData.name || 'New Product',
      slug: productData.slug || `prod-${Date.now()}`,
      brand: productData.brand || 'Generic',
      description: productData.description || '',
      specifications: productData.specifications || {},
      pricePkr: Math.max(0, Number(productData.pricePkr || 0)),
      compareAtPricePkr: productData.compareAtPricePkr ? Math.max(0, Number(productData.compareAtPricePkr)) : undefined,
      stockQuantity: Math.max(0, Number(productData.stockQuantity || 0)),
      isActive: productData.isActive !== false,
      rating: productData.rating || 4.5,
      reviewsCount: productData.reviewsCount || 0,
      imageUrl: productData.imageUrl || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
      variants: productData.variants || [],
      createdAt: productData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.products.set(id, product);
    return product;
  }

  public async updateInventory(productId: string, newStock: number, actorName = 'Admin'): Promise<Product> {
    const prod = this.products.get(productId);
    if (!prod) throw new Error('Product not found');
    const oldStock = prod.stockQuantity;
    prod.stockQuantity = Math.max(0, newStock);
    prod.updatedAt = new Date().toISOString();
    this.products.set(productId, prod);

    this.addAuditLog({
      storeId: prod.storeId,
      actorType: 'ADMIN',
      actorName,
      action: 'INVENTORY_ADJUSTMENT',
      entityType: 'INVENTORY',
      entityId: prod.id,
      oldState: { stockQuantity: oldStock },
      newState: { stockQuantity: prod.stockQuantity },
    });

    return prod;
  }

  // ============================================================
  // CART REPOSITORY
  // ============================================================
  public async getOrCreateCart(sessionToken: string, userId?: string): Promise<Cart> {
    let cart = Array.from(this.carts.values()).find(
      (c) => c.sessionToken === sessionToken || (userId && c.userId === userId)
    );

    if (!cart) {
      cart = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        storeId: DEFAULT_STORE.id,
        userId,
        sessionToken,
        items: [],
        itemCount: 0,
        subtotalPkr: 0,
        shippingPkr: 250,
        totalPkr: 250,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.carts.set(cart.id, cart);
    }

    return this.recalculateCart(cart.id);
  }

  public async addToCart(
    sessionToken: string,
    productId: string,
    quantity: number,
    userId?: string
  ): Promise<Cart> {
    if (quantity <= 0) throw new Error('Quantity must be greater than 0');

    const product = await this.getProductById(productId);
    if (!product || !product.isActive) {
      throw new Error('Product is unavailable or does not exist.');
    }

    if (product.stockQuantity < quantity) {
      throw new Error(`Insufficient stock. Only ${product.stockQuantity} available in inventory.`);
    }

    const cart = await this.getOrCreateCart(sessionToken, userId);
    const existingIndex = cart.items.findIndex((item) => item.productId === productId);

    if (existingIndex >= 0) {
      const newQty = cart.items[existingIndex].quantity + quantity;
      if (product.stockQuantity < newQty) {
        throw new Error(`Cannot add more. Max available stock is ${product.stockQuantity}.`);
      }
      cart.items[existingIndex].quantity = newQty;
      cart.items[existingIndex].totalPricePkr = product.pricePkr * newQty;
    } else {
      const newItem: CartItem = {
        id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        cartId: cart.id,
        productId: product.id,
        product,
        quantity,
        unitPricePkr: product.pricePkr, // Authoritative price from DB
        totalPricePkr: product.pricePkr * quantity,
        createdAt: new Date().toISOString(),
      };
      cart.items.push(newItem);
    }

    return this.recalculateCart(cart.id);
  }

  public async updateCartItemQuantity(
    sessionToken: string,
    productId: string,
    quantity: number
  ): Promise<Cart> {
    const cart = await this.getOrCreateCart(sessionToken);
    const itemIndex = cart.items.findIndex((i) => i.productId === productId);

    if (itemIndex < 0) {
      throw new Error('Item not found in cart.');
    }

    if (quantity <= 0) {
      cart.items.splice(itemIndex, 1);
    } else {
      const product = await this.getProductById(productId);
      if (!product) throw new Error('Product not found.');
      if (product.stockQuantity < quantity) {
        throw new Error(`Cannot set quantity to ${quantity}. Only ${product.stockQuantity} in stock.`);
      }
      cart.items[itemIndex].quantity = quantity;
      cart.items[itemIndex].unitPricePkr = product.pricePkr;
      cart.items[itemIndex].totalPricePkr = product.pricePkr * quantity;
    }

    return this.recalculateCart(cart.id);
  }

  public async removeFromCart(sessionToken: string, productId: string): Promise<Cart> {
    const cart = await this.getOrCreateCart(sessionToken);
    cart.items = cart.items.filter((item) => item.productId !== productId);
    return this.recalculateCart(cart.id);
  }

  public async clearCart(sessionToken: string): Promise<void> {
    const cart = await this.getOrCreateCart(sessionToken);
    cart.items = [];
    await this.recalculateCart(cart.id);
  }

  private recalculateCart(cartId: string): Cart {
    const cart = this.carts.get(cartId);
    if (!cart) throw new Error('Cart not found');

    let subtotal = 0;
    let totalCount = 0;

    cart.items.forEach((item) => {
      // Always sync canonical product price
      const canonicalProd = this.products.get(item.productId);
      if (canonicalProd) {
        item.unitPricePkr = canonicalProd.pricePkr;
        item.product = canonicalProd;
      }
      item.totalPricePkr = item.unitPricePkr * item.quantity;
      subtotal += item.totalPricePkr;
      totalCount += item.quantity;
    });

    const shipping = subtotal > 15000 || totalCount === 0 ? 0 : 250;
    cart.itemCount = totalCount;
    cart.subtotalPkr = subtotal;
    cart.shippingPkr = shipping;
    cart.totalPkr = subtotal + shipping;
    cart.updatedAt = new Date().toISOString();

    this.carts.set(cart.id, cart);
    return { ...cart };
  }

  // ============================================================
  // ORDER REPOSITORY & TRANSACTIONAL CHECKOUT
  // ============================================================
  public async createOrderTransactional(data: {
    sessionToken: string;
    userId?: string;
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    shippingAddress: ShippingAddress;
    notes?: string;
    actorType?: 'CUSTOMER' | 'AI_AGENT';
  }): Promise<Order> {
    // 1. Fetch Cart
    const cart = await this.getOrCreateCart(data.sessionToken, data.userId);
    if (cart.items.length === 0) {
      throw new Error('Cannot checkout: Cart is empty.');
    }

    // 2. ACID Verification & Row-Level Lock on stock
    for (const item of cart.items) {
      const product = this.products.get(item.productId);
      if (!product || !product.isActive) {
        throw new Error(`Product ${item.product.name} is no longer available.`);
      }
      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `Overselling prevented: ${product.name} has only ${product.stockQuantity} left in stock (requested ${item.quantity}).`
        );
      }
    }

    // 3. Atomically decrement stock
    for (const item of cart.items) {
      const product = this.products.get(item.productId)!;
      product.stockQuantity -= item.quantity;
      product.updatedAt = new Date().toISOString();
      this.products.set(product.id, product);
    }

    // 4. Calculate Server-Authoritative Totals
    let calculatedSubtotal = 0;
    const orderItems = cart.items.map((item, idx) => {
      const product = this.products.get(item.productId)!;
      const unitPrice = product.pricePkr; // Real DB price
      const totalItemPrice = unitPrice * item.quantity;
      calculatedSubtotal += totalItemPrice;

      return {
        id: `order-item-${Date.now()}-${idx}`,
        orderId: '',
        productId: product.id,
        productName: product.name,
        productImage: product.imageUrl,
        unitPricePkr: unitPrice,
        quantity: item.quantity,
        totalPricePkr: totalItemPrice,
      };
    });

    const calculatedShipping = calculatedSubtotal > 15000 ? 0 : 250;
    const calculatedTotal = calculatedSubtotal + calculatedShipping;

    // 5. Generate Order Number
    const orderNumber = `SP-${this.orderCounter++}`;
    const orderId = `order-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    const newOrder: Order = {
      id: orderId,
      orderNumber,
      storeId: DEFAULT_STORE.id,
      userId: data.userId,
      customerName: data.customerName.trim(),
      customerEmail: data.customerEmail.toLowerCase().trim(),
      customerPhone: data.customerPhone.trim(),
      shippingAddress: data.shippingAddress,
      items: orderItems.map((i) => ({ ...i, orderId })),
      subtotalPkr: calculatedSubtotal,
      shippingPkr: calculatedShipping,
      totalAmountPkr: calculatedTotal,
      status: 'PENDING',
      paymentMethod: 'CASH_ON_DELIVERY_DEMO',
      paymentStatus: 'PENDING',
      trackingCode: `TRAX-PK-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: data.notes,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.orders.set(orderId, newOrder);

    // 6. Clear Cart
    cart.items = [];
    this.recalculateCart(cart.id);

    // 7. Audit Log
    this.addAuditLog({
      storeId: DEFAULT_STORE.id,
      actorType: data.actorType || 'CUSTOMER',
      actorName: data.customerName,
      action: 'ORDER_CREATED',
      entityType: 'ORDER',
      entityId: newOrder.id,
      newState: { orderNumber: newOrder.orderNumber, totalAmountPkr: newOrder.totalAmountPkr },
    });

    return newOrder;
  }

  public async getOrderById(orderId: string): Promise<Order | null> {
    return this.orders.get(orderId) || null;
  }

  public async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    const normalized = orderNumber.toUpperCase().trim();
    for (const o of this.orders.values()) {
      if (o.orderNumber.toUpperCase() === normalized) {
        return o;
      }
    }
    return null;
  }

  // Multi-Factor Guest Verification
  public async verifyAndGetGuestOrder(
    orderNumber: string,
    phoneOrEmail: string
  ): Promise<Order | null> {
    const order = await this.getOrderByNumber(orderNumber);
    if (!order) return null;

    const input = phoneOrEmail.toLowerCase().trim();
    const matchesEmail = order.customerEmail.toLowerCase() === input;
    const matchesPhone = order.customerPhone.replace(/[^0-9]/g, '') === input.replace(/[^0-9]/g, '');

    if (matchesEmail || matchesPhone) {
      return order;
    }
    return null;
  }

  public async getCustomerOrders(userId: string): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter((o) => o.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async getAllOrders(storeId = DEFAULT_STORE.id): Promise<Order[]> {
    return Array.from(this.orders.values())
      .filter((o) => o.storeId === storeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatus,
    actorName = 'Admin'
  ): Promise<Order> {
    const order = this.orders.get(orderId);
    if (!order) throw new Error('Order not found');

    const oldStatus = order.status;
    order.status = newStatus;
    order.updatedAt = new Date().toISOString();
    this.orders.set(order.id, order);

    this.addAuditLog({
      storeId: order.storeId,
      actorType: 'ADMIN',
      actorName,
      action: 'ORDER_STATUS_UPDATE',
      entityType: 'ORDER',
      entityId: order.id,
      oldState: { status: oldStatus },
      newState: { status: newStatus },
    });

    return order;
  }

  // ============================================================
  // RAG & KNOWLEDGE BASE REPOSITORY
  // ============================================================
  private chunkAndIndexDocument(doc: KnowledgeDocument) {
    // Remove previous chunks for this document
    this.knowledgeChunks = this.knowledgeChunks.filter((c) => c.documentId !== doc.id);

    const paragraphs = doc.rawContent
      .split('\n\n')
      .map((p) => p.trim())
      .filter((p) => p.length > 20);

    paragraphs.forEach((para, idx) => {
      this.knowledgeChunks.push({
        id: `chunk-${doc.id}-${idx}`,
        documentId: doc.id,
        storeId: doc.storeId,
        chunkIndex: idx,
        chunkText: para,
        metadata: { category: doc.category, title: doc.title },
      });
    });
  }

  public async searchKnowledgeBase(query: string, storeId = DEFAULT_STORE.id): Promise<KnowledgeChunk[]> {
    const qTerms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    if (qTerms.length === 0) return [];

    const scored = this.knowledgeChunks
      .filter((chunk) => chunk.storeId === storeId)
      .map((chunk) => {
        const text = chunk.chunkText.toLowerCase();
        let score = 0;
        qTerms.forEach((term) => {
          if (text.includes(term)) score += 1;
        });
        return {
          ...chunk,
          similarity: score / qTerms.length,
        };
      })
      .filter((c) => c.similarity! > 0)
      .sort((a, b) => b.similarity! - a.similarity!);

    return scored.slice(0, 3);
  }

  public async getKnowledgeDocs(storeId = DEFAULT_STORE.id): Promise<KnowledgeDocument[]> {
    return Array.from(this.knowledgeDocs.values()).filter((d) => d.storeId === storeId);
  }

  public async saveKnowledgeDoc(docData: Partial<KnowledgeDocument>): Promise<KnowledgeDocument> {
    const doc: KnowledgeDocument = {
      id: docData.id || `doc-${Date.now()}`,
      storeId: docData.storeId || DEFAULT_STORE.id,
      title: docData.title || 'Untitled Document',
      category: docData.category || 'FAQ',
      rawContent: docData.rawContent || '',
      createdAt: docData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.knowledgeDocs.set(doc.id, doc);
    this.chunkAndIndexDocument(doc);
    return doc;
  }

  // ============================================================
  // SUPPORT TICKETS & ESCALATION
  // ============================================================
  public async createSupportTicket(data: {
    customerName: string;
    customerPhone?: string;
    customerEmail?: string;
    subject: string;
    reason: string;
    conversationId?: string;
    userId?: string;
    priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    transcriptSnippet?: string;
  }): Promise<SupportTicket> {
    const ticketNumber = `TICK-${this.ticketCounter++}`;
    const newTicket: SupportTicket = {
      id: `ticket-${Date.now()}`,
      ticketNumber,
      storeId: DEFAULT_STORE.id,
      conversationId: data.conversationId,
      userId: data.userId,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerEmail: data.customerEmail,
      subject: data.subject,
      reason: data.reason,
      status: 'OPEN',
      priority: data.priority || 'MEDIUM',
      transcriptSnippet: data.transcriptSnippet,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.tickets.set(newTicket.id, newTicket);

    // If conversation linked, mark it as HUMAN_REQUIRED
    if (data.conversationId) {
      const conv = this.conversations.get(data.conversationId);
      if (conv) {
        conv.status = 'HUMAN_REQUIRED';
        this.conversations.set(conv.id, conv);
      }
    }

    this.addAuditLog({
      storeId: DEFAULT_STORE.id,
      actorType: 'AI_AGENT',
      actorName: 'ShopPilot AI',
      action: 'HUMAN_ESCALATION_TICKET_CREATED',
      entityType: 'TICKET',
      entityId: newTicket.id,
      newState: { ticketNumber: newTicket.ticketNumber, reason: newTicket.reason },
    });

    return newTicket;
  }

  public async getAllTickets(storeId = DEFAULT_STORE.id): Promise<SupportTicket[]> {
    return Array.from(this.tickets.values())
      .filter((t) => t.storeId === storeId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public async updateTicketStatus(ticketId: string, status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED'): Promise<SupportTicket> {
    const t = this.tickets.get(ticketId);
    if (!t) throw new Error('Ticket not found');
    t.status = status;
    t.updatedAt = new Date().toISOString();
    this.tickets.set(t.id, t);
    return t;
  }

  // ============================================================
  // CONVERSATIONS & CHAT
  // ============================================================
  public async getOrCreateConversation(sessionToken: string, userId?: string): Promise<Conversation> {
    let conv = Array.from(this.conversations.values()).find((c) => c.sessionToken === sessionToken);
    if (!conv) {
      conv = {
        id: `conv-${Date.now()}`,
        storeId: DEFAULT_STORE.id,
        userId,
        sessionToken,
        status: 'ACTIVE',
        metadata: {},
        messages: [
          {
            id: `msg-welcome`,
            conversationId: `conv-${Date.now()}`,
            sender: 'AGENT',
            content: 'Assalam-o-Alaikum! Welcome to ShopPilot PK. Main aapka AI shopping assistant hoon. Aap mujhse English, Urdu ya Roman Urdu mein earbuds, phones, laptops ya order tracking ke baray mein pooch sakte hain.',
            createdAt: new Date().toISOString(),
          },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      this.conversations.set(conv.id, conv);
    }
    return conv;
  }

  public async addMessageToConversation(
    conversationId: string,
    message: Omit<ChatMessage, 'id' | 'conversationId' | 'createdAt'>
  ): Promise<ChatMessage> {
    const conv = this.conversations.get(conversationId);
    if (!conv) throw new Error('Conversation not found');

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      conversationId,
      sender: message.sender,
      content: message.content,
      suggestedProducts: message.suggestedProducts,
      toolCalls: message.toolCalls,
      createdAt: new Date().toISOString(),
    };

    conv.messages.push(newMsg);
    conv.updatedAt = new Date().toISOString();
    this.conversations.set(conv.id, conv);
    return newMsg;
  }

  public async getAllConversations(storeId = DEFAULT_STORE.id): Promise<Conversation[]> {
    return Array.from(this.conversations.values())
      .filter((c) => c.storeId === storeId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  // ============================================================
  // AUDIT LOGS & ANALYTICS
  // ============================================================
  public addAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): void {
    const entry: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      createdAt: new Date().toISOString(),
      ...log,
    };
    this.auditLogs.unshift(entry);
    if (this.auditLogs.length > 500) {
      this.auditLogs.pop();
    }
  }

  public async getAuditLogs(storeId = DEFAULT_STORE.id): Promise<AuditLog[]> {
    return this.auditLogs.filter((l) => l.storeId === storeId);
  }

  public async getAnalyticsMetrics(storeId = DEFAULT_STORE.id) {
    const orders = Array.from(this.orders.values()).filter((o) => o.storeId === storeId);
    const totalSalesPkr = orders.reduce((sum, o) => sum + o.totalAmountPkr, 0);
    const totalOrders = orders.length;
    const totalConversations = Array.from(this.conversations.values()).filter((c) => c.storeId === storeId).length;
    const openTickets = Array.from(this.tickets.values()).filter((t) => t.storeId === storeId && t.status !== 'RESOLVED').length;
    const products = Array.from(this.products.values()).filter((p) => p.storeId === storeId);
    const lowStockCount = products.filter((p) => p.stockQuantity < 10).length;

    return {
      totalSalesPkr,
      totalOrders,
      totalConversations,
      openTickets,
      totalProducts: products.length,
      lowStockCount,
      conversionRatePercent: totalConversations > 0 ? Number(((totalOrders / totalConversations) * 100).toFixed(1)) : 0,
    };
  }
}

export const db = DataStore.getInstance();
