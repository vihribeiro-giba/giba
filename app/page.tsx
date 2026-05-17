import Link from "next/link";

export default function Home() {
  const whatsapp =
    "https://wa.me/5531999999999?text=Olá!%20Quero%20conhecer%20a%20plataforma%20GIBA.";

  return (
    <main style={pageStyle}>
      <header style={headerStyle}>
        <img src="/logo-giba-horizontal.png" alt="GIBA" style={logoStyle} />

        <nav style={navStyle}>
          <a href="#funcionalidades" style={navLink}>Funcionalidades</a>
          <a href="#planos" style={navLink}>Planos</a>
          <Link href="/login" style={loginButton}>Entrar</Link>
        </nav>
      </header>

      <section style={heroStyle}>
        <div>
          <span style={tagStyle}>Gestão para artistas e bandas</span>

          <h1 style={titleStyle}>
            Gestão Inteligente para Bandas e Artistas
          </h1>

          <p style={subtitleStyle}>
            Organize agenda, contratos, clientes, financeiro e equipe em uma
            única plataforma profissional.
          </p>

          <div style={buttonGroup}>
            <Link href="/login" style={primaryButton}>
              Entrar na Plataforma
            </Link>

            <a href={whatsapp} target="_blank" style={secondaryButton}>
              Falar no WhatsApp
            </a>
          </div>
        </div>

        <div style={mockupStyle}>
          <h3 style={{ marginTop: 0 }}>Dashboard GIBA</h3>
          <div style={mockGrid}>
            <div style={mockCard}>Agenda</div>
            <div style={mockCard}>Contratos</div>
            <div style={mockCard}>Financeiro</div>
            <div style={mockCard}>Clientes</div>
          </div>
        </div>
      </section>

      <section style={sectionStyle}>
        <h2 style={sectionTitle}>O que é a GIBA?</h2>
        <p style={sectionText}>
          A GIBA é uma plataforma criada para artistas, bandas e produtores que
          querem profissionalizar a gestão da carreira musical com mais controle,
          organização e praticidade.
        </p>
      </section>

      <section id="funcionalidades" style={sectionStyle}>
        <h2 style={sectionTitle}>Funcionalidades</h2>

        <div style={cardsGrid}>
          {[
            "Agenda de Shows",
            "Cadastro de Clientes",
            "Contratos Automáticos",
            "Financeiro",
            "Formatos de Show",
            "Colaboradores",
          ].map((item) => (
            <div key={item} style={featureCard}>
              {item}
            </div>
          ))}
        </div>
      </section>

      <section id="planos" style={sectionStyle}>
        <h2 style={sectionTitle}>Planos</h2>

        <div style={plansGrid}>
          <div style={planCard}>
            <h3>Essencial</h3>
            <p style={planSubtitle}>Para artistas independentes</p>
            <h2>Em breve</h2>
            <ul style={listStyle}>
              <li>Agenda</li>
              <li>Clientes</li>
              <li>Contratos</li>
              <li>Dashboard</li>
            </ul>
            <a href={whatsapp} target="_blank" style={primaryButton}>
              Quero conhecer
            </a>
          </div>

          <div style={{ ...planCard, border: "1px solid #00aaff" }}>
            <h3>Profissional</h3>
            <p style={planSubtitle}>Para bandas e produtores</p>
            <h2>Em breve</h2>
            <ul style={listStyle}>
              <li>Tudo do Essencial</li>
              <li>Financeiro completo</li>
              <li>Colaboradores</li>
              <li>Gestão avançada</li>
            </ul>
            <a href={whatsapp} target="_blank" style={primaryButton}>
              Falar no WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section style={ctaStyle}>
        <h2>Sua carreira merece gestão profissional.</h2>
        <p>Comece a organizar sua operação artística com a GIBA.</p>

        <a href={whatsapp} target="_blank" style={primaryButton}>
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
};

const logoStyle: React.CSSProperties = {
  width: "180px",
  height: "auto",
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
  gap: "40px",
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
  display: "inline-block",
  padding: "14px 22px",
  borderRadius: "14px",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  textDecoration: "none",
  fontWeight: "bold",
};

const secondaryButton: React.CSSProperties = {
  display: "inline-block",
  padding: "14px 22px",
  borderRadius: "14px",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  textDecoration: "none",
  border: "1px solid rgba(255,255,255,0.12)",
};

const mockupStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.08)",
  border: "1px solid rgba(255,255,255,0.12)",
  borderRadius: "28px",
  padding: "28px",
  boxShadow: "0 0 60px rgba(139,53,255,0.25)",
};

const mockGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "14px",
};

const mockCard: React.CSSProperties = {
  padding: "24px",
  borderRadius: "18px",
  background: "rgba(0,0,0,0.28)",
  border: "1px solid rgba(255,255,255,0.10)",
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
  maxWidth: "780px",
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

const planSubtitle: React.CSSProperties = {
  color: "#b8b8d8",
};

const listStyle: React.CSSProperties = {
  color: "#dbeafe",
  lineHeight: "2",
  marginBottom: "24px",
};

const ctaStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "90px auto 0",
  padding: "40px",
  borderRadius: "28px",
  background: "linear-gradient(90deg, rgba(139,53,255,0.35), rgba(0,170,255,0.25))",
  textAlign: "center",
};

const footerStyle: React.CSSProperties = {
  maxWidth: "1180px",
  margin: "50px auto 0",
  color: "#94a3b8",
  textAlign: "center",
};