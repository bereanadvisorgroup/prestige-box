import { type NextRequest, NextResponse } from "next/server";

import { getAuthenticatedUser, supabaseAdmin } from "@/lib/supabase.server";

export async function POST(_request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized. Please sign in again." }, { status: 401 });
    }

    const { data: factorsData, error: listError } = await supabaseAdmin.auth.admin.mfa.listFactors({
      userId: user.id,
    });

    if (listError) {
      console.error("Error listing MFA factors:", listError);
      return NextResponse.json({ error: listError.message || "Failed to list MFA factors" }, { status: 500 });
    }

    const factors = factorsData?.factors || [];
    for (const factor of factors) {
      const { error: deleteError } = await supabaseAdmin.auth.admin.mfa.deleteFactor({
        id: factor.id,
        userId: user.id,
      });

      if (deleteError) {
        console.error(`Failed to delete factor ${factor.id}:`, deleteError);
      }
    }

    return NextResponse.json({ success: true, message: "MFA factors reset successfully." });
  } catch (err: unknown) {
    const error = err as { message?: string };
    console.error("Error in MFA reset API route:", error);
    return NextResponse.json({ error: error.message || "An unexpected error occurred." }, { status: 500 });
  }
}
