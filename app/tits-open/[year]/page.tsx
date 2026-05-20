import { notFound } from "next/navigation";
import { TitsOpenEditionView } from "@/components/tournaments/tits-open-edition-view";
import { requireUser } from "@/lib/auth-utils";
import { getTitsOpenEditionByYear, listTitsOpenEditions } from "@/lib/tournaments";

export const dynamic = "force-dynamic";

export default async function TitsOpenYearPage({
  params,
}: {
  params: Promise<{ year: string }>;
}) {
  const user = await requireUser();
  const { year: rawYear } = await params;
  const year = Number(rawYear);
  if (!Number.isInteger(year)) notFound();

  const [edition, editions] = await Promise.all([
    getTitsOpenEditionByYear(year),
    listTitsOpenEditions(),
  ]);
  if (!edition) notFound();

  return (
    <TitsOpenEditionView
      edition={edition}
      editions={editions.map((item) => ({
        year: item.year,
        title: item.title,
        status: item.status,
      }))}
      isAdmin={user.isAdmin}
    />
  );
}
