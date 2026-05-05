import Link from "next/link";
import { Card, PageTitle } from "@/components/ui/card";
import { getOrgContext, listAgents } from "@/lib/ui-data";

export default async function AgentsPage() {
  const { organization, permissions } = await getOrgContext();
  const agents = await listAgents(organization.id);
  return (
    <main>
      <div className="flex items-start justify-between gap-4">
        <PageTitle title="Agents" description="Organization-scoped EI agents and their active versions." />
        {permissions.has("agent.create") ? <Link className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" href="/agents/new">New agent</Link> : null}
      </div>
      <div className="grid gap-4">
        {agents.map((agent) => (
          <Card key={agent.id}>
            <Link href={`/agents/${agent.id}`} className="text-xl font-semibold hover:underline">{agent.name}</Link>
            <p className="mt-2 text-sm text-muted-foreground">{agent.description}</p>
            <p className="mt-3 text-xs uppercase tracking-wide text-muted-foreground">{agent.riskLevel} risk · {agent.visibility} · active version {agent.activeVersion?.version ?? "none"}</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
