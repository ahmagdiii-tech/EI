import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissionKeys = [
  "organization.manage",
  "member.invite",
  "member.manage",
  "agent.template.read",
  "agent.create",
  "agent.read",
  "agent.update",
  "agent.delete",
  "agent.run",
  "agent.version.create",
  "agent.version.activate",
  "tool.read",
  "tool.manage",
  "knowledge.upload",
  "knowledge.read",
  "deployment.request.create",
  "deployment.request.read",
  "deployment.request.manage",
  "run.read",
  "run.manage",
  "audit.read",
  "security.read",
  "settings.manage"
] as const;

const rolePermissions: Record<string, readonly string[]> = {
  owner: permissionKeys,
  admin: permissionKeys,
  builder: [
    "agent.template.read",
    "agent.create",
    "agent.read",
    "agent.update",
    "agent.run",
    "agent.version.create",
    "agent.version.activate",
    "tool.read",
    "knowledge.upload",
    "knowledge.read",
    "deployment.request.create",
    "run.read"
  ],
  operator: ["agent.template.read", "agent.read", "agent.run", "deployment.request.create", "run.read"],
  viewer: ["agent.template.read", "agent.read", "run.read", "deployment.request.read"]
};

const templates = [
  ["business_email", "Business Email Agent", "Drafts professional business email responses.", "Draft a clear, concise, and professional business email for the requested situation."],
  ["tender_analyzer", "Tender Analyzer Agent", "Extracts tender requirements and evaluation notes.", "Analyze tender content and identify requirements, deadlines, risks, and evaluation criteria."],
  ["quotation_writer", "Quotation Writer Agent", "Creates quotation text from structured requirements.", "Write a polished quotation using the supplied scope, pricing notes, and terms."],
  ["invoice_data_extractor", "Invoice Data Extractor Agent", "Extracts key fields from invoice text.", "Extract invoice number, supplier, dates, totals, taxes, and line item summaries."],
  ["supplier_comparison", "Supplier Comparison Agent", "Compares supplier options against business criteria.", "Compare suppliers using price, quality, delivery, risk, and fit, then recommend next steps."],
  ["hr_cv_screener", "HR CV Screener Agent", "Screens CV text against role requirements.", "Evaluate the CV against the role requirements and summarize fit, gaps, and interview questions."],
  ["contract_summary", "Contract Summary Agent", "Summarizes contract clauses and risks.", "Summarize the contract, key obligations, dates, payment terms, termination rights, and risks."],
  ["arabic_english_translator", "Arabic-English Translator Agent", "Translates between Arabic and English for business use.", "Translate the supplied text accurately while preserving business tone and formatting."],
  ["customer_support_faq", "Customer Support FAQ Agent", "Answers customer questions from supplied FAQ context.", "Answer customer questions clearly using only the supplied FAQ context and note missing information."],
  ["meeting_summary", "Meeting Summary Agent", "Turns meeting notes into summaries and actions.", "Summarize the meeting into decisions, action items, owners, dates, and unresolved questions."]
] as const;

const tools = ["text_generation", "document_summary", "translation", "structured_extraction", "reviewer", "final_editor"] as const;

async function main() {
  for (const key of permissionKeys) {
    await prisma.permission.upsert({
      where: { key },
      update: {},
      create: { key, description: `Allows ${key.replaceAll(".", " ")}` }
    });
  }

  for (const [key, name, description, defaultInstructions] of templates) {
    await prisma.agentTemplate.upsert({
      where: { key },
      update: { name, description, defaultInstructions },
      create: {
        key,
        name,
        description,
        defaultInstructions,
        defaultRiskLevel: "LOW",
        defaultConfig: { temperature: 0.2, maxOutputTokens: 1200 }
      }
    });
  }

  for (const key of tools) {
    await prisma.toolDefinition.upsert({
      where: { key },
      update: { enabled: true },
      create: {
        key,
        name: key.split("_").map((part) => part[0].toUpperCase() + part.slice(1)).join(" "),
        description: `EI runtime tool for ${key.replaceAll("_", " ")}.`,
        inputSchema: { type: "object" },
        outputSchema: { type: "object" },
        enabled: true
      }
    });
  }

  const org = await prisma.organization.upsert({
    where: { slug: process.env.EI_DEMO_ORG_SLUG ?? "ei-demo" },
    update: {},
    create: { name: "EI Demo", slug: process.env.EI_DEMO_ORG_SLUG ?? "ei-demo" }
  });

  await prisma.securityPolicy.upsert({
    where: { organizationId_key: { organizationId: org.id, key: "runtime_limits" } },
    update: { values: { maxHighRiskRunsPerDay: 0, defaultMaxRuntimeMs: 30000, defaultMaxToolCalls: 3 } },
    create: {
      organizationId: org.id,
      key: "runtime_limits",
      values: { maxHighRiskRunsPerDay: 0, defaultMaxRuntimeMs: 30000, defaultMaxToolCalls: 3 }
    }
  });

  const permissions = await prisma.permission.findMany();
  const permissionIdByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));

  for (const [key, permissionList] of Object.entries(rolePermissions)) {
    const role = await prisma.role.upsert({
      where: { organizationId_key: { organizationId: org.id, key } },
      update: { name: key[0].toUpperCase() + key.slice(1) },
      create: { organizationId: org.id, key, name: key[0].toUpperCase() + key.slice(1) }
    });

    for (const permissionKey of permissionList) {
      const permissionId = permissionIdByKey.get(permissionKey);
      if (!permissionId) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId } },
        update: {},
        create: { roleId: role.id, permissionId }
      });
    }
  }

  const user = await prisma.user.upsert({
    where: { email: process.env.EI_DEMO_USER_EMAIL ?? "owner@ei.local" },
    update: { name: "EI Owner" },
    create: { email: process.env.EI_DEMO_USER_EMAIL ?? "owner@ei.local", name: "EI Owner" }
  });

  const member = await prisma.organizationMember.upsert({
    where: { organizationId_userId: { organizationId: org.id, userId: user.id } },
    update: { status: "ACTIVE" },
    create: { organizationId: org.id, userId: user.id, status: "ACTIVE" }
  });

  const ownerRole = await prisma.role.findUniqueOrThrow({ where: { organizationId_key: { organizationId: org.id, key: "owner" } } });
  await prisma.memberRole.upsert({
    where: { memberId_roleId: { memberId: member.id, roleId: ownerRole.id } },
    update: {},
    create: { memberId: member.id, roleId: ownerRole.id }
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
