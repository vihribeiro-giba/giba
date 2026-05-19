"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  Music,
  UserCog,
  Settings,
  LogOut,
  Menu,
  X,
  FileText,
} from "lucide-react";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const verificarTela = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    verificarTela();

    window.addEventListener("resize", verificarTela);

    return () => {
      window.removeEventListener("resize", verificarTela);
    };
  }, []);

  const menu = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Agenda", href: "/agenda", icon: CalendarDays },
    { label: "Clientes", href: "/clientes", icon: Users },
    { label: "Financeiro", href: "/financeiro", icon: DollarSign },
    { label: "Formatos", href: "/formatos", icon: Music },
    { label: "Colaboradores", href: "/colaboradores", icon: UserCog },
    { label: "Contratos", href: "/contratos", icon: FileText },
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
        overflow: "hidden",
      }}
    >
      {/* BOTÃO MOBILE */}
      {isMobile && (
        <button
          onClick={() => setMobileOpen(true)}
          style={{
            position: "fixed",
            top: "18px",
            left: "18px",
            zIndex: 9999,
            border: "none",
            borderRadius: "12px",
            background: "linear-gradient(90deg, #8b35ff, #00aaff)",
            width: "48px",
            height: "48px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(0,0,0,0.35)",
          }}
        >
          <Menu size={24} />
        </button>
      )}

      {/* OVERLAY MOBILE */}
      {mobileOpen && isMobile && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            zIndex: 999,
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        style={{
          width: "280px",
          minWidth: "280px",
          height: "100vh",
          padding: "24px",
          background: "rgba(0,0,0,0.42)",
          borderRight: "1px solid rgba(255,255,255,0.10)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          boxSizing: "border-box",

          position: isMobile ? "fixed" : "relative",
          left: isMobile
            ? mobileOpen
              ? "0"
              : "-320px"
            : "0",

          top: 0,
          zIndex: 1000,

          transition: "all 0.35s ease",
          backdropFilter: "blur(12px)",
        }}
      >
        <div>
          {/* TOPO */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                width: "100%",
                display: "flex",
                justifyContent: "center",
              }}
            >
              <img
                src="/logo-giba-horizontal.png"
                alt="Logo GIBA"
                style={{
                  width: "190px",
                  height: "auto",
                  objectFit: "contain",
                }}
              />
            </div>

            {isMobile && (
              <button
                onClick={() => setMobileOpen(false)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                }}
              >
                <X size={24} />
              </button>
            )}
          </div>

          {/* MENU */}
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
                  onClick={() => isMobile && setMobileOpen(false)}
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

                    transition: "0.25s",
                  }}
                >
                  <Icon size={22} />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* RODAPÉ */}
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

      {/* CONTEÚDO */}
      <main
        style={{
          flex: 1,
          padding: isMobile ? "90px 18px 18px 18px" : "32px",
          overflowY: "auto",
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        {children}
      </main>
    </div>
  );
}