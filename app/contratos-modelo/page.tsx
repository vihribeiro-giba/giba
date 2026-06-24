"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";
import {
  ArrowLeft,
  BadgeDollarSign,
  Building2,
  CalendarDays,
  FileText,
  Gavel,
  MapPin,
  Save,
  ScrollText,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";

type ContractSettings = {
  id?: string;
  user_id?: string;
  titulo: string;
  contratado_texto: string;
  objeto_base: string;
  remuneracao_base: string;
  obrigacao_contratado: string;
  obrigacao_contratante: string;
  multa_contratado: string;
  multa_contratante: string;
  foro: string;
  texto_final: string;
  cidade_assinatura: string;
};

export default function ContratosModeloPage() {
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState<ContractSettings>({
    titulo: "",
    contratado_texto: "",
    objeto_base: "",
    remuneracao_base: "",
    obrigacao_contratado: "",
    obrigacao_contratante: "",
    multa_contratado: "",
    multa_contratante: "",
    foro: "",
    texto_final: "",
    cidade_assinatura: "",
  });

  function atualizarCampo(campo: keyof ContractSettings, valor: string) {
    setForm((atual) => ({ ...atual, [campo]: valor }));
  }

  async function obterUsuarioLogado() {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      alert("Usuário não autenticado.");
      window.location.href = "/login";
      return null;
    }

    return data.user;
  }

  async function carregarModelo() {
    try {
      const user = await obterUsuarioLogado();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("contract_settings")
        .select("*")
        .eq("user_id", user.id)
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error(error);
        alert("Erro ao carregar modelo de contrato.");
        return;
      }

      if (data) {
        setForm({
          id: data.id,
          titulo: data.titulo || "",
          contratado_texto: data.contratado_texto || "",
          objeto_base: data.objeto_base || "",
          remuneracao_base: data.remuneracao_base || "",
          obrigacao_contratado: data.obrigacao_contratado || "",
          obrigacao_contratante: data.obrigacao_contratante || "",
          multa_contratado: data.multa_contratado || "",
          multa_contratante: data.multa_contratante || "",
          foro: data.foro || "",
          texto_final: data.texto_final || "",
          cidade_assinatura: data.cidade_assinatura || "",
        });
      }
    } catch (err) {
      console.error(err);
      alert("Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function salvarModelo() {
    try {
      const user = await obterUsuarioLogado();

      if (!user) {
        return;
      }

      const dados = {
        user_id: user.id,
        titulo: form.titulo,
        contratado_texto: form.contratado_texto,
        objeto_base: form.objeto_base,
        remuneracao_base: form.remuneracao_base,
        obrigacao_contratado: form.obrigacao_contratado,
        obrigacao_contratante: form.obrigacao_contratante,
        multa_contratado: form.multa_contratado,
        multa_contratante: form.multa_contratante,
        foro: form.foro,
        texto_final: form.texto_final,
        cidade_assinatura: form.cidade_assinatura,
      };

      if (form.id) {
        const { error } = await supabase
          .from("contract_settings")
          .update(dados)
          .eq("id", form.id)
          .eq("user_id", user.id);

        if (error) {
          console.error(error);
          alert("Erro ao salvar contrato.");
          return;
        }
      } else {
        const { data, error } = await supabase
          .from("contract_settings")
          .insert([dados])
          .select("id")
          .single();

        if (error) {
          console.error(error);
          alert("Erro ao criar contrato.");
          return;
        }

        if (data?.id) {
          setForm((formAtual) => ({
            ...formAtual,
            id: data.id,
            user_id: user.id,
          }));
        }
      }

      alert("Modelo salvo com sucesso!");
    } catch (err) {
      console.error(err);
      alert("Erro inesperado.");
    }
  }

  useEffect(() => {
    carregarModelo();
  }, []);

  return (
    <ProtectedRoute adminOnly>
      <PlanProtectedRoute modulo="contratos-modelo">
        <AppLayout>
          <div className="modelo-page">
            <header className="page-header">
              <div className="header-left">
                <div className="header-icon" aria-hidden="true">
                  <ScrollText size={26} />
                </div>
                <div>
                  <h1>Modelo de Contrato</h1>
                  <p>Configure as partes fixas e veja quais dados são preenchidos automaticamente por contrato.</p>
                </div>
              </div>

              <div className="header-actions">
                <Link href="/contratos" className="btn-secondary">
                  <ArrowLeft size={17} aria-hidden="true" />
                  Voltar
                </Link>
                <button type="button" onClick={salvarModelo} className="btn-primary" disabled={loading}>
                  <Save size={17} aria-hidden="true" />
                  Salvar Modelo
                </button>
              </div>
            </header>

            <section className="panel editor-panel">
              <div className="panel-header">
                <div>
                  <h2>Modelo único do contrato</h2>
                  <p>Os blocos automáticos ficam bloqueados. Edite apenas os textos fixos do modelo.</p>
                </div>
                <span className="status-badge">{form.id ? "Modelo salvo" : "Modelo novo"}</span>
              </div>

              {loading ? (
                <div className="loading-state">
                  <div className="spinner" aria-hidden="true" />
                  <p>Carregando modelo...</p>
                </div>
              ) : (
                <div className="template-flow">
                  <Field label="Título do contrato" icon={<FileText size={16} />}>
                    <input
                      type="text"
                      value={form.titulo}
                      onChange={(e) => atualizarCampo("titulo", e.target.value)}
                      placeholder="Contrato de Prestação de Serviços Artísticos"
                    />
                  </Field>

                  <ReadonlyField
                    label="Contratante"
                    icon={<User size={16} />}
                    value="Preenchido automaticamente com nome, CPF/CNPJ e endereço do cliente selecionado no evento."
                  />

                  <Field label="Contratado" icon={<Building2 size={16} />}>
                    <textarea
                      rows={5}
                      value={form.contratado_texto}
                      onChange={(e) => atualizarCampo("contratado_texto", e.target.value)}
                      placeholder="Dados fixos da empresa/artista contratado"
                    />
                  </Field>

                  <Field label="Objeto do contrato" icon={<Sparkles size={16} />}>
                    <textarea
                      rows={5}
                      value={form.objeto_base}
                      onChange={(e) => atualizarCampo("objeto_base", e.target.value)}
                    />
                  </Field>

                  <ReadonlyField
                    label="Dados da apresentação"
                    icon={<CalendarDays size={16} />}
                    value="Local, data, horário de início, horário final, duração e formato são preenchidos pela Agenda e Formatos."
                  />

                  <Field label="Remuneração" icon={<BadgeDollarSign size={16} />}>
                    <textarea
                      rows={5}
                      value={form.remuneracao_base}
                      onChange={(e) => atualizarCampo("remuneracao_base", e.target.value)}
                    />
                  </Field>

                  <ReadonlyField
                    label="Valores e pagamento"
                    icon={<BadgeDollarSign size={16} />}
                    value="Valor do cachê, valor por extenso e forma de pagamento vêm do evento selecionado."
                  />

                  <Field label="Obrigação do contratado" icon={<ShieldCheck size={16} />}>
                    <textarea
                      rows={5}
                      value={form.obrigacao_contratado}
                      onChange={(e) => atualizarCampo("obrigacao_contratado", e.target.value)}
                    />
                  </Field>

                  <Field label="Obrigação do contratante" icon={<User size={16} />}>
                    <textarea
                      rows={5}
                      value={form.obrigacao_contratante}
                      onChange={(e) => atualizarCampo("obrigacao_contratante", e.target.value)}
                    />
                  </Field>

                  <Field label="Multa do contratado" icon={<Gavel size={16} />}>
                    <textarea
                      rows={5}
                      value={form.multa_contratado}
                      onChange={(e) => atualizarCampo("multa_contratado", e.target.value)}
                    />
                  </Field>

                  <Field label="Multa do contratante" icon={<Gavel size={16} />}>
                    <textarea
                      rows={5}
                      value={form.multa_contratante}
                      onChange={(e) => atualizarCampo("multa_contratante", e.target.value)}
                    />
                  </Field>

                  <Field label="Foro" icon={<MapPin size={16} />}>
                    <textarea
                      rows={4}
                      value={form.foro}
                      onChange={(e) => atualizarCampo("foro", e.target.value)}
                    />
                  </Field>

                  <Field label="Texto final" icon={<FileText size={16} />}>
                    <textarea
                      rows={4}
                      value={form.texto_final}
                      onChange={(e) => atualizarCampo("texto_final", e.target.value)}
                    />
                  </Field>

                  <Field label="Cidade da assinatura" icon={<MapPin size={16} />}>
                    <input
                      type="text"
                      value={form.cidade_assinatura}
                      onChange={(e) => atualizarCampo("cidade_assinatura", e.target.value)}
                      placeholder="Sabará"
                    />
                  </Field>

                  <ReadonlyField
                    label="Data de assinatura"
                    icon={<CalendarDays size={16} />}
                    value="A data atual é inserida automaticamente no momento em que o contrato é gerado."
                  />

                  <button type="button" onClick={salvarModelo} className="btn-primary save-bottom">
                    <Save size={17} aria-hidden="true" />
                    Salvar Modelo de Contrato
                  </button>
                </div>
              )}
            </section>
          </div>

          <style jsx>{`
            .modelo-page {
              width: 100%;
              max-width: 1320px;
              margin: 0 auto;
              color: #ffffff;
            }

            .page-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 18px;
              flex-wrap: wrap;
              margin-bottom: 24px;
            }

            .header-left {
              display: flex;
              align-items: center;
              gap: 16px;
            }

            .header-icon {
              width: 62px;
              height: 62px;
              border-radius: 20px;
              background: linear-gradient(135deg, #8b35ff, #00aaff);
              display: grid;
              place-items: center;
              color: #fff;
              box-shadow: 0 18px 38px rgba(139, 53, 255, 0.35);
              flex-shrink: 0;
            }

            .header-actions {
              display: flex;
              align-items: center;
              gap: 10px;
              flex-wrap: wrap;
            }

            h1,
            h2,
            h3,
            p {
              margin: 0;
            }

            h1 {
              font-size: 32px;
              line-height: 1.1;
              font-weight: 900;
              letter-spacing: -0.5px;
            }

            .page-header p,
            .panel-header p {
              color: #94a3b8;
              font-size: 14px;
              line-height: 1.5;
              margin-top: 4px;
            }

            .panel {
              border-radius: 24px;
              background: rgba(255, 255, 255, 0.04);
              border: 1px solid rgba(255, 255, 255, 0.09);
              box-shadow: 0 22px 50px rgba(0, 0, 0, 0.22);
              backdrop-filter: blur(18px);
            }

            .panel {
              padding: 22px;
            }

            .panel-header {
              display: flex;
              align-items: flex-start;
              justify-content: space-between;
              gap: 14px;
              margin-bottom: 18px;
            }

            .panel-header.compact {
              display: block;
            }

            .panel-header h2 {
              color: #fff;
              font-size: 21px;
              font-weight: 900;
              letter-spacing: -0.02em;
            }

            .status-badge {
              display: inline-flex;
              align-items: center;
              min-height: 30px;
              padding: 0 12px;
              border-radius: 999px;
              color: #37e884;
              background: rgba(55, 232, 132, 0.12);
              border: 1px solid rgba(55, 232, 132, 0.26);
              font-size: 12px;
              font-weight: 900;
              white-space: nowrap;
            }

            .template-flow {
              display: grid;
              gap: 16px;
            }

            .field {
              display: grid;
              gap: 8px;
            }

            .field-label {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #cbd5e1;
              font-size: 13px;
              font-weight: 900;
            }

            .readonly-label small {
              margin-left: 4px;
              padding: 3px 9px;
              border-radius: 999px;
              color: #38bdf8;
              background: rgba(14, 165, 233, 0.12);
              border: 1px solid rgba(14, 165, 233, 0.22);
              font-size: 11px;
              font-weight: 900;
            }

            .field-label :global(svg) {
              color: #93c5fd;
            }

            input,
            textarea {
              width: 100%;
              box-sizing: border-box;
              border-radius: 14px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(2, 6, 23, 0.45);
              color: #fff;
              outline: 0;
              font-size: 14px;
              padding: 14px 16px;
              line-height: 1.55;
              transition: 0.18s ease;
            }

            textarea {
              resize: vertical;
              min-height: 118px;
            }

            input::placeholder,
            textarea::placeholder {
              color: rgba(148, 163, 184, 0.65);
            }

            input:focus,
            textarea:focus {
              border-color: rgba(139, 53, 255, 0.7);
              box-shadow: 0 0 0 4px rgba(139, 53, 255, 0.14);
            }

            textarea:disabled {
              color: #cbd5e1;
              background: rgba(15, 23, 42, 0.58);
              border-style: dashed;
              border-color: rgba(148, 163, 184, 0.24);
              cursor: not-allowed;
              opacity: 1;
              resize: none;
            }

            .btn-primary,
            .btn-secondary {
              display: inline-flex;
              align-items: center;
              justify-content: center;
              gap: 8px;
              min-height: 42px;
              padding: 0 16px;
              border-radius: 14px;
              color: #fff;
              font-size: 14px;
              font-weight: 900;
              border: 1px solid transparent;
              cursor: pointer;
              text-decoration: none;
              transition: transform 0.16s ease, opacity 0.16s ease;
            }

            .btn-primary {
              background: linear-gradient(135deg, #8b35ff, #00aaff);
              box-shadow: 0 16px 32px rgba(139, 53, 255, 0.28);
            }

            .btn-secondary {
              background: rgba(255, 255, 255, 0.07);
              border-color: rgba(255, 255, 255, 0.12);
            }

            .btn-primary:hover,
            .btn-secondary:hover {
              transform: translateY(-1px);
              opacity: 0.94;
            }

            .btn-primary:disabled {
              opacity: 0.58;
              cursor: not-allowed;
              transform: none;
            }

            .save-bottom {
              width: 100%;
              margin-top: 4px;
            }

            .loading-state {
              display: grid;
              place-items: center;
              min-height: 280px;
              color: #94a3b8;
              text-align: center;
            }

            .spinner {
              width: 38px;
              height: 38px;
              border-radius: 999px;
              border: 3px solid rgba(255, 255, 255, 0.12);
              border-top-color: #8b35ff;
              animation: spin 0.8s linear infinite;
              margin-bottom: 14px;
            }

            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }

            @media (max-width: 720px) {
              .page-header {
                align-items: flex-start;
              }

              .header-actions,
              .btn-primary,
              .btn-secondary {
                width: 100%;
              }

              h1 {
                font-size: 30px;
              }

              .panel {
                border-radius: 20px;
                padding: 18px;
              }
            }
          `}</style>

          <style jsx global>{`
            .modelo-page .field {
              display: grid;
              gap: 8px;
              width: 100%;
            }

            .modelo-page .field-label {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #cbd5e1;
              font-size: 13px;
              font-weight: 900;
            }

            .modelo-page .field-label svg {
              color: #93c5fd;
              flex-shrink: 0;
            }

            .modelo-page .readonly-label small {
              margin-left: 4px;
              padding: 3px 9px;
              border-radius: 999px;
              color: #38bdf8;
              background: rgba(14, 165, 233, 0.12);
              border: 1px solid rgba(14, 165, 233, 0.22);
              font-size: 11px;
              font-weight: 900;
            }

            .modelo-page input,
            .modelo-page textarea {
              width: 100%;
              box-sizing: border-box;
              border-radius: 14px;
              border: 1px solid rgba(255, 255, 255, 0.1);
              background: rgba(2, 6, 23, 0.45);
              color: #fff;
              outline: 0;
              font-size: 14px;
              padding: 14px 16px;
              line-height: 1.55;
              transition: 0.18s ease;
            }

            .modelo-page textarea {
              resize: vertical;
              min-height: 118px;
            }

            .modelo-page input::placeholder,
            .modelo-page textarea::placeholder {
              color: rgba(148, 163, 184, 0.65);
            }

            .modelo-page input:focus,
            .modelo-page textarea:focus {
              border-color: rgba(139, 53, 255, 0.7);
              box-shadow: 0 0 0 4px rgba(139, 53, 255, 0.14);
            }

            .modelo-page textarea:disabled {
              min-height: 82px;
              color: #cbd5e1;
              background: rgba(15, 23, 42, 0.58);
              border-style: dashed;
              border-color: rgba(148, 163, 184, 0.24);
              cursor: not-allowed;
              opacity: 1;
              resize: none;
            }
          `}</style>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span className="field-label">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}

function ReadonlyField({
  label,
  icon,
  value,
}: {
  label: string;
  icon: ReactNode;
  value: string;
}) {
  return (
    <label className="field">
      <span className="field-label readonly-label">
        {icon}
        {label}
        <small>Automático</small>
      </span>
      <textarea rows={3} value={value} disabled readOnly />
    </label>
  );
}
