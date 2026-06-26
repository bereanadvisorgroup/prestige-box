import { type NextRequest, NextResponse } from "next/server";

import { syncAllAutoTasks } from "@/actions/task-sync";

// Daily roll-forward of birthday/anniversary/renewal auto tasks.
// Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` automatically when CRON_SECRET is set.
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await syncAllAutoTasks();
  return NextResponse.json(result, { status: result.success ? 200 : 500 });
}
