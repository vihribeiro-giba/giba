"use client";

import { useState } from "react";
import jsPDF from "jspdf";

import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";

type Item = {
  id: number;
  campo1: string;
  campo2: string;
  valor: string;
};

export default function CalculadoraShowPage() {
  const [valorShow, setValorShow] = useState("");
  const [valorNota, setValorNota] = useState("");
  const [percentualImposto, setPercentualImposto] = useState("");
  const [cacheArtista, setCacheArtista] = useState("");

  const [caches, setCaches] = useState<Item[]>([
    { id: 1, campo1: "", campo2: "", valor: "" },
  ]);

  const [logistica, setLogistica] = useState<Item[]>([
    { id: 1, campo1: "Transporte", campo2: "", valor: "" },
    { id: 2, campo1: "Hospedagem", campo2: "", valor: "" },
    { id: 3, campo1: "Alimentação", campo2: "", valor: "" },
    { id: 4, campo1: "Camarim", campo2: "", valor: "" },
  ]);

  const [marketing, setMarketing] = useState<Item[]>([
    { id: 1, campo1: "", campo2: "", valor: "" },
  ]);

  const [efeitos, setEfeitos] = useState<Item[]>([
    { id: 1, campo1: "", campo2: "", valor: "" },
  ]);

  function valorNumerico(valor: string) {
    return Number(
      String(valor || "")
        .replace("R$", "")
        .replace(/\./g, "")
        .replace(",", ".")
        .trim()
    ) || 0;
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function somarItens(lista: Item[]) {
    return lista.reduce((total, item) => total + valorNumerico(item.valor), 0);
  }

  function atualizarItem(
    lista: Item[],
    setLista: React.Dispatch<React.SetStateAction<Item[]>>,
    id: number,
    campo: keyof Item,
    valor: string
  ) {
    setLista(
      lista.map((item) =>
        item.id === id ? { ...item, [campo]: valor } : item
      )
    );
  }

  function adicionarItem(
    lista: Item[],
    setLista: React.Dispatch<React.SetStateAction<Item[]>>
  ) {
    setLista([
      ...lista,
      {
        id: Date.now(),
        campo1: "",
        campo2: "",
        valor: "",
      },
    ]);
  }

  function removerItem(
    lista: Item[],
    setLista: React.Dispatch<React.SetStateAction<Item[]>>,
    id: number
  ) {
    setLista(lista.filter((item) => item.id !== id));
  }

  const totalCaches = somarItens(caches);
  const totalLogistica = somarItens(logistica);
  const totalMarketing = somarItens(marketing);
  const totalEfeitos = somarItens(efeitos);

  const impostoCalculado =
    (valorNumerico(valorNota) * valorNumerico(percentualImposto)) / 100;

  const totalCustos =
    totalCaches +
    totalLogistica +
    totalMarketing +
    totalEfeitos +
    impostoCalculado +
    valorNumerico(cacheArtista);

  const lucroLiquido = valorNumerico(valorShow) - totalCustos;

  const margem =
    valorNumerico(valorShow) > 0
      ? (lucroLiquido / valorNumerico(valorShow)) * 100
      : 0;

  function exportarPDF() {
    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);
    doc.text("Calculadora de Show - GIBA", 14, y);

    y += 14;

    doc.setFontSize(11);
    doc.text(`Valor do Show: ${formatarMoeda(valorNumerico(valorShow))}`, 14, y);
    y += 8;
    doc.text(`Total de Custos: ${formatarMoeda(totalCustos)}`, 14, y);
    y += 8;
    doc.text(`Lucro Líquido: ${formatarMoeda(lucroLiquido)}`, 14, y);
    y += 8;
    doc.text(`Margem: ${margem.toFixed(2)}%`, 14, y);

    y += 14;

    function secao(titulo: string, itens: Item[], total: number) {
      doc.setFontSize(13);
      doc.text(titulo, 14, y);
      y += 8;

      doc.setFontSize(10);

      itens.forEach((item) => {
        if (y > 280) {
          doc.addPage();
          y = 20;
        }

        doc.text(
          `${item.campo1 || "-"} | ${item.campo2 || "-"} | ${formatarMoeda(
            valorNumerico(item.valor)
          )}`,
          14,
          y
        );

        y += 7;
      });

      doc.setFontSize(11);
      doc.text(`Total: ${formatarMoeda(total)}`, 14, y);
      y += 12;
    }

    secao("Cachê - Músicos - Dançarinos - Equipe Técnica - Roadies", caches, totalCaches);
    secao("Logística - Transporte - Hospedagem - Alimentação", logistica, totalLogistica);
    secao("Marketing - Distribuição - Redes Sociais", marketing, totalMarketing);
    secao("Fogos e Efeitos Especiais", efeitos, totalEfeitos);

    doc.text(`Imposto estimado: ${formatarMoeda(impostoCalculado)}`, 14, y);
    y += 8;
    doc.text(`Cachê do artista: ${formatarMoeda(valorNumerico(cacheArtista))}`, 14, y);

    doc.save("calculadora-show-giba.pdf");
  }

  return (
    <ProtectedRoute adminOnly>
      <AppLayout>
        <div style={{ color: "#fff" }}>
          <h1 style={{ fontSize: "34px", marginBottom: "8px" }}>
            Calculadora de Show
          </h1>

          <p style={{ color: "#b8b8d8", marginBottom: "24px" }}>
            Calcule custos, lucro líquido e margem de cada apresentação.
          </p>

          <section style={cardStyle}>
            <h2>Valor do Show</h2>

            <input
              value={valorShow}
              onChange={(e) => setValorShow(e.target.value)}
              placeholder="Ex: 20000"
              style={inputStyle}
            />
          </section>

          <TabelaDinamica
            titulo="Cachê - Músicos - Dançarinos - Equipe Técnica - Roadies"
            label1="Função"
            label2="Nome"
            itens={caches}
            setItens={setCaches}
            atualizarItem={atualizarItem}
            adicionarItem={adicionarItem}
            removerItem={removerItem}
            total={totalCaches}
          />

          <TabelaDinamica
            titulo="Logística - Transporte - Hospedagem - Alimentação"
            label1="Tipo"
            label2="Prestador"
            itens={logistica}
            setItens={setLogistica}
            atualizarItem={atualizarItem}
            adicionarItem={adicionarItem}
            removerItem={removerItem}
            total={totalLogistica}
          />

          <section style={cardStyle}>
            <h2>Imposto Estimado</h2>

            <div style={gridStyle}>
              <input
                value={valorNota}
                onChange={(e) => setValorNota(e.target.value)}
                placeholder="Valor da nota fiscal"
                style={inputStyle}
              />

              <input
                value={percentualImposto}
                onChange={(e) => setPercentualImposto(e.target.value)}
                placeholder="% imposto"
                style={inputStyle}
              />
            </div>

            <h3>Total: {formatarMoeda(impostoCalculado)}</h3>
          </section>

          <TabelaDinamica
            titulo="Marketing - Distribuição - Redes Sociais"
            label1="Descrição"
            label2="Prestador"
            itens={marketing}
            setItens={setMarketing}
            atualizarItem={atualizarItem}
            adicionarItem={adicionarItem}
            removerItem={removerItem}
            total={totalMarketing}
          />

          <TabelaDinamica
            titulo="Fogos e Efeitos Especiais"
            label1="Descrição"
            label2="Prestador"
            itens={efeitos}
            setItens={setEfeitos}
            atualizarItem={atualizarItem}
            adicionarItem={adicionarItem}
            removerItem={removerItem}
            total={totalEfeitos}
          />

          <section style={cardStyle}>
            <h2>Cachê do Artista</h2>

            <input
              value={cacheArtista}
              onChange={(e) => setCacheArtista(e.target.value)}
              placeholder="Ex: 7000"
              style={inputStyle}
            />
          </section>

          <section style={resumoStyle}>
            <h2>Resumo Final</h2>

            <p>Valor do Show: {formatarMoeda(valorNumerico(valorShow))}</p>
            <p>Total de Custos: {formatarMoeda(totalCustos)}</p>
            <p>Lucro Líquido: {formatarMoeda(lucroLiquido)}</p>
            <p>Margem: {margem.toFixed(2)}%</p>

            <button onClick={exportarPDF} style={buttonStyle}>
              Exportar PDF
            </button>
          </section>
        </div>
      </AppLayout>
    </ProtectedRoute>
  );
}

