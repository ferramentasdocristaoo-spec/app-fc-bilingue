import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function extractEmail(body: any): string | undefined {
  // Direct email field
  if (body.email) return body.email;
  // Hotmart format
  if (body.data?.buyer?.email) return body.data.buyer.email;
  if (body.data?.purchase?.buyer?.email) return body.data.purchase.buyer.email;
  // Kiwify format
  if (body.Customer?.email) return body.Customer.email;
  if (body.customer?.email) return body.customer.email;
  // Events array format
  if (body.events && Array.isArray(body.events)) return body.events[0]?.data?.customer_email;
  if (body.body?.events && Array.isArray(body.body.events)) return body.body.events[0]?.data?.customer_email;
  if (Array.isArray(body) && body[0]?.body?.events) return body[0].body.events[0]?.data?.customer_email;
  return undefined;
}

function extractSku(body: any): string | undefined {
  // Direct SKU fields
  if (body.sku) return body.sku;
  if (body.product_id) return String(body.product_id);
  if (body.product_code) return body.product_code;
  if (body.offer_code) return body.offer_code;
  // Hotmart format
  if (body.data?.purchase?.offer?.code) return body.data.purchase.offer.code;
  if (body.data?.product?.id) return String(body.data.product.id);
  if (body.data?.purchase?.product?.id) return String(body.data.purchase.product.id);
  // Kiwify format
  if (body.Product?.id) return String(body.Product.id);
  if (body.product?.id) return String(body.product.id);
  if (body.plan?.id) return String(body.plan.id);
  // Eduzz / Monetizze
  if (body.key) return body.key;
  // Events array
  if (body.events && Array.isArray(body.events)) return body.events[0]?.data?.product?.id;
  return undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    console.log("Webhook payload:", JSON.stringify(body).slice(0, 1000));

    const email = extractEmail(body);
    if (!email || typeof email !== "string") {
      console.error("Email not found in payload");
      return new Response(JSON.stringify({ error: "Email não encontrado no payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const sku = extractSku(body);
    console.log(`Email: ${normalizedEmail} | SKU: ${sku ?? "none"}`);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    let planName = "manual";
    let expiresAt: string | null = null;

    // Look up SKU in sku_plans to determine duration
    if (sku) {
      const { data: skuPlan } = await supabase
        .from("sku_plans")
        .select("plan_name, months")
        .eq("sku", sku)
        .maybeSingle();

      if (skuPlan) {
        planName = skuPlan.plan_name;
        const expiry = new Date();
        expiry.setMonth(expiry.getMonth() + skuPlan.months);
        expiresAt = expiry.toISOString();
        console.log(`Plan found: ${planName} (${skuPlan.months} months) → expires ${expiresAt}`);
      } else {
        console.warn(`SKU "${sku}" not found in sku_plans — granting access without expiry`);
      }
    }

    const { error } = await supabase
      .from("approved_emails")
      .upsert(
        { email: normalizedEmail, plan: planName, sku: sku ?? null, expires_at: expiresAt },
        { onConflict: "email" }
      );

    if (error) {
      console.error("Error saving email:", error);
      return new Response(JSON.stringify({ error: "Erro ao salvar email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // A SKU may unlock a library product. Access is tied to the product,
    // therefore it remains valid in every language and for every localized cover.
    if (sku) {
      const { data: libraryProduct } = await supabase
        .from("library_sku_products")
        .select("product_slug")
        .eq("sku", sku)
        .maybeSingle();

      if (libraryProduct) {
        const { error: entitlementError } = await supabase
          .from("library_entitlements")
          .upsert(
            { email: normalizedEmail, product_slug: libraryProduct.product_slug, source_sku: sku },
            { onConflict: "email,product_slug" }
          );
        if (entitlementError) console.error("Error granting library access:", entitlementError);
      }
    }

    console.log(`Access granted: ${normalizedEmail} | plan: ${planName} | expires: ${expiresAt ?? "never"}`);
    return new Response(JSON.stringify({ success: true, email: normalizedEmail, plan: planName, expires_at: expiresAt }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Webhook error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
