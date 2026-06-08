"use client";

import { useEffect, useState } from "react";
import jsPDF from "jspdf";

import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import { supabase } from "../../lib/supabase";

type Item = {
  id: number;
  campo1: string;
  campo2: string;
  valor: string;
};

type OrcamentoSalvo = {
  id: string;
  nome: string;
  created_at?: string;
  criadoEm?: string;
  valorShow?: string;
  valorNota?: string;
  percentualImposto?: string;
  cacheArtista?: string;
  caches?: Item[];
  logistica?: Item[];
  marketing?: Item[];
  efeitos?: Item[];
  dados?: {
    nome?: string;
    valorShow?: string;
    valorNota?: string;
    percentualImposto?: string;
    cacheArtista?: string;
    caches?: Item[];
    logistica?: Item[];
    marketing?: Item[];
    efeitos?: Item[];
  };
};

const cachesPadrao: Item[] = [
  { id: 1, campo1: "", campo2: "", valor: "" },
];

const logisticaPadrao: Item[] = [
  { id: 1, campo1: "Transporte", campo2: "", valor: "" },
  { id: 2, campo1: "Hospedagem", campo2: "", valor: "" },
  { id: 3, campo1: "Alimentação", campo2: "", valor: "" },
  { id: 4, campo1: "Camarim", campo2: "", valor: "" },
];

const marketingPadrao: Item[] = [
  { id: 1, campo1: "", campo2: "", valor: "" },
];

const efeitosPadrao: Item[] = [
  { id: 1, campo1: "", campo2: "", valor: "" },
];

