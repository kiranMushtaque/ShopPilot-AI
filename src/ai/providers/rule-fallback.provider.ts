import { ToolExecutor, ToolExecutionContext, ToolResult } from '../tools/executor';
import { ConversationMemory, ConversationContext } from '../memory/conversation-memory';
import { productService } from '../../services/product.service';

export class RuleFallbackProvider {
  public static async process(
    userMessage: string,
    ctx: ToolExecutionContext,
    convContext: ConversationContext = {}
  ): Promise<{ responseText: string; toolResults: ToolResult[] }> {
    const memory = ConversationMemory.extractContextFromMessage(userMessage, convContext);
    const lower = userMessage.toLowerCase().trim();
    const toolResults: ToolResult[] = [];
    let responseText = '';

    // 1. Human Escalation Intent
    if (
      lower.includes('human') ||
      lower.includes('insan') ||
      lower.includes('agent') ||
      lower.includes('baat karni hai') ||
      lower.includes('talk to human') ||
      lower.includes('representative')
    ) {
      const res = await ToolExecutor.execute(
        'escalate_to_human',
        {
          reason: 'Customer requested human support assistance.',
          customerSummary: userMessage,
        },
        ctx
      );
      toolResults.push(res);

      if (memory.language === 'ur') {
        responseText = 'آپ کی درخواست کے مطابق سپورٹ ٹکٹ بنا دیا گیا ہے۔ جلد ہی ہمارا کسٹمر سپورٹ نمائندہ آپ سے رابطہ کرے گا۔';
      } else if (memory.language === 'roman_ur') {
        responseText = `Aap ki request par Support Ticket create kar diya gaya hai. Hamara customer support representative jald hi yahan aapse rabta karega.`;
      } else {
        responseText = `I have escalated your request and opened a support ticket. A customer support representative will assist you shortly.`;
      }
      return { responseText, toolResults };
    }

    // 2. Order Tracking Intent
    const orderMatch = userMessage.match(/\b(SP-\d{4,6})\b/i);
    if (
      orderMatch ||
      lower.includes('order kahan') ||
      lower.includes('track') ||
      lower.includes('order status') ||
      lower.includes('mera order')
    ) {
      if (orderMatch) {
        const orderNum = orderMatch[1].toUpperCase();
        // Check with demo contact
        const res = await ToolExecutor.execute(
          'get_order_status',
          { orderNumber: orderNum, phoneOrEmail: '03335554433' },
          ctx
        );
        toolResults.push(res);

        if (res.status === 'SUCCESS') {
          if (memory.language === 'roman_ur') {
            responseText = `Aap ke order #${orderNum} ki tafseelat mil gayi hain: Status **${(res.data as { status: string })?.status || 'Processing'}** hai.`;
          } else {
            responseText = `Found your order details for #${orderNum}. Current status is **${(res.data as { status: string })?.status || 'Processing'}**.`;
          }
        } else {
          responseText = `Order #${orderNum} verify nahi ho saka. Barah-e-karam apna registered phone number ya email bhi saath likhein.`;
        }
      } else {
        responseText = memory.language === 'roman_ur'
          ? `Apna order track karne ke liye Order Number (e.g. SP-10001) aur apna phone number likhein.`
          : `To track your order, please provide your Order Number (e.g. SP-10001) and registered phone number or email.`;
      }
      return { responseText, toolResults };
    }

    // 3. Store Policy & FAQ Intent (Returns, Shipping, Warranty)
    if (
      lower.includes('wapsi') ||
      lower.includes('return') ||
      lower.includes('refund') ||
      lower.includes('tabdeel') ||
      lower.includes('shipping') ||
      lower.includes('delivery') ||
      lower.includes('warranty') ||
      lower.includes('pta') ||
      lower.includes('cod')
    ) {
      const res = await ToolExecutor.execute('search_knowledge_base', { query: userMessage }, ctx);
      toolResults.push(res);

      if (memory.language === 'roman_ur') {
        responseText = `ShopPilot PK verified policy:\n\n${res.message}`;
      } else {
        responseText = `Here is our verified policy:\n\n${res.message}`;
      }
      return { responseText, toolResults };
    }

    // 4. Cart Action Intent
    if (
      (lower.includes('cart') || lower.includes('buy') || lower.includes('kharidna') || lower.includes('add')) &&
      (lower.includes('add') || lower.includes('dal') || lower.includes('karo'))
    ) {
      // Find suitable product from context or search
      const products = await productService.getProducts({
        categoryId: memory.category,
        maxPrice: memory.budget,
        limit: 1,
      });

      if (products.products.length > 0) {
        const prod = products.products[0];
        const res = await ToolExecutor.execute('add_to_cart', { productId: prod.id, quantity: 1 }, ctx);
        toolResults.push(res);

        responseText = memory.language === 'roman_ur'
          ? `Maine **${prod.name}** (Rs. ${prod.pricePkr.toLocaleString()}) aapke cart mein add kar diya hai!`
          : `I have added **${prod.name}** (Rs. ${prod.pricePkr.toLocaleString()}) to your cart.`;
        return { responseText, toolResults };
      }
    }

    // 5. Product Search & Recommendation (Default)
    const searchRes = await ToolExecutor.execute(
      'search_products',
      {
        categoryId: memory.category,
        brand: memory.brand,
        maxPrice: memory.budget,
        limit: 4,
      },
      ctx
    );
    toolResults.push(searchRes);

    const prods = searchRes.suggestedProducts || [];
    if (prods.length > 0) {
      if (memory.language === 'ur') {
        responseText = `یہ آپ کی مطلوبہ پراڈکٹس ہمارے سٹور پر دستیاب ہیں:`;
      } else if (memory.language === 'roman_ur') {
        const budgetText = memory.budget ? `${memory.budget.toLocaleString()} PKR ke andar ` : '';
        responseText = `Bilkul! Yeh ${budgetText}available options hain. Aap kisi bhi item ko direct cart mein add kar sakte hain ya specs check kar sakte hain:`;
      } else {
        const budgetText = memory.budget ? `under Rs. ${memory.budget.toLocaleString()} ` : '';
        responseText = `Here are the top available products ${budgetText}from our store:`;
      }
    } else {
      responseText = memory.language === 'roman_ur'
        ? `Maazrat! Is budget ya criteria mein filhal koi product available nahi hai. Kya aap koi doosri category dekhna chahein ge?`
        : `Sorry! No products found matching your exact budget and criteria. Would you like to check other categories?`;
    }

    return { responseText, toolResults };
  }
}
