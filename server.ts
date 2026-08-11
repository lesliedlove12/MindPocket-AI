import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import Stripe from "stripe";

const app = express();
const PORT = 3000;

// Lazy Stripe Client Initialization
let stripeClient: Stripe | null = null;
function getStripeClient(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey, {
      apiVersion: "2025-02-24.acacia" as any,
    });
  }
  return stripeClient;
}

// In-memory server store for active subscriptions
interface ServerSubscriptionRecord {
  subscriptionId: string;
  customerId?: string;
  plan: 'monthly' | 'yearly';
  status: string;
  isPro: boolean;
  renewsAt?: string;
  cancelAtPeriodEnd?: boolean;
  updatedAt: string;
}
const activeSubscriptionsStore = new Map<string, ServerSubscriptionRecord>();

// Webhook endpoint requires raw body for signature verification BEFORE json middleware
app.post(
  "/api/webhook/stripe",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const sig = req.headers["stripe-signature"];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const stripe = getStripeClient();

    let event: Stripe.Event;

    try {
      if (stripe && webhookSecret && sig) {
        event = stripe.webhooks.constructEvent(req.body, sig as string, webhookSecret);
      } else {
        // Fallback parsing if signature not configured or in local test environment
        const rawBody = req.body instanceof Buffer ? req.body.toString("utf8") : req.body;
        event = typeof rawBody === "string" ? JSON.parse(rawBody) : rawBody;
      }
    } catch (err: any) {
      console.error("Stripe Webhook Error:", err?.message);
      return res.status(400).send(`Webhook Error: ${err?.message}`);
    }

    console.log(`[Stripe Webhook Received] Event Type: ${event.type}`);

    // Process Stripe Events
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        if (session.subscription) {
          const subId = typeof session.subscription === "string" ? session.subscription : session.subscription.id;
          const plan = (session.metadata?.plan as 'monthly' | 'yearly') || "monthly";
          activeSubscriptionsStore.set(subId, {
            subscriptionId: subId,
            customerId: typeof session.customer === "string" ? session.customer : session.customer?.id,
            plan,
            status: "active",
            isPro: true,
            updatedAt: new Date().toISOString(),
          });
          console.log(`Checkout Session Completed for Subscription ${subId}`);
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as any;
        const subId = sub.id;
        const isPro = sub.status === "active" || sub.status === "trialing";
        const renewsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined;
        
        activeSubscriptionsStore.set(subId, {
          subscriptionId: subId,
          customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          plan: sub.items?.data?.[0]?.plan?.interval === "year" ? "yearly" : "monthly",
          status: sub.status,
          isPro,
          renewsAt,
          cancelAtPeriodEnd: sub.cancel_at_period_end,
          updatedAt: new Date().toISOString(),
        });
        console.log(`Subscription Updated: ${subId} -> status: ${sub.status}`);
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as any;
        const subId = sub.id;
        activeSubscriptionsStore.set(subId, {
          subscriptionId: subId,
          customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
          plan: "monthly",
          status: "canceled",
          isPro: false,
          cancelAtPeriodEnd: true,
          updatedAt: new Date().toISOString(),
        });
        console.log(`Subscription Canceled/Expired: ${subId}`);
        break;
      }

      case "invoice.paid":
      case "invoice.payment_succeeded": {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
          const existing = activeSubscriptionsStore.get(subId);
          if (existing) {
            existing.status = "active";
            existing.isPro = true;
            existing.updatedAt = new Date().toISOString();
          }
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as any;
        if (invoice.subscription) {
          const subId = typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription.id;
          const existing = activeSubscriptionsStore.get(subId);
          if (existing) {
            existing.status = "past_due";
            existing.isPro = false;
            existing.updatedAt = new Date().toISOString();
          }
        }
        break;
      }
    }

    return res.json({ received: true });
  }
);

// Standard JSON body parser for all other endpoints
app.use(express.json({ limit: "15mb" }));

// Initialize Gemini Client Lazily
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Health Check
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    app: "MindPocket",
    hasGemini: !!process.env.GEMINI_API_KEY,
    hasStripeKey: !!process.env.STRIPE_SECRET_KEY,
    hasMonthlyPrice: !!(process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID_MONTH),
    hasYearlyPrice: !!(process.env.STRIPE_PRICE_ID_YEARLY || process.env.STRIPE_PRICE_ID_YEAR),
  });
});

