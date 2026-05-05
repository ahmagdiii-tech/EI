import { Card, PageTitle } from "@/components/ui/card";
import { createAgentAction } from "@/lib/actions/agent-actions";
import { getOrgContext, listTemplates } from "@/lib/ui-data";

export default async function NewAgentPage({ searchParams }: { searchParams: Promise<{ templateId?: string }> }) {
  const [{ permissions }, templates, params] = await Promise.all([getOrgContext(), listTemplates(), searchParams]);
  if (!permissions.has("agent.create")) return <PageTitle title="New agent" description="You do not have permission to create EI agents." />;
  return (
    <main>
      <PageTitle title="New agent" description="Create an organization-scoped agent from a database template." />
      <Card>
        <form action={createAgentAction} className="space-y-4">
          <label className="block text-sm font-medium">Template</label>
          <select name="templateId" defaultValue={params.templateId} className="w-full rounded-lg border p-3" required>
            {templates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
          </select>
          <label className="block text-sm font-medium">Agent name</label>
          <input name="name" className="w-full rounded-lg border p-3" placeholder="Optional custom name" />
          <button className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Create agent</button>
        </form>
      </Card>
    </main>
  );
}
