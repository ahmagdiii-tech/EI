import { Card, PageTitle } from "@/components/ui/card";
import { getOrgContext, listTemplates } from "@/lib/ui-data";

export default async function TemplatesPage() {
  const [{ permissions }, templates] = await Promise.all([getOrgContext(), listTemplates()]);
  const canCreate = permissions.has("agent.create");
  return (
    <main>
      <PageTitle title="Agent templates" description="Start from EI templates stored in the database." />
      <div className="grid gap-4 md:grid-cols-2">
        {templates.map((template) => (
          <Card key={template.id}>
            <h2 className="text-xl font-semibold">{template.name}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{template.description}</p>
            {canCreate ? <a className="mt-4 inline-block rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white" href={`/agents/new?templateId=${template.id}`}>Use template</a> : null}
          </Card>
        ))}
      </div>
    </main>
  );
}
