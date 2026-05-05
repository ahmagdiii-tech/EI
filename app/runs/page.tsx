import Link from "next/link";
import { Card, PageTitle } from "@/components/ui/card";
import { getOrgContext, listRuns } from "@/lib/ui-data";

export default async function RunsPage() {
  const { organization, permissions } = await getOrgContext();
  if (!permissions.has("run.read")) return <PageTitle title="Runs" description="You do not have permission to view EI runs." />;
  const runs = await listRuns(organization.id);
  return <main><PageTitle title="Runs" description="Organization-scoped EI runtime history." /><div className="grid gap-4">{runs.map((run) => <Card key={run.id}><Link className="text-lg font-semibold hover:underline" href={`/runs/${run.id}`}>{run.status} run</Link><p className="mt-2 text-sm text-muted-foreground">{run.agentRuns.map((agentRun) => agentRun.agent.name).join(", ") || "No agent run"}</p><p className="mt-2 line-clamp-2 text-sm">{run.finalAnswer?.content ?? run.input}</p></Card>)}</div></main>;
}