// STRIPE API ENDPOINTS

// Helper function to resolve or auto-detect Stripe Price ID for a plan
async function resolveStripePriceId(
  stripe: Stripe,
  plan: 'monthly' | 'yearly',
  requestedPriceId?: string
): Promise<string> {
  const envPriceId =
    plan === 'yearly'
      ? (process.env.STRIPE_PRICE_ID_YEARLY || process.env.STRIPE_PRICE_ID_YEAR)
      : (process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID_MONTH);

  const candidateId = (requestedPriceId || envPriceId || '').trim();

  // Step 1: Verify if candidateId works in connected Stripe account and is a recurring price
  if (candidateId) {
    try {
      const existing = await stripe.prices.retrieve(candidateId);
      if (existing && existing.active && (existing.type === 'recurring' || !!existing.recurring)) {
        console.log(`[Stripe] Validated recurring price ID "${candidateId}" for ${plan} plan.`);
        return candidateId;
      }
      console.warn(`[Stripe] Price ID "${candidateId}" found but is inactive or not recurring.`);
    } catch (err: any) {
      console.warn(`[Stripe] Configured price ID "${candidateId}" not found in connected account: ${err?.message}`);
    }
  }

  // Step 2: Auto-lookup active recurring prices in connected Stripe account
  console.log(`[Stripe] Auto-searching active recurring prices in connected Stripe account for plan: ${plan}`);
  const pricesList = await stripe.prices.list({
    active: true,
    limit: 100,
    expand: ['data.product'],
  });

  const targetInterval = plan === 'yearly' ? 'year' : 'month';
  const targetAmount = plan === 'yearly' ? 6999 : 699; // $69.99 or $6.99

  // Search for recurring price matching MindPocket Pro or interval/amount
  const matchedPrice = pricesList.data.find((p: any) => {
    const isRecurring = p.type === 'recurring' || !!p.recurring;
    const isMatchingInterval = p.recurring?.interval === targetInterval;
    const isMatchingAmount = p.unit_amount === targetAmount;
    const productName = typeof p.product === 'object' && p.product ? (p.product as any).name : '';
    const isMindPocketProduct = productName ? productName.toLowerCase().includes('mindpocket') : true;

    return isRecurring && isMatchingInterval && (isMatchingAmount || isMindPocketProduct);
  }) || pricesList.data.find((p: any) => (p.type === 'recurring' || !!p.recurring) && p.recurring?.interval === targetInterval);

  if (matchedPrice) {
    console.log(`[Stripe] Successfully auto-detected active recurring price ID "${matchedPrice.id}" for ${plan} plan ($${matchedPrice.unit_amount ? (matchedPrice.unit_amount / 100).toFixed(2) : ''})`);
    return matchedPrice.id;
  }

  // If no price found, assemble helpful diagnostic error message
  const availableSummary = pricesList.data
    .map(
      (p: any) =>
        `[ID: ${p.id}, Amount: $${p.unit_amount ? (p.unit_amount / 100).toFixed(2) : 'N/A'}/${p.recurring?.interval || 'one-time'}]`
    )
    .join(', ');

  throw new Error(
    `No active recurring price found for ${plan} plan ($${plan === 'yearly' ? '69.99/year' : '6.99/month'}) in connected Stripe account. ` +
      (availableSummary
        ? `Found active prices in your Stripe Sandbox account: ${availableSummary}. Please update your STRIPE_PRICE_ID_MONTH / STRIPE_PRICE_ID_YEAR in AI Studio Settings.`
        : `No active prices found in your Stripe Sandbox account. Please create the "MindPocket Pro" product and recurring prices in Stripe Sandbox.`)
  );
}