function TabelaDinamica({
  titulo,
  label1,
  label2,
  itens,
  setItens,
  atualizarItem,
  adicionarItem,
  removerItem,
  total,
}: any) {
  return (
    <section style={cardStyle}>
      <h2>{titulo}</h2>

      {itens.map((item: Item) => (
        <div key={item.id} style={linhaStyle}>
          <input
            value={item.campo1}
            onChange={(e) =>
              atualizarItem(itens, setItens, item.id, "campo1", e.target.value)
            }
            placeholder={label1}
            style={inputStyle}
          />

          <input
            value={item.campo2}
            onChange={(e) =>
              atualizarItem(itens, setItens, item.id, "campo2", e.target.value)
            }
            placeholder={label2}
            style={inputStyle}
          />

          <input
            value={item.valor}
            onChange={(e) =>
              atualizarItem(itens, setItens, item.id, "valor", e.target.value)
            }
            placeholder="Valor"
            style={inputStyle}
          />

          <button
            onClick={() => removerItem(itens, setItens, item.id)}
            style={removeButtonStyle}
          >
            X
          </button>
        </div>
      ))}

      <button
        onClick={() => adicionarItem(itens, setItens)}
        style={buttonStyle}
      >
        + Adicionar
      </button>

      <h3>Total: {total.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      })}</h3>
    </section>
  );
}

const cardStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.06)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: "24px",
  padding: "24px",
  marginBottom: "24px",
};

const resumoStyle: React.CSSProperties = {
  ...cardStyle,
  background: "linear-gradient(135deg, rgba(139,53,255,0.35), rgba(0,170,255,0.25))",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px",
  borderRadius: "12px",
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.25)",
  color: "#fff",
  boxSizing: "border-box",
};

const linhaStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr 140px 44px",
  gap: "10px",
  marginBottom: "10px",
};

const gridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: "12px",
};

const buttonStyle: React.CSSProperties = {
  padding: "12px 18px",
  borderRadius: "12px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const removeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#ef4444",
};