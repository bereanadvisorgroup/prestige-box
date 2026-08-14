"use server";

import { revalidatePath } from "next/cache";

import { supabaseServer, verifyAdmin } from "@/lib/supabase.server";

export async function getBusinessContact() {
  try {
    const { data, error } = await supabaseServer
      .from("keyvals")
      .select("id, value")
      .in("id", [
        "BUSINESS_EMAIL",
        "BUSINESS_PHONE",
        "BUSINESS_WEBSITE",
        "COMPANY_LOGO_URL",
        "COMPANY_NAME",
        "PORTAL_SOCIAL_MEDIA",
      ]);

    if (error) throw error;

    const emailObj = data?.find((item) => item.id === "BUSINESS_EMAIL");
    const phoneObj = data?.find((item) => item.id === "BUSINESS_PHONE");
    const websiteObj = data?.find((item) => item.id === "BUSINESS_WEBSITE");
    const logoUrlObj = data?.find((item) => item.id === "COMPANY_LOGO_URL");
    const companyNameObj = data?.find((item) => item.id === "COMPANY_NAME");
    const socialMediaObj = data?.find((item) => item.id === "PORTAL_SOCIAL_MEDIA");

    return {
      success: true,
      email: emailObj?.value || "info@prestigeadvisors360.com",
      phone: phoneObj?.value || "941-799-3300",
      website: websiteObj?.value || "",
      logoUrl: logoUrlObj?.value || "",
      companyName: companyNameObj?.value || "Prestige Advisors",
      socialMediaRaw: socialMediaObj?.value || "[]",
    };
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error) || String(error);
    console.error("Failed to fetch business contact details:", errorMsg, error);
    return {
      success: false,
      error: errorMsg,
      email: "info@prestigeadvisors360.com",
      phone: "941-799-3300",
      website: "",
      logoUrl: "",
      companyName: "Prestige Advisors",
      socialMediaRaw: "[]",
    };
  }
}

export async function updateBusinessContact(email: string, phone: string) {
  try {
    // Security Check: Only authenticated users with admin role can modify settings.
    await verifyAdmin();

    // Upsert email
    const { error: emailError } = await supabaseServer
      .from("keyvals")
      .upsert({ id: "BUSINESS_EMAIL", value: email, updatedAt: new Date().toISOString() });

    if (emailError) throw emailError;

    // Upsert phone
    const { error: phoneError } = await supabaseServer
      .from("keyvals")
      .upsert({ id: "BUSINESS_PHONE", value: phone, updatedAt: new Date().toISOString() });

    if (phoneError) throw phoneError;

    revalidatePath("/dashboard/admin");
    return { success: true };
  } catch (error) {
    console.error("Failed to update business contact details:", error);
    return { success: false, error: (error as Error).message };
  }
}

export async function updatePortalSettings(
  email: string,
  phone: string,
  website: string,
  logoUrl: string,
  companyName: string,
  socialMediaRaw: string,
) {
  try {
    // Security Check: Only authenticated users with admin role can modify settings.
    await verifyAdmin();

    const updatedAt = new Date().toISOString();

    const { error } = await supabaseServer.from("keyvals").upsert([
      { id: "BUSINESS_EMAIL", value: email, updatedAt },
      { id: "BUSINESS_PHONE", value: phone, updatedAt },
      { id: "BUSINESS_WEBSITE", value: website, updatedAt },
      { id: "COMPANY_LOGO_URL", value: logoUrl, updatedAt },
      { id: "COMPANY_NAME", value: companyName, updatedAt },
      { id: "PORTAL_SOCIAL_MEDIA", value: socialMediaRaw, updatedAt },
    ]);

    if (error) throw error;

    revalidatePath("/dashboard/admin");
    revalidatePath("/dashboard/admin/portal-settings");
    return { success: true };
  } catch (error) {
    console.error("Failed to update portal settings:", error);
    return { success: false, error: (error as Error).message };
  }
}