// 1. Create Checkout Session
app.post("/api/stripe/create-checkout-session", async (req, res) => {
  try {
    const { plan, priceId: requestedPriceId } = req.body;
    const stripe = getStripeClient();

    if (!stripe) {
      return res.status(400).json({
        error: "STRIPE_SECRET_KEY is missing",
        message: "Stripe Secret Key is not configured in server environment variables. Please add STRIPE_SECRET_KEY in AI Studio Settings.",
      });
    }

    const selectedPlan: 'monthly' | 'yearly' = plan === 'yearly' ? 'yearly' : 'monthly';

    let resolvedPriceId: string;
    try {
      resolvedPriceId = await resolveStripePriceId(stripe, selectedPlan, requestedPriceId);
    } catch (priceErr: any) {
      return res.status(400).json({
        error: "NO_SUCH_PRICE",
        message: priceErr?.message || `No price found for ${selectedPlan} plan.`,
      });
    }

    const hostHeader = req.headers["x-forwarded-host"] || req.headers.host;
    const protocol = req.headers["x-forwarded-proto"] || "https";
    const origin = req.headers.origin || process.env.APP_URL || `${protocol}://${hostHeader}`;

    console.log(`[Stripe] Creating checkout session for plan: ${selectedPlan}, resolved priceId: ${resolvedPriceId}`);

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      payment_method_types: ["card"],
      line_items: [
        {
          price: resolvedPriceId,
          quantity: 1,
        },
      ],
      success_url: `${origin}/?session_id={CHECKOUT_SESSION_ID}&checkout_status=success`,
      cancel_url: `${origin}/?checkout_status=canceled`,
      metadata: {
        plan: selectedPlan,
      },
    });

    return res.json({
      success: true,
      url: session.url,
      sessionId: session.id,
    });
  } catch (error: any) {
    console.error("Error creating Stripe checkout session:", error);
    return res.status(500).json({
      error: "CHECKOUT_SESSION_FAILED",
      message: error?.message || "Failed to create Stripe checkout session",
    });
  }
});

// 2. Verify Session after Checkout Redirect
app.post("/api/stripe/verify-session", async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Missing sessionId" });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(400).json({
        error: "STRIPE_NOT_CONFIGURED",
        message: "Stripe Secret Key not configured on server.",
      });
    }

    console.log(`[Stripe] Verifying session with Stripe API: ${sessionId}`);
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });

    if (session.payment_status === "paid" || session.status === "complete") {
      const sub = typeof session.subscription === "object" ? (session.subscription as any) : null;
      const subId = sub ? sub.id : (typeof session.subscription === "string" ? session.subscription : sessionId);
      const isPro = sub ? sub.status === "active" || sub.status === "trialing" : true;
      const renewsAt = sub?.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const plan: 'monthly' | 'yearly' = (session.metadata?.plan as 'monthly' | 'yearly') || (sub?.items?.data?.[0]?.plan?.interval === "year" ? "yearly" : "monthly");

      // Save to server record
      activeSubscriptionsStore.set(subId, {
        subscriptionId: subId,
        customerId: typeof session.customer === "string" ? session.customer : (session.customer as any)?.id,
        plan,
        status: sub?.status || "active",
        isPro,
        renewsAt,
        cancelAtPeriodEnd: sub?.cancel_at_period_end || false,
        updatedAt: new Date().toISOString(),
      });

      return res.json({
        success: true,
        isPro,
        plan,
        status: sub?.status || "active",
        renewsAt,
        cancelAtPeriodEnd: sub?.cancel_at_period_end || false,
        subscriptionId: subId,
        customerId: typeof session.customer === "string" ? session.customer : (session.customer as Stripe.Customer)?.id,
      });
    } else {
      return res.json({
        success: false,
        isPro: false,
        status: session.payment_status || "unpaid",
        message: "Checkout payment was not completed.",
      });
    }
  } catch (error: any) {
    console.error("Error verifying Stripe session:", error);
    return res.status(500).json({
      error: "VERIFY_SESSION_FAILED",
      message: error?.message || "Failed to verify session with Stripe",
    });
  }
});

