import { randomUUID } from "node:crypto";
import { AppError } from "@/lib/api/errors";
import { db } from "@/lib/store/database";
import type { MerchantRecord, SubscriptionPlanRecord, SubscriptionRecord } from "@/lib/store/types";
import type {
  CreateSubscriptionInput,
  CreateSubscriptionPlanInput,
  UpdateSubscriptionInput
} from "@/lib/validations/subscription";
import { shouldUseSupabase } from "@/lib/persistence/mode";
import { getSupabaseAdminClient } from "@/lib/supabase/admin";
import { capturePayment, createPayment } from "@/lib/services/payment-service";
import { emitWebhookEvent } from "@/lib/services/webhook-service";

const subscriptionSelectWithDunning =
  "id, merchant_id, customer_id, plan_id, status, next_billing_at, trial_ends_at, dunning_attempts, canceled_at, created_at";
const subscriptionSelectBase =
  "id, merchant_id, customer_id, plan_id, status, next_billing_at, trial_ends_at, created_at";

function isMissingDunningColumnsError(message: string) {
  return (
    (message.includes("dunning_attempts") && message.includes("does not exist")) ||
    (message.includes("canceled_at") && message.includes("does not exist"))
  );
}

function fromPlanRow(row: {
  id: string;
  merchant_id: string;
  name: string;
  amount: number;
  currency: string;
  interval: "month" | "year";
  trial_days: number;
  created_at: string;
}): SubscriptionPlanRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    name: row.name,
    amount: row.amount,
    currency: row.currency,
    interval: row.interval,
    trialDays: row.trial_days,
    createdAt: row.created_at
  };
}

function fromMerchantRow(row: {
  id: string;
  email: string;
  name: string;
  api_key_hash: string;
  created_at: string;
}): MerchantRecord {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    apiKeyHash: row.api_key_hash,
    createdAt: row.created_at
  };
}

function fromSubscriptionRow(row: {
  id: string;
  merchant_id: string;
  customer_id: string;
  plan_id: string;
  status: SubscriptionRecord["status"];
  next_billing_at: string;
  trial_ends_at: string | null;
  dunning_attempts?: number;
  canceled_at?: string | null;
  created_at: string;
}): SubscriptionRecord {
  return {
    id: row.id,
    merchantId: row.merchant_id,
    customerId: row.customer_id,
    planId: row.plan_id,
    status: row.status,
    nextBillingAt: row.next_billing_at,
    trialEndsAt: row.trial_ends_at,
    dunningAttempts: row.dunning_attempts ?? 0,
    canceledAt: row.canceled_at ?? null,
    createdAt: row.created_at
  };
}

export async function createSubscriptionPlan(
  merchant: MerchantRecord,
  input: CreateSubscriptionPlanInput
) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const inserted = await supabase
      .from("subscription_plans")
      .insert({
        id: randomUUID(),
        merchant_id: merchant.id,
        name: input.name,
        amount: input.amount,
        currency: input.currency.toUpperCase(),
        interval: input.interval,
        trial_days: input.trialDays
      })
      .select("id, merchant_id, name, amount, currency, interval, trial_days, created_at")
      .single();

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    return fromPlanRow(
      inserted.data as {
        id: string;
        merchant_id: string;
        name: string;
        amount: number;
        currency: string;
        interval: "month" | "year";
        trial_days: number;
        created_at: string;
      }
    );
  }

  const plan = {
    id: randomUUID(),
    merchantId: merchant.id,
    name: input.name,
    amount: input.amount,
    currency: input.currency.toUpperCase(),
    interval: input.interval,
    trialDays: input.trialDays,
    createdAt: new Date().toISOString()
  };

  db.subscriptionPlans.set(plan.id, plan);
  return plan;
}

export async function listSubscriptionPlans(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const plans = await supabase
      .from("subscription_plans")
      .select("id, merchant_id, name, amount, currency, interval, trial_days, created_at")
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (plans.error) {
      throw new Error(plans.error.message);
    }

    return (plans.data as Array<{
      id: string;
      merchant_id: string;
      name: string;
      amount: number;
      currency: string;
      interval: "month" | "year";
      trial_days: number;
      created_at: string;
    }>).map(fromPlanRow);
  }

  return Array.from(db.subscriptionPlans.values()).filter((plan) => plan.merchantId === merchant.id);
}

