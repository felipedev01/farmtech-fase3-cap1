import type { Metadata } from "next";
import Link from "next/link";
import { Database, Gauge, Sprout } from "lucide-react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Farm Tech Solutions",
  description: "Dashboard do circuito Wokwi de irrigação e leituras Oracle.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        <div className="app-shell">
          <aside className="sidebar" aria-label="Navegação principal">
            <Link className="brand" href="/dados" aria-label="Ir para dados">
              <span className="brand-mark">
                <Sprout size={24} aria-hidden="true" />
              </span>
              <span>
                <strong className="brand-title">Farm Tech Solutions</strong>
                <span className="brand-subtitle">FIAP Fase 3 - Cap 1</span>
              </span>
            </Link>
            <nav className="nav-list">
              <Link className="nav-item" href="/dados">
                <Database size={18} aria-hidden="true" />
                Dados
              </Link>
              <Link className="nav-item" href="/circuito">
                <Gauge size={18} aria-hidden="true" />
                Circuito
              </Link>
            </nav>
          </aside>
          <main className="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
