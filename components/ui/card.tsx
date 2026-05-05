import type { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-2xl border bg-white p-5 shadow-sm">{children}</div>;
}

export function PageTitle({ title, description }: { title: string; description: string }) {
  return <div className="mb-6"><h1 className="text-3xl font-bold">{title}</h1><p className="mt-2 text-muted-foreground">{description}</p></div>;
}