// 3. Verify Direct Subscription Status with Stripe API
app.post("/api/stripe/verify-subscription", async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: "Missing subscriptionId" });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      // Check server memory record as fallback
      const record = activeSubscriptionsStore.get(subscriptionId);
      if (record) {
        return res.json({
          success: true,
          isPro: record.isPro,
          plan: record.plan,
          status: record.status,
          renewsAt: record.renewsAt,
          cancelAtPeriodEnd: record.cancelAtPeriodEnd,
          subscriptionId: record.subscriptionId,
        });
      }
      return res.status(400).json({
        error: "STRIPE_NOT_CONFIGURED",
        message: "Stripe Secret Key not configured on server.",
      });
    }

    console.log(`[Stripe] Querying Stripe API for subscription: ${subscriptionId}`);
    const sub = (await stripe.subscriptions.retrieve(subscriptionId)) as any;
    const isPro = sub.status === "active" || sub.status === "trialing";
    const renewsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined;
    const plan: 'monthly' | 'yearly' = sub.items?.data?.[0]?.plan?.interval === "year" ? "yearly" : "monthly";

    // Update server store
    activeSubscriptionsStore.set(subscriptionId, {
      subscriptionId,
      customerId: typeof sub.customer === "string" ? sub.customer : sub.customer?.id,
      plan,
      status: sub.status,
      isPro,
      renewsAt,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      updatedAt: new Date().toISOString(),
    });

    return res.json({
      success: true,
      isPro,
      plan,
      status: sub.status,
      renewsAt,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      subscriptionId,
    });
  } catch (error: any) {
    console.error("Error verifying Stripe subscription:", error);
    return res.status(500).json({
      error: "VERIFY_SUBSCRIPTION_FAILED",
      message: error?.message || "Failed to verify subscription with Stripe",
    });
  }
});

// 4. Cancel Subscription in Stripe
app.post("/api/stripe/cancel-subscription", async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: "Missing subscriptionId" });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(400).json({
        error: "STRIPE_NOT_CONFIGURED",
        message: "Stripe Secret Key not configured on server.",
      });
    }

    console.log(`[Stripe] Canceling subscription at period end: ${subscriptionId}`);
    const sub = (await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })) as any;

    const renewsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined;

    return res.json({
      success: true,
      status: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      renewsAt,
      message: `Subscription will cancel at the end of the current billing period (${renewsAt ? new Date(renewsAt).toLocaleDateString() : 'period end'}).`,
    });
  } catch (error: any) {
    console.error("Error canceling Stripe subscription:", error);
    return res.status(500).json({
      error: "CANCEL_SUBSCRIPTION_FAILED",
      message: error?.message || "Failed to cancel subscription with Stripe",
    });
  }
});

// 5. Reactivate Subscription in Stripe
app.post("/api/stripe/reactivate-subscription", async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ error: "Missing subscriptionId" });
    }

    const stripe = getStripeClient();
    if (!stripe) {
      return res.status(400).json({
        error: "STRIPE_NOT_CONFIGURED",
        message: "Stripe Secret Key not configured on server.",
      });
    }

    console.log(`[Stripe] Reactivating subscription: ${subscriptionId}`);
    const sub = (await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })) as any;

    const renewsAt = sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : undefined;

    return res.json({
      success: true,
      status: sub.status,
      cancelAtPeriodEnd: sub.cancel_at_period_end,
      renewsAt,
      message: "Subscription reactivated successfully! Automatic renewal enabled.",
    });
  } catch (error: any) {
    console.error("Error reactivating Stripe subscription:", error);
    return res.status(500).json({
      error: "REACTIVATE_SUBSCRIPTION_FAILED",
      message: error?.message || "Failed to reactivate subscription with Stripe",
    });
  }
});

