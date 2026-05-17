"use client";

import Link from "next/link";
import { useState } from "react";
import {
  CalendarDays,
  FileText,
  DollarSign,
  Users,
  Music,
  MessageCircle,
  Check,
  Menu,
  X,
} from "lucide-react";

export default function Home() {
  const [menuAberto, setMenuAberto] = useState(false);
  const [moduloAtivo, setModuloAtivo] = useState("Agenda");

  const whatsapp =
    "https://wa.me/5531999999999?text=Olá!%20Quero%20conhecer%20a%20plataforma%20GIBA.";

  const modulos = [
    {
      nome: "Agenda",
      icone: CalendarDays,
      texto:
        "Organize shows, eventos, horários, locais, formatos de apresentação e equipe escalada em um calendário inteligente.",
    },
    {
      nome: "Contratos",
      icone: FileText,
      texto:
        "Gere contratos automáticos com dados do cliente, evento, cachê, forma de pagamento e informações da empresa.",
    },
    {
      nome: "Financeiro",
      icone: DollarSign,
      texto:
        "Controle entradas, saídas, despesas, pagamentos de eventos, faturamento mensal e visão anual.",
    },
    {
      nome: "Clientes",
      icone: Users,
      texto:
        "Cadastre contratantes, contatos, CPF/CNPJ, endereço e mantenha sua base comercial organizada.",
    },
    {
      nome: "Formatos",
      icone: Music,
      texto:
        "Cadastre formatos de show como Voz e Violão, Acústico, All Vibes, Rodinha e Show Principal.",
    },
  ];

  const moduloSelecionado = modulos.find((m) => m.nome === moduloAtivo);

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <img src="/logo-giba-horizontal.png" alt="GIBA" style={logoStyle} />

        <button
          onClick={() => setMenuAberto(!menuAberto)}
          style={mobileButton}
        >
          {menuAberto ? <X size={24} /> : <Menu size={24} />}
        </button>

        <nav
          style={{
            ...navStyle,
            display: menuAberto ? "flex" : undefined,
          }}
        >
          <a href="#funcionalidades" style={navLink}>Funcionalidades</a>
          <a href="#planos" style={navLink}>Planos</a>
          <a href="#whatsapp" style={navLink}>Contato</a>
          <Link href="/login" style={loginButton}>Entrar</Link>
        </nav>
      </header>

      <section style={heroStyle}>
        <div>
          <span style={tagStyle}>Plataforma SaaS para artistas</span>

          <h1 style={titleStyle}>
            Gestão inteligente para bandas, artistas e produtores
          </h1>

          <p style={subtitleStyle}>
            Organize agenda, contratos, clientes, financeiro, formatos de show e
            equipe em uma única plataforma profissional.
          </p>

          <div style={buttonGroup}>
            <Link href="/login" style={primaryButton}>
              Entrar na Plataforma
            </Link>

            <a href={whatsapp} target="_blank" style={secondaryButton}>
              <MessageCircle size={18} />
              Falar no WhatsApp
            </a>
          </div>
        </div>

        <div style={dashboardMockup}>
          <div style={mockupTop}>
            <span style={dotPurple}></span>
            <span style={dotBlue}></span>
            <span style={dotGreen}></span>
          </div>

          <h3 style={{ marginTop: 0 }}>Dashboard GIBA</h3>

          <div style={mockGrid}>
            <div style={mockCard}>
              <small>Eventos</small>
              <strong>12</strong>
            </div>

            <div style={mockCard}>
              <small>Clientes</small>
              <strong>38</strong>
            </div>

            <div style={mockCard}>
              <small>Contratos</small>
              <strong>PDF</strong>
            </div>

            <div style={mockCard}>
              <small>Financeiro</small>
              <strong>Online</strong>
            </div>
          </div>

          <div style={mockLine}></div>
          <div style={{ ...mockLine, width: "70%" }}></div>
          <div style={{ ...mockLine, width: "50%" }}></div>
        </div>
      </section>

      <section style={statsStyle}>
        <div style={statCard}>
          <strong>Agenda</strong>
          <span>Shows organizados por data</span>
        </div>

        <div style={statCard}>
          <strong>Contratos</strong>
          <span>Geração automática</span>
        </div>

        <div style={statCard}>
          <strong>Financeiro</strong>
          <span>Entradas e despesas</span>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitle}>O que é a GIBA?</h2>

        <p style={sectionText}>
          A GIBA é uma plataforma de gestão inteligente desenvolvida para
          artistas, bandas e produtores que desejam profissionalizar a carreira
          musical com mais organização, praticidade e controle.
        </p>
      </section>

      <section id="funcionalidades" style={sectionStyle}>
        <h2 style={sectionTitle}>Funcionalidades da plataforma</h2>

        <div style={interactiveGrid}>
          <div style={moduleList}>
            {modulos.map((modulo) => {
              const Icon = modulo.icone;
              const ativo = moduloAtivo === modulo.nome;

              return (
                <button
                  key={modulo.nome}
                  onClick={() => setModuloAtivo(modulo.nome)}
                  style={{
                    ...moduleButton,
                    background: ativo
                      ? "linear-gradient(90deg, #8b35ff, #00aaff)"
                      : "rgba(255,255,255,0.06)",
                  }}
                >
                  <Icon size={20} />
                  {modulo.nome}
                </button>
              );
            })}
          </div>

          <div style={modulePreview}>
            {moduloSelecionado && (
              <>
                <h3 style={{ fontSize: "28px", marginTop: 0 }}>
                  {moduloSelecionado.nome}
                </h3>

                <p style={sectionText}>{moduloSelecionado.texto}</p>

                <div style={previewBox}>
                  <div style={previewHeader}></div>
                  <div style={previewRow}></div>
                  <div style={previewRow}></div>
                  <div style={{ ...previewRow, width: "65%" }}></div>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitle}>Feita para quem vive da música</h2>

        <div style={cardsGrid}>
          {[
            "Artistas independentes",
            "Bandas",
            "Produtores musicais",
            "Escritórios artísticos",
            "Músicos e equipes",
            "Gestores de eventos",
          ].map((item) => (
            <div key={item} style={featureCard}>
              <Check size={18} />
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="planos" style={sectionStyle}>
        <h2 style={sectionTitle}>Planos</h2>

        <div style={plansGrid}>
          <div style={planCard}>
            <span style={planBadge}>Essencial</span>
            <h3>Para artistas independentes</h3>
            <p style={planSubtitle}>
              Ideal para começar a organizar sua carreira musical.
            </p>

            <h2 style={priceStyle}>Em breve</h2>

            <ul style={listStyle}>
              <li>Agenda de shows</li>
              <li>Cadastro de clientes</li>
              <li>Contratos automáticos</li>
              <li>Dashboard básico</li>
            </ul>

            <a href={whatsapp} target="_blank" style={primaryButton}>
              Quero conhecer
            </a>
          </div>

          <div style={{ ...planCard, border: "1px solid #00aaff" }}>
            <span style={planBadgeBlue}>Profissional</span>
            <h3>Para bandas e produtores</h3>
            <p style={planSubtitle}>
              Para quem precisa de gestão completa de operação artística.
            </p>

            <h2 style={priceStyle}>Em breve</h2>

            <ul style={listStyle}>
              <li>Tudo do Essencial</li>
              <li>Financeiro completo</li>
              <li>Gestão de colaboradores</li>
              <li>Formatos de show</li>
              <li>Controle operacional</li>
            </ul>

            <a href={whatsapp} target="_blank" style={primaryButton}>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section id="whatsapp" style={ctaStyle}>
        <h2>Sua carreira merece gestão profissional.</h2>

        <p>
          Converse com a equipe GIBA e conheça a plataforma criada para artistas,
          bandas e produtores musicais.
        </p>

        <a href={whatsapp} target="_blank" style={primaryButton}>
          <MessageCircle size={18} />
          Conversar no WhatsApp
        </a>
      </section>

      <footer style={footerStyle}>
        © 2026 GIBA — Gestão Inteligente para Bandas e Artistas
      </footer>
    </main>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "linear-gradient(135deg, #050510, #12001f, #00172f)",
  color: "#fff",
  fontFamily: "Arial, sans-serif",
  padding: "28px",
};

const headerStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "70px",
  position: "relative",
};

const logoStyle: React.CSSProperties = {
  width: "180px",
  height: "auto",
};

const mobileButton: React.CSSProperties = {
  display: "none",
  border: "none",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  borderRadius: "12px",
  padding: "10px",
};

const navStyle: React.CSSProperties = {
  display: "flex",
  gap: "18px",
  alignItems: "center",
};

const navLink: React.CSSProperties = {
  color: "#cbd5e1",
  textDecoration: "none",
};

const loginButton: React.CSSProperties = {
  color: "#fff",
  textDecoration: "none",
  padding: "12px 18px",
  borderRadius: "12px",
  background: "rgba(255,255,255,0.08)",
};

const heroStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "1.1fr 0.9fr",
  gap: "44px",
  alignItems: "center",
};

const tagStyle: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 14px",
  borderRadius: "999px",
  background: "rgba(139,53,255,0.18)",
  color: "#c4b5fd",
  marginBottom: "18px",
};