export async function createSubscription(
  merchant: MerchantRecord,
  input: CreateSubscriptionInput
) {
  let plan: SubscriptionPlanRecord | undefined;

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const foundPlan = await supabase
      .from("subscription_plans")
      .select("id, merchant_id, name, amount, currency, interval, trial_days, created_at")
      .eq("merchant_id", merchant.id)
      .eq("id", input.planId)
      .maybeSingle();

    if (foundPlan.error) {
      throw new Error(foundPlan.error.message);
    }

    if (foundPlan.data) {
      plan = fromPlanRow(
        foundPlan.data as {
          id: string;
          merchant_id: string;
          name: string;
          amount: number;
          currency: string;
          interval: "month" | "year";
          trial_days: number;
          created_at: string;
        }
      );
    }
  } else {
    plan = db.subscriptionPlans.get(input.planId);
  }

  if (!plan || plan.merchantId !== merchant.id) {
    throw new AppError(404, "subscription_plan_not_found");
  }

  const trialEndsAt =
    plan.trialDays > 0 ? new Date(Date.now() + plan.trialDays * 24 * 60 * 60 * 1000).toISOString() : null;

  const nextBillingAt =
    trialEndsAt ??
    new Date(
      Date.now() + (plan.interval === "month" ? 30 : 365) * 24 * 60 * 60 * 1000
    ).toISOString();

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    let inserted = await supabase
      .from("subscriptions")
      .insert({
        id: randomUUID(),
        merchant_id: merchant.id,
        customer_id: input.customerId,
        plan_id: input.planId,
        status: trialEndsAt ? "trialing" : "active",
        next_billing_at: nextBillingAt,
        trial_ends_at: trialEndsAt,
        dunning_attempts: 0,
        canceled_at: null
      })
      .select(subscriptionSelectWithDunning)
      .single();

    if (inserted.error && isMissingDunningColumnsError(inserted.error.message)) {
      inserted = await supabase
        .from("subscriptions")
        .insert({
          id: randomUUID(),
          merchant_id: merchant.id,
          customer_id: input.customerId,
          plan_id: input.planId,
          status: trialEndsAt ? "trialing" : "active",
          next_billing_at: nextBillingAt,
          trial_ends_at: trialEndsAt
        })
        .select(subscriptionSelectBase)
        .single();
    }

    if (inserted.error) {
      throw new Error(inserted.error.message);
    }

    return fromSubscriptionRow(
      inserted.data as {
        id: string;
        merchant_id: string;
        customer_id: string;
        plan_id: string;
        status: SubscriptionRecord["status"];
        next_billing_at: string;
        trial_ends_at: string | null;
        dunning_attempts?: number;
        canceled_at?: string | null;
        created_at: string;
      }
    );
  }

  const subscription: SubscriptionRecord = {
    id: randomUUID(),
    merchantId: merchant.id,
    customerId: input.customerId,
    planId: input.planId,
    status: trialEndsAt ? "trialing" : "active",
    nextBillingAt,
    trialEndsAt,
    dunningAttempts: 0,
    canceledAt: null,
    createdAt: new Date().toISOString()
  };

  db.subscriptions.set(subscription.id, subscription);
  return subscription;
}

export async function getSubscriptionById(merchant: MerchantRecord, subscriptionId: string) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    let subscription = await supabase
      .from("subscriptions")
      .select(subscriptionSelectWithDunning)
      .eq("merchant_id", merchant.id)
      .eq("id", subscriptionId)
      .maybeSingle();

    if (subscription.error && isMissingDunningColumnsError(subscription.error.message)) {
      subscription = await supabase
        .from("subscriptions")
        .select(subscriptionSelectBase)
        .eq("merchant_id", merchant.id)
        .eq("id", subscriptionId)
        .maybeSingle();
    }

    if (subscription.error) {
      throw new Error(subscription.error.message);
    }

    if (!subscription.data) {
      throw new AppError(404, "subscription_not_found");
    }

    return fromSubscriptionRow(
      subscription.data as {
        id: string;
        merchant_id: string;
        customer_id: string;
        plan_id: string;
        status: SubscriptionRecord["status"];
        next_billing_at: string;
        trial_ends_at: string | null;
        dunning_attempts?: number;
        canceled_at?: string | null;
        created_at: string;
      }
    );
  }

  const subscription = db.subscriptions.get(subscriptionId);
  if (!subscription || subscription.merchantId !== merchant.id) {
    throw new AppError(404, "subscription_not_found");
  }

  return subscription;
}

