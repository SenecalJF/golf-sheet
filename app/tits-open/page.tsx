import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth-utils";
import { getCurrentTitsOpenEdition } from "@/lib/tournaments";

export const dynamic = "force-dynamic";

export default async function TitsOpenPage() {
  await requireUser();
  const edition = await getCurrentTitsOpenEdition();
  if (!edition) redirect("/");
  redirect(`/tits-open/${edition.year}`);
}
