import { notFound } from "next/navigation";
import { Card, PageTitle } from "@/components/ui/card";
import { getOrgContext, getRun } from "@/lib/ui-data";

export default async function RunDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, permissions } = await getOrgContext();
  if (!permissions.has("run.read")) return <PageTitle title="Run" description="You do not have permission to view this EI run." />;
  const run = await getRun(organization.id, id);
  if (!run) notFound();
  return <main><PageTitle title={`Run ${run.status}`} description={run.input} /><div className="grid gap-4"><Card><h2 className="font-semibold">Final answer</h2><pre className="mt-3 whitespace-pre-wrap text-sm">{run.finalAnswer?.content ?? "No final answer"}</pre></Card><Card><h2 className="font-semibold">Agent runs</h2>{run.agentRuns.map((agentRun) => <p className="mt-2 text-sm" key={agentRun.id}>{agentRun.agent.name} · version {agentRun.agentVersion.version} · {agentRun.status}</p>)}</Card><Card><h2 className="font-semibold">Event timeline</h2>{run.events.map((event) => <div className="mt-3 border-l pl-3 text-sm" key={event.id}><p className="font-medium">{event.type}</p><p className="text-muted-foreground">{event.message}</p></div>)}</Card></div></main>;
}
