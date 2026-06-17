"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
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
  Building2,
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
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
    if (plano === "expertise") return "Expertise";
    if (plano === "owner") return "Acesso Master";

    return plano;
  }

  const menu = useMemo(
    () => [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Agenda", href: "/agenda", icon: CalendarDays },
      { label: "Clientes", href: "/clientes", icon: Users },
      { label: "Calculadora", href: "/calculadora-show", icon: Calculator },
      { label: "Financeiro", href: "/financeiro", icon: DollarSign },
      { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
      { label: "CRM", href: "/crm", icon: Building2 },
      { label: "Formatos", href: "/formatos", icon: Music },
      { label: "Colaboradores", href: "/colaboradores", icon: UserCog },
      { label: "Contratos", href: "/contratos", icon: FileText },
      { label: "Configurações", href: "/configuracoes", icon: Settings },
      { label: "Assinatura", href: "/assinatura", icon: CreditCard },
    ],
    []
  );

  return (
    <div style={appShellStyle}>
      {isMobile && !mobileOpen && (
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          style={mobileMenuButtonStyle}
        >
          <Menu size={22} />
        </button>
      )}

      {mobileOpen && isMobile && (
        <div onClick={() => setMobileOpen(false)} style={mobileOverlayStyle} />
      )}

      <aside
        style={{
          ...sidebarStyle,
          position: "fixed",
          left: isMobile ? (mobileOpen ? "0" : "-292px") : "0",
        }}
      >
        <div style={sidebarInnerStyle}>
          <div style={sidebarTopStyle}>
            <div style={logoAreaStyle}>
              <img
                src="/logo-giba-horizontal.png"
                alt="Logo GIBA"
                style={logoStyle}
              />
            </div>

            {isMobile && (
              <button
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar menu"
                style={closeButtonStyle}
              >
                <X size={20} />
              </button>
            )}
          </div>

          <nav style={navStyle}>
            {menu.map((item) => {
              const ativo =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => isMobile && setMobileOpen(false)}
                  style={{
                    ...menuItemStyle,
                    ...(ativo ? activeMenuItemStyle : inactiveMenuItemStyle),
                  }}
                >
                  <span
                    style={{
                      ...menuIconStyle,
                      ...(ativo ? activeIconStyle : inactiveIconStyle),
                    }}
                  >
                    <Icon size={18} />
                  </span>

                  <span style={menuLabelStyle}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div style={footerStyle}>
            <div style={userCardStyle}>
              <div style={userTopStyle}>
                <div style={avatarStyle}>
                  {nomeUsuarioSidebar().slice(0, 1).toUpperCase()}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <p style={userNameStyle}>{nomeUsuarioSidebar()}</p>
                  <p style={userRoleStyle}>{nomePlano(assinatura?.plano)}</p>
                </div>
              </div>

              <p style={renewTextStyle}>
                Vencimento: {formatarData(assinatura?.data_fim)}
              </p>

              <Link href="/login" style={logoutButtonStyle}>
                <LogOut size={16} />
                Sair do sistema
              </Link>
            </div>
          </div>
        </div>
      </aside>

      <main
        style={{
          ...mainStyle,
          marginLeft: isMobile ? "0" : "280px",
          padding: isMobile ? "88px 16px 24px" : "30px",
          overflowX: "hidden",
          maxWidth: isMobile ? "100vw" : "none",
        }}
      >
        {children}
      </main>
    </div>
  );
}

const appShellStyle: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  color: "#fff",
  fontFamily:
    'Inter, Arial, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  overflow: "hidden",
  width: "100%",
  maxWidth: "100vw",
  background:
    "radial-gradient(circle at 15% 0%, rgba(139,53,255,0.18), transparent 32%), radial-gradient(circle at 85% 10%, rgba(0,170,255,0.14), transparent 34%), linear-gradient(135deg, #050510, #070B16 45%, #00172F)",
};

const mobileMenuButtonStyle: React.CSSProperties = {
  position: "fixed",
  top: "calc(18px + env(safe-area-inset-top, 0px))",
  left: "16px",
  zIndex: 900,
  border: "1px solid rgba(255,255,255,0.16)",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  width: "48px",
  height: "48px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#fff",
  cursor: "pointer",
  boxShadow: "0 16px 35px rgba(0,0,0,0.35)",
  backdropFilter: "blur(14px)",
};

const mobileOverlayStyle: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.62)",
  backdropFilter: "blur(4px)",
  zIndex: 998,
};