export async function listSubscriptions(merchant: MerchantRecord) {
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    let subscriptions = await supabase
      .from("subscriptions")
      .select(subscriptionSelectWithDunning)
      .eq("merchant_id", merchant.id)
      .order("created_at", { ascending: false });

    if (subscriptions.error && isMissingDunningColumnsError(subscriptions.error.message)) {
      subscriptions = await supabase
        .from("subscriptions")
        .select(subscriptionSelectBase)
        .eq("merchant_id", merchant.id)
        .order("created_at", { ascending: false });
    }

    if (subscriptions.error) {
      throw new Error(subscriptions.error.message);
    }

    return (subscriptions.data as Array<{
      id: string;
      merchant_id: string;
      customer_id: string;
      plan_id: string;
      status: SubscriptionRecord["status"];
      next_billing_at: string;
      trial_ends_at: string | null;
      dunning_attempts?: number;
      canceled_at?: string | null;
      created_at: string;
    }>).map(fromSubscriptionRow);
  }

  return Array.from(db.subscriptions.values()).filter(
    (subscription) => subscription.merchantId === merchant.id
  );
}

export async function updateSubscription(
  merchant: MerchantRecord,
  subscriptionId: string,
  input: UpdateSubscriptionInput
) {
  const subscription = await getSubscriptionById(merchant, subscriptionId);
  let plan: SubscriptionPlanRecord | undefined;
  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const planRes = await supabase
      .from("subscription_plans")
      .select("id, merchant_id, name, amount, currency, interval, trial_days, created_at")
      .eq("merchant_id", merchant.id)
      .eq("id", subscription.planId)
      .maybeSingle();
    if (planRes.error || !planRes.data) {
      throw new AppError(404, "subscription_plan_not_found");
    }
    plan = fromPlanRow(
      planRes.data as {
        id: string;
        merchant_id: string;
        name: string;
        amount: number;
        currency: string;
        interval: "month" | "year";
        trial_days: number;
        created_at: string;
      }
    );
  } else {
    plan = db.subscriptionPlans.get(subscription.planId);
  }

  if (!plan || plan.merchantId !== merchant.id) {
    throw new AppError(404, "subscription_plan_not_found");
  }

  if (!input.planId && !input.cancelAtPeriodEnd) {
    return subscription;
  }

  let updatedPlanId = subscription.planId;
  let prorationAmount = 0;

  if (input.planId && input.planId !== subscription.planId) {
    let nextPlan: SubscriptionPlanRecord | undefined;
    if (shouldUseSupabase()) {
      const supabase = getSupabaseAdminClient();
      const nextRes = await supabase
        .from("subscription_plans")
        .select("id, merchant_id, name, amount, currency, interval, trial_days, created_at")
        .eq("merchant_id", merchant.id)
        .eq("id", input.planId)
        .maybeSingle();
      if (nextRes.error || !nextRes.data) {
        throw new AppError(404, "subscription_plan_not_found");
      }
      nextPlan = fromPlanRow(
        nextRes.data as {
          id: string;
          merchant_id: string;
          name: string;
          amount: number;
          currency: string;
          interval: "month" | "year";
          trial_days: number;
          created_at: string;
        }
      );
    } else {
      nextPlan = db.subscriptionPlans.get(input.planId);
    }
    if (!nextPlan || nextPlan.merchantId !== merchant.id) {
      throw new AppError(404, "subscription_plan_not_found");
    }

    if (input.prorationBehavior === "create_prorations") {
      const now = Date.now();
      const periodEnd = new Date(subscription.nextBillingAt).getTime();
      const periodStart = new Date(subscription.createdAt).getTime();
      const elapsedRatio = periodEnd <= periodStart ? 1 : Math.min(1, Math.max(0, (now - periodStart) / (periodEnd - periodStart)));
      const remainingRatio = 1 - elapsedRatio;
      prorationAmount = Math.round((nextPlan.amount - plan.amount) * remainingRatio);
    }

    updatedPlanId = nextPlan.id;
    plan = nextPlan;
  }

  const updated: SubscriptionRecord = {
    ...subscription,
    planId: updatedPlanId,
    status: input.cancelAtPeriodEnd ? "canceled" : subscription.status,
    canceledAt: input.cancelAtPeriodEnd ? new Date().toISOString() : null
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    const updatedRes = await supabase
      .from("subscriptions")
      .update({
        plan_id: updated.planId,
        status: updated.status,
        canceled_at: updated.canceledAt
      })
      .eq("merchant_id", merchant.id)
      .eq("id", updated.id)
      .select(subscriptionSelectWithDunning)
      .single();

    const finalUpdated =
      updatedRes.error && isMissingDunningColumnsError(updatedRes.error.message)
        ? await supabase
            .from("subscriptions")
            .update({
              plan_id: updated.planId,
              status: updated.status
            })
            .eq("merchant_id", merchant.id)
            .eq("id", updated.id)
            .select(subscriptionSelectBase)
            .single()
        : updatedRes;

    if (finalUpdated.error) {
      throw new Error(finalUpdated.error.message);
    }
    Object.assign(
      updated,
      fromSubscriptionRow(
        finalUpdated.data as {
          id: string;
          merchant_id: string;
          customer_id: string;
          plan_id: string;
          status: SubscriptionRecord["status"];
          next_billing_at: string;
          trial_ends_at: string | null;
          dunning_attempts?: number;
          canceled_at?: string | null;
          created_at: string;
        }
      )
    );
  } else {
    db.subscriptions.set(updated.id, updated);
  }

  if (input.immediate && prorationAmount > 0) {
    const payment = await createPayment(
      merchant,
      {
        customerId: updated.customerId,
        amount: prorationAmount,
        currency: plan.currency,
        metadata: {
          source: "subscription_proration",
          subscriptionId: updated.id
        }
      },
      `sub-proration:${updated.id}:${Date.now()}`
    );

    if (payment.status === "authorized") {
      await capturePayment(merchant, payment.id);
    }
  }

  return updated;
}

