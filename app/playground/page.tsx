import { Card, PageTitle } from "@/components/ui/card";
import { runAgentAction } from "@/lib/actions/agent-actions";
import { getOrgContext, listAgents } from "@/lib/ui-data";

export default async function PlaygroundPage() {
  const { organization, permissions } = await getOrgContext();
  const agents = await listAgents(organization.id);
  if (!permissions.has("agent.run")) return <PageTitle title="Playground" description="You do not have permission to run EI agents." />;
  return (
    <main>
      <PageTitle title="Playground" description="Select an EI agent, enter a prompt, and persist a runtime trace." />
      <Card><form action={runAgentAction} className="space-y-4"><select name="agentId" className="w-full rounded-lg border p-3" required>{agents.map((agent) => <option key={agent.id} value={agent.id}>{agent.name}</option>)}</select><textarea name="input" required className="min-h-40 w-full rounded-lg border p-3" placeholder="Prompt" /><button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Run</button></form></Card>
    </main>
  );
}