const titleStyle: React.CSSProperties = {
  fontSize: "58px",
  lineHeight: "1.05",
  margin: "0 0 20px",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "20px",
  lineHeight: "1.6",
  color: "#b8b8d8",
  maxWidth: "620px",
};

const buttonGroup: React.CSSProperties = {
  display: "flex",
  gap: "14px",
  marginTop: "28px",
  flexWrap: "wrap",
};

const primaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  padding: "14px 22px",
  borderRadius: "14px",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "bold",
  border: "none",
};

const secondaryButton: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  padding: "14px 22px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.12)",
};

const dashboardMockup: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 0 70px rgba(139,53,255,0.28)",
};

const mockupTop: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  marginBottom: "20px",
};

const dotPurple: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#8b35ff",
};

const dotBlue: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#00aaff",
};

const dotGreen: React.CSSProperties = {
  width: "10px",
  height: "10px",
  borderRadius: "50%",
  background: "#37e884",
};

const mockGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
  marginBottom: "20px",
};

const mockCard: React.CSSProperties = {
  padding: "22px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.10)",
  display: "grid",
  gap: "8px",
};

const mockLine: React.CSSProperties = {
  height: "12px",
  width: "90%",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.10)",
  marginTop: "12px",
};

const statsStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "70px auto 0",
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "18px",
};

