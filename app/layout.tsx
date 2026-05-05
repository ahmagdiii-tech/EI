import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = { title: "EI", description: "EI agent builder foundation" };

const nav = [
  ["Templates", "/templates"],
  ["Agents", "/agents"],
  ["Playground", "/playground"],
  ["Runs", "/runs"]
];

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <div className="mx-auto max-w-6xl px-6 py-8">
          <header className="mb-8 flex items-center justify-between rounded-2xl border bg-white p-5 shadow-sm">
            <Link href="/templates" className="text-2xl font-bold">EI</Link>
            <nav className="flex gap-4 text-sm font-medium text-muted-foreground">
              {nav.map(([label, href]) => <Link key={href} href={href} className="hover:text-foreground">{label}</Link>)}
            </nav>
          </header>
          {children}
        </div>
      </body>
    </html>
  );
}