const sidebarStyle: React.CSSProperties = {
  width: "280px",
  minWidth: "280px",
  height: "100vh",
  background: "rgba(7,11,22,0.82)",
  borderRight: "1px solid rgba(255,255,255,0.10)",
  top: 0,
  zIndex: 1000,
  transition: "all 0.32s ease",
  backdropFilter: "blur(18px)",
  boxShadow: "18px 0 55px rgba(0,0,0,0.25)",
};

const sidebarInnerStyle: React.CSSProperties = {
  height: "100%",
  display: "flex",
  flexDirection: "column",
  padding: "22px 14px 16px",
  boxSizing: "border-box",
  minWidth: 0,
};

const sidebarTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "10px",
  marginBottom: "18px",
  padding: "0 4px",
  flexShrink: 0,
};

const logoAreaStyle: React.CSSProperties = {
  width: "100%",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const logoStyle: React.CSSProperties = {
  width: "148px",
  height: "auto",
  objectFit: "contain",
};

const closeButtonStyle: React.CSSProperties = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.12)",
  background: "rgba(255,255,255,0.06)",
  color: "#fff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
};

const navStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  display: "flex",
  flexDirection: "column",
  gap: "5px",
  overflowY: "auto",
  overflowX: "hidden",
  padding: "0 0 12px",
  scrollbarWidth: "none",
  msOverflowStyle: "none",
};

const menuItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "12px",
  padding: "10px 10px",
  borderRadius: "14px",
  color: "#fff",
  textDecoration: "none",
  fontSize: "14px",
  transition: "0.22s ease",
  border: "1px solid transparent",
  minHeight: "43px",
  boxSizing: "border-box",
};

const activeMenuItemStyle: React.CSSProperties = {
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  border: "1px solid rgba(255,255,255,0.22)",
  boxShadow: "0 15px 32px rgba(139,53,255,0.25)",
  fontWeight: 800,
};

const inactiveMenuItemStyle: React.CSSProperties = {
  background: "transparent",
  color: "#CBD5E1",
  fontWeight: 600,
};

const menuIconStyle: React.CSSProperties = {
  width: "30px",
  height: "30px",
  minWidth: "30px",
  borderRadius: "11px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
};

const activeIconStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.16)",
  color: "#FFFFFF",
};

const inactiveIconStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.045)",
  color: "#94A3B8",
};

const menuLabelStyle: React.CSSProperties = {
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const footerStyle: React.CSSProperties = {
  flexShrink: 0,
  paddingTop: "12px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const userCardStyle: React.CSSProperties = {
  padding: "13px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.055)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 20px 45px rgba(0,0,0,0.18)",
};

const userTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "11px",
};

const avatarStyle: React.CSSProperties = {
  width: "42px",
  height: "42px",
  minWidth: "42px",
  borderRadius: "16px",
  background: "linear-gradient(135deg, #8B35FF, #00AAFF)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontWeight: 900,
  boxShadow: "0 14px 28px rgba(0,170,255,0.16)",
};

const userNameStyle: React.CSSProperties = {
  margin: 0,
  color: "#FFFFFF",
  fontSize: "14px",
  fontWeight: 800,
  overflow: "hidden",
  whiteSpace: "nowrap",
  textOverflow: "ellipsis",
};

const userRoleStyle: React.CSSProperties = {
  margin: "3px 0 0",
  color: "#94A3B8",
  fontSize: "12px",
};

const renewTextStyle: React.CSSProperties = {
  margin: "12px 0 0",
  color: "#94A3B8",
  fontSize: "11px",
};

const logoutButtonStyle: React.CSSProperties = {
  marginTop: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "9px",
  padding: "10px",
  borderRadius: "14px",
  color: "#FFFFFF",
  textDecoration: "none",
  background: "rgba(255,255,255,0.065)",
  border: "1px solid rgba(255,255,255,0.10)",
  fontSize: "13px",
  fontWeight: 800,
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  minWidth: 0,
  height: "100vh",
  overflowY: "auto",
  overflowX: "hidden",
  width: "100%",
  boxSizing: "border-box",
};