// Smart Suggest API: Extracts title, category, tags, and suggested description
app.post("/api/smart-suggest", async (req, res) => {
  try {
    const { text, voiceTranscript, photoDescription } = req.body;
    const contentToAnalyze = text || voiceTranscript || photoDescription || "";

    if (!contentToAnalyze.trim()) {
      return res.status(400).json({ error: "No content provided" });
    }

    const client = getGeminiClient();
    if (!client) {
      // Fallback client-side/heuristic logic if no Gemini API Key configured
      const fallback = generateHeuristicSuggestion(contentToAnalyze);
      return res.json({ suggestion: fallback, source: "heuristic" });
    }

    const prompt = `Analyze this user's personal memory note and generate a clean, concise Title and Category for MindPocket.
Allowed Categories: ["Home", "Car", "Family", "Shopping", "Money", "Storage", "Places", "Other"]

Input text: "${contentToAnalyze}"

Return a structured JSON object with:
- title: Short, clean title (e.g. "Spare Key", "Paint Color", "Parking Spot", "Shoe Size")
- category: One of the allowed categories listed above
- description: Cleaned-up concise memory details
- suggestedLocation: Any detected location info (e.g. "Level 3, Row B" or "Top desk drawer") or null
- keywords: Array of 2-4 search tags (e.g. ["key", "flower pot", "garden"])`;

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedLocation: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["title", "category", "description"],
        },
      },
    });

    const jsonStr = response.text || "";
    const parsed = JSON.parse(jsonStr);
    return res.json({ suggestion: parsed, source: "gemini" });
  } catch (error: any) {
    console.error("Error in /api/smart-suggest:", error);
    // Fallback on error
    const fallback = generateHeuristicSuggestion(req.body.text || req.body.voiceTranscript || "");
    return res.json({ suggestion: fallback, source: "heuristic_fallback" });
  }
});

// Analyze Image Endpoint (Visual Memory Scanner)
app.post("/api/analyze-image", async (req, res) => {
  try {
    const { imageBase64, mimeType } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64" });
    }

    const client = getGeminiClient();
    if (!client) {
      return res.json({
        suggestion: {
          title: "Photo Memory",
          category: "Storage",
          description: "Photo memory saved in MindPocket.",
          suggestedLocation: null,
          keywords: ["photo", "memory"],
        },
        source: "default",
      });
    }

    // Clean base64 string
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const response = await client.models.generateContent({
      model: "gemini-3.6-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            },
          },
          {
            text: `Look at this photo for a personal memory app called MindPocket.
Provide a clear title, category (Home, Car, Family, Shopping, Money, Storage, Places, Other), and a helpful description of what is shown (e.g. box label, paint name, serial number, parking spot number, document title, item location). Return strictly JSON.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            category: { type: Type.STRING },
            description: { type: Type.STRING },
            suggestedLocation: { type: Type.STRING },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: ["title", "category", "description"],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    return res.json({ suggestion: parsed, source: "gemini_vision" });
  } catch (error: any) {
    console.error("Error analyzing image:", error);
    return res.status(500).json({ error: "Failed to analyze photo" });
  }
});

// Heuristic fallback generator when AI key is missing or offline
function generateHeuristicSuggestion(text: string) {
  const lower = text.toLowerCase();
  let title = "Saved Memory";
  let category = "Other";

  if (lower.includes("key") || lower.includes("lock")) {
    title = "Key Location";
    category = "Home";
  } else if (lower.includes("car") || lower.includes("park") || lower.includes("tier") || lower.includes("tire") || lower.includes("oil")) {
    title = "Car Memory";
    category = "Car";
  } else if (lower.includes("paint") || lower.includes("decor") || lower.includes("flower") || lower.includes("garden") || lower.includes("door")) {
    title = "Home Details";
    category = "Home";
  } else if (lower.includes("box") || lower.includes("storage") || lower.includes("attic") || lower.includes("garage") || lower.includes("drawer")) {
    title = "Storage Info";
    category = "Storage";
  } else if (lower.includes("size") || lower.includes("shoe") || lower.includes("kid") || lower.includes("son") || lower.includes("daughter") || lower.includes("gift")) {
    title = "Family Note";
    category = "Family";
  } else if (lower.includes("receipt") || lower.includes("tax") || lower.includes("price") || lower.includes("dollar") || lower.includes("bank") || lower.includes("card")) {
    title = "Financial Note";
    category = "Money";
  } else if (lower.includes("buy") || lower.includes("store") || lower.includes("grocer") || lower.includes("shop")) {
    title = "Shopping Note";
    category = "Shopping";
  } else {
    // Generate title from first 4 words
    const words = text.trim().split(/\s+/).slice(0, 4).join(" ");
    if (words) {
      title = words.charAt(0).toUpperCase() + words.slice(1);
    }
  }

  return {
    title,
    category,
    description: text,
    suggestedLocation: null,
    keywords: title.toLowerCase().split(" "),
  };
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`MindPocket server running on http://localhost:${PORT}`);
  });
}

startServer();