export default function CalculadoraShowPage() {
  const [nomeOrcamento, setNomeOrcamento] = useState("");
  const [orcamentosSalvos, setOrcamentosSalvos] = useState<OrcamentoSalvo[]>([]);
  const [orcamentoEditandoId, setOrcamentoEditandoId] = useState<string | null>(null);

  const [valorShow, setValorShow] = useState("");
  const [valorNota, setValorNota] = useState("");
  const [percentualImposto, setPercentualImposto] = useState("");
  const [cacheArtista, setCacheArtista] = useState("");

  const [caches, setCaches] = useState<Item[]>(cachesPadrao);
  const [logistica, setLogistica] = useState<Item[]>(logisticaPadrao);
  const [marketing, setMarketing] = useState<Item[]>(marketingPadrao);
  const [efeitos, setEfeitos] = useState<Item[]>(efeitosPadrao);

  useEffect(() => {
    carregarOrcamentos();
  }, []);

  async function carregarOrcamentos() {
    const { data, error } = await supabase
      .from("show_calculations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erro ao carregar orçamentos:", error);
      alert("Erro ao carregar orçamentos salvos.");
      return;
    }

    setOrcamentosSalvos((data || []) as OrcamentoSalvo[]);
  }

  function valorNumerico(valor: string) {
    return (
      Number(
        String(valor || "")
          .replace("R$", "")
          .replace(/\./g, "")
          .replace(",", ".")
          .trim()
      ) || 0
    );
  }

  function formatarMoeda(valor: number) {
    return valor.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  }

  function formatarDataHora(dataISO?: string) {
    if (!dataISO) return "Data não informada";
    return new Date(dataISO).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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


  function montarOrcamentoAtual() {
    return {
      nome:
        nomeOrcamento.trim() ||
        `Orçamento ${new Date().toLocaleDateString("pt-BR")}`,
      valorShow,
      valorNota,
      percentualImposto,
      cacheArtista,
      caches,
      logistica,
      marketing,
      efeitos,
    };
  }

  async function salvarOrcamento() {
    const dados = montarOrcamentoAtual();

    const payload = {
      nome: dados.nome,
      valor_show: valorNumerico(valorShow),
      valor_nota: valorNumerico(valorNota),
      percentual_imposto: valorNumerico(percentualImposto),
      cache_artista: valorNumerico(cacheArtista),
      total_caches: totalCaches,
      total_logistica: totalLogistica,
      total_marketing: totalMarketing,
      total_efeitos: totalEfeitos,
      imposto_calculado: impostoCalculado,
      total_custos: totalCustos,
      lucro_liquido: lucroLiquido,
      margem,
      dados,
    };

    if (orcamentoEditandoId) {
      const { error } = await supabase
        .from("show_calculations")
        .update(payload)
        .eq("id", orcamentoEditandoId);

      if (error) {
        console.error("Erro ao atualizar orçamento:", error);
        alert("Erro ao atualizar orçamento.");
        return;
      }

      alert("Orçamento atualizado com sucesso.");
      await carregarOrcamentos();
      return;
    }

    const { data, error } = await supabase
      .from("show_calculations")
      .insert(payload)
      .select("id")
      .single();

    if (error) {
      console.error("Erro ao salvar orçamento:", error);
      alert("Erro ao salvar orçamento.");
      return;
    }

    if (data?.id) {
      setOrcamentoEditandoId(data.id);
    }

    alert("Orçamento salvo com sucesso.");
    await carregarOrcamentos();
  }

  function carregarOrcamento(orcamento: OrcamentoSalvo) {
    const dados = orcamento.dados || orcamento;

    setNomeOrcamento(dados.nome || orcamento.nome || "");
    setValorShow(dados.valorShow || "");
    setValorNota(dados.valorNota || "");
    setPercentualImposto(dados.percentualImposto || "");
    setCacheArtista(dados.cacheArtista || "");
    setCaches(dados.caches?.length ? dados.caches : cachesPadrao);
    setLogistica(dados.logistica?.length ? dados.logistica : logisticaPadrao);
    setMarketing(dados.marketing?.length ? dados.marketing : marketingPadrao);
    setEfeitos(dados.efeitos?.length ? dados.efeitos : efeitosPadrao);
    setOrcamentoEditandoId(orcamento.id);
  }

  async function excluirOrcamento(id: string) {
    const confirmar = confirm("Deseja excluir este orçamento salvo?");

    if (!confirmar) return;

    const { error } = await supabase
      .from("show_calculations")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Erro ao excluir orçamento:", error);
      alert("Erro ao excluir orçamento.");
      return;
    }

    if (orcamentoEditandoId === id) {
      limparCalculadoraSemConfirmar();
    }

    await carregarOrcamentos();
  }

  function limparCalculadoraSemConfirmar() {
    setNomeOrcamento("");
    setValorShow("");
    setValorNota("");
    setPercentualImposto("");
    setCacheArtista("");
    setCaches(cachesPadrao);
    setLogistica(logisticaPadrao);
    setMarketing(marketingPadrao);
    setEfeitos(efeitosPadrao);
    setOrcamentoEditandoId(null);
  }

  function limparCalculadora() {
    const confirmar = confirm("Deseja limpar todos os campos da calculadora?");

    if (!confirmar) return;

    limparCalculadoraSemConfirmar();
  }

  function exportarPDF() {
    const doc = new jsPDF();

    let y = 20;

    doc.setFontSize(18);
    doc.text("Calculadora de Show - GIBA", 14, y);

    y += 14;

    doc.setFontSize(11);

    if (nomeOrcamento) {
      doc.text(`Orçamento: ${nomeOrcamento}`, 14, y);
      y += 8;
    }

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

    if (y > 270) {
      doc.addPage();
      y = 20;
    }

    doc.text(`Imposto estimado: ${formatarMoeda(impostoCalculado)}`, 14, y);
    y += 8;
    doc.text(`Cachê do artista: ${formatarMoeda(valorNumerico(cacheArtista))}`, 14, y);

    doc.save(
      `${nomeOrcamento || "calculadora-show-giba"}.pdf`
        .replace(/[\\/:*?"<>|]/g, "-")
    );
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
            <h2>Controle do Orçamento</h2>

            <input
              value={nomeOrcamento}
              onChange={(e) => setNomeOrcamento(e.target.value)}
              placeholder="Nome do orçamento. Ex: Show Prefeitura de Sabará"
              style={inputStyle}
            />

            <div style={acoesStyle}>
              <button onClick={salvarOrcamento} style={buttonStyle}>
                Salvar Orçamento
              </button>

              <button onClick={limparCalculadora} style={secondaryButtonStyle}>
                Limpar Calculadora
              </button>

              <button onClick={exportarPDF} style={buttonStyle}>
                Exportar PDF
              </button>
            </div>
          </section>

          {orcamentosSalvos.length > 0 && (
            <section style={cardStyle}>
              <h2>Orçamentos Salvos</h2>

              <div style={orcamentosScrollStyle}>
                {orcamentosSalvos.map((orcamento) => (
                  <div key={orcamento.id} style={orcamentoItemStyle}>
                    <div>
                      <strong>{orcamento.nome}</strong>

                      <p style={{ color: "#b8b8d8", margin: "6px 0 0" }}>
                        Salvo em {formatarDataHora(orcamento.created_at || orcamento.criadoEm)}
                      </p>
                    </div>

                    <div style={acoesItemStyle}>
                      <button
                        onClick={() => carregarOrcamento(orcamento)}
                        style={smallButtonStyle}
                      >
                        Carregar
                      </button>

                      <button
                        onClick={() => excluirOrcamento(orcamento.id)}
                        style={smallRemoveButtonStyle}
                      >
                        Excluir
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

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

            <div style={acoesStyle}>
              <button onClick={salvarOrcamento} style={buttonStyle}>
                Salvar Orçamento
              </button>

              <button onClick={exportarPDF} style={buttonStyle}>
                Exportar PDF
              </button>

              <button onClick={limparCalculadora} style={secondaryButtonStyle}>
                Limpar
              </button>
            </div>
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

const acoesStyle: React.CSSProperties = {
  display: "flex",
  gap: "12px",
  flexWrap: "wrap",
  marginTop: "14px",
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

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "rgba(255,255,255,0.10)",
  border: "1px solid rgba(255,255,255,0.16)",
};

const removeButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  background: "#ef4444",
};

const orcamentosScrollStyle: React.CSSProperties = {
  display: "grid",
  gap: "12px",
  maxHeight: "360px",
  overflowY: "auto",
  paddingRight: "8px",
};

const orcamentoItemStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  gap: "14px",
  alignItems: "center",
  padding: "14px",
  borderRadius: "14px",
  border: "1px solid rgba(255,255,255,0.10)",
  background: "rgba(0,0,0,0.20)",
};

const acoesItemStyle: React.CSSProperties = {
  display: "flex",
  gap: "8px",
  flexWrap: "wrap",
  justifyContent: "flex-end",
};

const smallButtonStyle: React.CSSProperties = {
  padding: "8px 12px",
  borderRadius: "10px",
  border: "none",
  background: "linear-gradient(90deg, #8b35ff, #00aaff)",
  color: "#fff",
  fontWeight: "bold",
  cursor: "pointer",
};

const smallRemoveButtonStyle: React.CSSProperties = {
  ...smallButtonStyle,
  background: "#ef4444",
};
