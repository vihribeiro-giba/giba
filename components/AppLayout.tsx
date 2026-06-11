"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

import {
  LayoutDashboard,
  CalendarDays,
  Users,
  DollarSign,
  Calculator,
  BarChart3,
  Music,
  UserCog,
  Settings,
  CreditCard,
  LogOut,
  Menu,
  X,
  FileText,
} from "lucide-react";

type AssinaturaResumo = {
  plano: string;
  status: string;
  data_fim?: string | null;
};

type EmpresaResumo = {
  nome_artistico?: string | null;
  razao_social?: string | null;
  responsavel?: string | null;
};

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [assinatura, setAssinatura] = useState<AssinaturaResumo | null>(null);
  const [empresa, setEmpresa] = useState<EmpresaResumo | null>(null);

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

  useEffect(() => {
    carregarAssinaturaResumo();
    carregarEmpresaResumo();
  }, []);

  async function carregarAssinaturaResumo() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data, error } = await supabase
      .from("subscriptions")
      .select("plano,status,data_fim")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar resumo da assinatura:", error);
      return;
    }

    if (data) {
      setAssinatura(data as AssinaturaResumo);
    }
  }

  async function carregarEmpresaResumo() {
    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) return;

    const { data, error } = await supabase
      .from("company_settings")
      .select("nome_artistico,razao_social,responsavel")
      .eq("user_id", authData.user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Erro ao carregar resumo da empresa:", error);
      return;
    }

    if (data) {
      setEmpresa(data as EmpresaResumo);
    }
  }

  function nomeUsuarioSidebar() {
    return (
      empresa?.nome_artistico?.trim() ||
      empresa?.razao_social?.trim() ||
      empresa?.responsavel?.trim() ||
      "Usuário GIBA"
    );
  }

  function formatarData(data?: string | null) {
    if (!data) return "-";

    return new Date(data).toLocaleDateString("pt-BR");
  }

  function nomePlano(plano?: string) {
    if (!plano) return "Sem plano";

    if (plano === "teste") return "Teste";
    if (plano === "essencial") return "Essencial";
    if (plano === "profissional") return "Profissional";

    return plano;
  }

  const menu = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Agenda", href: "/agenda", icon: CalendarDays },
    { label: "Clientes", href: "/clientes", icon: Users },
    { label: "Calculadora", href: "/calculadora-show", icon: Calculator },
    { label: "Financeiro", href: "/financeiro", icon: DollarSign },
    { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
    { label: "Formatos", href: "/formatos", icon: Music },
    { label: "Colaboradores", href: "/colaboradores", icon: UserCog },
    { label: "Contratos", href: "/contratos", icon: FileText },
    { label: "Configurações", href: "/configuracoes", icon: Settings },
    { label: "Assinatura", href: "/assinatura", icon: CreditCard },
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
          justifyContent: "flex-start",
          gap: "18px",
          boxSizing: "border-box",
          overflowY: "auto",
          overflowX: "hidden",

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
        <div style={{ flexShrink: 0 }}>
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
              gap: "12px",
              paddingBottom: "4px",
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
        <div
          style={{
            marginTop: "8px",
            paddingTop: "8px",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              marginBottom: "12px",
              padding: "14px",
              borderRadius: "18px",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.10)",
            }}
          >
            <p style={{ margin: 0, fontWeight: "bold" }}>
              {nomeUsuarioSidebar()}
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

            <div
              style={{
                marginTop: "12px",
                paddingTop: "10px",
                borderTop: "1px solid rgba(255,255,255,0.10)",
              }}
            >
              <p
                style={{
                  margin: 0,
                  color: "#dbeafe",
                  fontSize: "13px",
                  fontWeight: "bold",
                }}
              >
                Plano: {nomePlano(assinatura?.plano)}
              </p>

              <p
                style={{
                  marginTop: "5px",
                  marginBottom: 0,
                  color: "#b8b8d8",
                  fontSize: "12px",
                }}
              >
                Vencimento: {formatarData(assinatura?.data_fim)}
              </p>
            </div>
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