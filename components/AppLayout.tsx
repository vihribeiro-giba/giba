"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  Music,
  UserCog,
  Settings,
  LogOut,
} from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const menu = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Agenda", href: "/agenda", icon: CalendarDays },
    { label: "Clientes", href: "/clientes", icon: Users },
    { label: "Financeiro", href: "/financeiro", icon: DollarSign },
    { label: "Formatos", href: "/formatos", icon: Music },
    { label: "Colaboradores", href: "/colaboradores", icon: UserCog },
    { label: "Configurações", href: "/configuracoes", icon: Settings },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "linear-gradient(135deg, #050510, #12001f, #00172f)",
        color: "#fff",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <aside
        style={{
          width: "280px",
          minWidth: "280px",
          minHeight: "100vh",
          padding: "24px",
          background: "rgba(0,0,0,0.42)",
          borderRight: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",
        }}
      >
        <div>
          <div
            style={{
              width: "100%",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              marginBottom: "20px",
              paddingTop: "6px",
            }}
          >
            <img
              src="/logo-giba-horizontal.png"
              alt="Logo GIBA"
              style={{
                width: "360px",
                height: "auto",
                objectFit: "contain",
                display: "block",
              }}
            />
          </div>

          <nav
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            {menu.map((item) => {
              const ativo = pathname === item.href;
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "14px",
                    padding: "16px",
                    borderRadius: "16px",
                    color: "#fff",
                    textDecoration: "none",
                    background: ativo
                      ? "linear-gradient(90deg, #8b35ff, #00aaff)"
                      : "rgba(255,255,255,0.06)",
                    border: ativo
                      ? "1px solid rgba(255,255,255,0.25)"
                      : "1px solid rgba(255,255,255,0.10)",
                    boxShadow: ativo
                      ? "0 0 25px rgba(139,53,255,0.35)"
                      : "none",
                    fontWeight: ativo ? "bold" : "normal",
                  }}
                >
                  <Icon size={22} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div>
          <div
            style={{
              marginBottom: "18px",
              padding: "16px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <p style={{ margin: 0, fontWeight: "bold" }}>
              Vinícius Ribeiro
            </p>
            <p
              style={{
                marginTop: "6px",
                marginBottom: 0,
                color: "#b8b8d8",
                fontSize: "14px",
              }}
            >
              Administrador
            </p>
          </div>

          <Link
            href="/login"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "12px",
              padding: "16px",
              borderRadius: "16px",
              color: "#ff9ea8",
              textDecoration: "none",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <LogOut size={20} />
            Sair do sistema
          </Link>
        </div>
      </aside>

      <main
        style={{
          flex: 1,
          padding: "32px",
          overflowY: "auto",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
    </div>
  );
}