function nextBillingTimestamp(current: string, interval: "month" | "year") {
  const base = new Date(current);
  const days = interval === "month" ? 30 : 365;
  return new Date(base.getTime() + days * 24 * 60 * 60 * 1000).toISOString();
}

export async function processSubscriptionBillingCycles(now = new Date(), merchantId?: string) {
  const maxDunningAttempts = Number(process.env.NEXTPAY_MAX_DUNNING_ATTEMPTS ?? "3");
  let processed = 0;
  let charged = 0;
  let pastDue = 0;

  const processOne = async (merchant: MerchantRecord, subscription: SubscriptionRecord, plan: SubscriptionPlanRecord) => {
    processed += 1;

    const idempotencyKey = `sub-cycle:${subscription.id}:${subscription.nextBillingAt.slice(0, 10)}`;
    const payment = await createPayment(
      merchant,
      {
        customerId: subscription.customerId,
        amount: plan.amount,
        currency: plan.currency,
        metadata: {
          source: "subscription_cycle",
          subscriptionId: subscription.id
        }
      },
      idempotencyKey
    );

    if (payment.status === "failed") {
      pastDue += 1;
      await emitWebhookEvent(merchant, {
        type: "subscription.payment_failed",
        payload: { subscriptionId: subscription.id, paymentId: payment.id }
      });

      if (shouldUseSupabase()) {
        const supabase = getSupabaseAdminClient();
        const nextAttempts = (subscription.dunningAttempts ?? 0) + 1;
        const nextStatus = nextAttempts >= maxDunningAttempts ? "canceled" : "past_due";
        const updated = await supabase
          .from("subscriptions")
          .update({
            status: nextStatus,
            next_billing_at: new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString(),
            dunning_attempts: nextAttempts,
            canceled_at: nextStatus === "canceled" ? now.toISOString() : null
          })
          .eq("id", subscription.id);
        if (updated.error) {
          throw new Error(updated.error.message);
        }
      } else {
        const existing = db.subscriptions.get(subscription.id);
        if (existing) {
          existing.dunningAttempts += 1;
          existing.status = existing.dunningAttempts >= maxDunningAttempts ? "canceled" : "past_due";
          existing.canceledAt = existing.status === "canceled" ? now.toISOString() : null;
          existing.nextBillingAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
          db.subscriptions.set(existing.id, existing);
        }
      }

      return;
    }

    await capturePayment(merchant, payment.id);
    charged += 1;
    await emitWebhookEvent(merchant, {
      type: "subscription.renewed",
      payload: { subscriptionId: subscription.id, paymentId: payment.id }
    });

    const nextBillingAt = nextBillingTimestamp(subscription.nextBillingAt, plan.interval);
    if (shouldUseSupabase()) {
      const supabase = getSupabaseAdminClient();
      const updated = await supabase
        .from("subscriptions")
        .update({
          status: "active",
          next_billing_at: nextBillingAt,
          trial_ends_at: null,
          dunning_attempts: 0,
          canceled_at: null
        })
        .eq("id", subscription.id);
      if (updated.error) {
        throw new Error(updated.error.message);
      }
    } else {
      const existing = db.subscriptions.get(subscription.id);
      if (existing) {
        existing.status = "active";
        existing.nextBillingAt = nextBillingAt;
        existing.trialEndsAt = null;
        existing.dunningAttempts = 0;
        existing.canceledAt = null;
        db.subscriptions.set(existing.id, existing);
      }
    }
  };

  if (shouldUseSupabase()) {
    const supabase = getSupabaseAdminClient();
    let query = supabase
      .from("subscriptions")
      .select(subscriptionSelectWithDunning)
      .in("status", ["active", "trialing", "past_due"]);

    if (merchantId) {
      query = query.eq("merchant_id", merchantId);
    }

    let due = await query;
    if (due.error && isMissingDunningColumnsError(due.error.message)) {
      let fallbackQuery = supabase
        .from("subscriptions")
        .select(subscriptionSelectBase)
        .in("status", ["active", "trialing", "past_due"]);
      if (merchantId) {
        fallbackQuery = fallbackQuery.eq("merchant_id", merchantId);
      }
      due = await fallbackQuery;
    }
    if (due.error) {
      throw new Error(due.error.message);
    }

    const subscriptions = (due.data as Array<{
      id: string;
      merchant_id: string;
      customer_id: string;
      plan_id: string;
      status: SubscriptionRecord["status"];
      next_billing_at: string;
      trial_ends_at: string | null;
      dunning_attempts?: number;
      canceled_at?: string | null;
      created_at: string;
    }>)
      .map(fromSubscriptionRow)
      .filter((subscription) => new Date(subscription.nextBillingAt) <= now);

    for (const subscription of subscriptions) {
      const merchant = await getSupabaseAdminClient()
        .from("merchants")
        .select("id, email, name, api_key_hash, created_at")
        .eq("id", subscription.merchantId)
        .maybeSingle();

      if (merchant.error || !merchant.data) {
        continue;
      }

      const plan = await supabase
        .from("subscription_plans")
        .select("id, merchant_id, name, amount, currency, interval, trial_days, created_at")
        .eq("id", subscription.planId)
        .maybeSingle();

      if (plan.error || !plan.data) {
        continue;
      }

      await processOne(
        fromMerchantRow(
          merchant.data as {
            id: string;
            email: string;
            name: string;
            api_key_hash: string;
            created_at: string;
          }
        ),
        subscription,
        fromPlanRow(
          plan.data as {
            id: string;
            merchant_id: string;
            name: string;
            amount: number;
            currency: string;
            interval: "month" | "year";
            trial_days: number;
            created_at: string;
          }
        )
      );
    }

    return { processed, charged, pastDue };
  }

  const dueSubscriptions = Array.from(db.subscriptions.values()).filter(
    (subscription) =>
      (!merchantId || subscription.merchantId === merchantId) &&
      subscription.status !== "canceled" &&
      new Date(subscription.nextBillingAt) <= now
  );

  for (const subscription of dueSubscriptions) {
    const merchant = db.merchants.get(subscription.merchantId);
    const plan = db.subscriptionPlans.get(subscription.planId);
    if (!merchant || !plan) {
      continue;
    }

    await processOne(merchant, subscription, plan);
  }

  return { processed, charged, pastDue };
}