const statCard: React.CSSProperties = {
  padding: "22px",
  borderRadius: "18px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  display: "grid",
  gap: "8px",
};

const sectionStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "90px auto 0",
};

const sectionTitle: React.CSSProperties = {
  fontSize: "36px",
  marginBottom: "18px",
};

const sectionText: React.CSSProperties = {
  color: "#b8b8d8",
  fontSize: "18px",
  lineHeight: "1.7",
};

const interactiveGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "320px 1fr",
  gap: "24px",
};

const moduleList: React.CSSProperties = {
  display: "grid",
  gap: "12px",
};

const moduleButton: React.CSSProperties = {
  color: "#fff",
  border: "1px solid rgba(255,255,255,0.10)",
  padding: "16px",
  borderRadius: "16px",
  display: "flex",
  alignItems: "center",
  gap: "12px",
  cursor: "pointer",
  textAlign: "left",
};

const modulePreview: React.CSSProperties = {
  padding: "30px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const previewBox: React.CSSProperties = {
  marginTop: "24px",
  padding: "20px",
  borderRadius: "20px",
  background: "rgba(0,0,0,0.25)",
};

const previewHeader: React.CSSProperties = {
  height: "20px",
  width: "160px",
  borderRadius: "999px",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  marginBottom: "18px",
};

const previewRow: React.CSSProperties = {
  height: "14px",
  width: "90%",
  borderRadius: "999px",
  background: "rgba(255,255,255,0.12)",
  marginBottom: "12px",
};

const cardsGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "18px",
};

const featureCard: React.CSSProperties = {
  padding: "24px",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  fontWeight: "bold",
  display: "flex",
  alignItems: "center",
  gap: "12px",
};

const plansGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "24px",
};

const planCard: React.CSSProperties = {
  padding: "30px",
  borderRadius: "24px",
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const planBadge: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(139,53,255,0.18)",
  color: "#c4b5fd",
};

const planBadgeBlue: React.CSSProperties = {
  display: "inline-block",
  padding: "8px 12px",
  borderRadius: "999px",
  background: "rgba(0,170,255,0.18)",
  color: "#7dd3fc",
};

const planSubtitle: React.CSSProperties = {
  color: "#b8b8d8",
};

const priceStyle: React.CSSProperties = {
  fontSize: "32px",
};

const listStyle: React.CSSProperties = {
  color: "#dbeafe",
  lineHeight: "2",
  marginBottom: "24px",
};

const ctaStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "90px auto 0",
  padding: "44px",
  borderRadius: "28px",
  background:
    "linear-gradient(90deg, rgba(139,53,255,0.35), rgba(0,170,255,0.25))",
  textAlign: "center",
};

const footerStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "50px auto 0",
  color: "#94a3b8",
  textAlign: "center",
};