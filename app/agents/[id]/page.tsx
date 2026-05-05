import { notFound } from "next/navigation";
import { Card, PageTitle } from "@/components/ui/card";
import { runAgentAction } from "@/lib/actions/agent-actions";
import { getAgent, getOrgContext } from "@/lib/ui-data";

export default async function AgentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { organization, permissions } = await getOrgContext();
  const agent = await getAgent(organization.id, id);
  if (!agent) notFound();
  return (
    <main>
      <PageTitle title={agent.name} description={agent.description ?? "EI agent"} />
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold">Metadata</h2>
          <dl className="mt-3 space-y-2 text-sm"><div>Risk: {agent.riskLevel}</div><div>Visibility: {agent.visibility}</div><div>Requires approval: {agent.requiresApproval ? "Yes" : "No"}</div><div>Max runtime: {agent.maxRuntimeMs} ms</div><div>Max tool calls: {agent.maxToolCalls}</div></dl>
        </Card>
        <Card>
          <h2 className="font-semibold">Active version</h2>
          <p className="mt-2 text-sm text-muted-foreground">{agent.activeVersion ? `${agent.activeVersion.name} v${agent.activeVersion.version}` : "No active version"}</p>
          <p className="mt-4 text-sm">Tools: {agent.toolPermissions.map((permission) => permission.toolDefinition.key).join(", ")}</p>
        </Card>
      </div>
      {permissions.has("agent.run") ? <Card><form action={runAgentAction} className="mt-6 space-y-4"><input type="hidden" name="agentId" value={agent.id} /><textarea name="input" required className="min-h-32 w-full rounded-lg border p-3" placeholder="Enter an EI run prompt" /><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Run agent</button></form></Card> : null}
    </main>
  );
}
