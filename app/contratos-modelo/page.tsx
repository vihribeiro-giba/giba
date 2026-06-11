"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "../../lib/supabase";
import AppLayout from "../../components/AppLayout";
import ProtectedRoute from "../../components/ProtectedRoute";
import PlanProtectedRoute from "../../components/PlanProtectedRoute";

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
        <div className="min-h-screen bg-[#0b0f1a] text-white p-8">
        <div className="max-w-6xl mx-auto">

          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-bold">
                Modelo de Contrato
              </h1>

              <p className="text-gray-400 mt-2">
                Configure as cláusulas fixas usadas na geração dos contratos.
              </p>
            </div>

            <Link
              href="/contratos"
              className="px-5 py-3 rounded-xl bg-purple-600 hover:bg-purple-700 transition"
            >
              Voltar para Contratos
            </Link>
          </div>

          <div className="bg-[#131b2e] border border-purple-500/20 rounded-3xl p-8">

            {loading ? (
              <p>Carregando modelo...</p>
            ) : (
              <div className="space-y-8">

                {/* TÍTULO */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Título do contrato
                  </label>

                  <input
                    type="text"
                    value={form.titulo}
                    onChange={(e) =>
                      setForm({ ...form, titulo: e.target.value })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* CONTRATADO */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Texto do contratado
                  </label>

                  <textarea
                    rows={5}
                    value={form.contratado_texto}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        contratado_texto: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* OBJETO */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Cláusula 1ª — Objeto do contrato
                  </label>

                  <textarea
                    rows={5}
                    value={form.objeto_base}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        objeto_base: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* REMUNERAÇÃO */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Cláusula 2ª — Remuneração
                  </label>

                  <textarea
                    rows={5}
                    value={form.remuneracao_base}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        remuneracao_base: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* OBRIGAÇÃO CONTRATADO */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Cláusula 3ª — Obrigação do contratado
                  </label>

                  <textarea
                    rows={5}
                    value={form.obrigacao_contratado}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        obrigacao_contratado: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* OBRIGAÇÃO CONTRATANTE */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Cláusula 4ª — Obrigação do contratante
                  </label>

                  <textarea
                    rows={5}
                    value={form.obrigacao_contratante}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        obrigacao_contratante: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* MULTA CONTRATADO */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Cláusula 5ª — Multa do contratado
                  </label>

                  <textarea
                    rows={5}
                    value={form.multa_contratado}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        multa_contratado: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* MULTA CONTRATANTE */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Cláusula 6ª — Multa do contratante
                  </label>

                  <textarea
                    rows={5}
                    value={form.multa_contratante}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        multa_contratante: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* FORO */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Foro
                  </label>

                  <textarea
                    rows={4}
                    value={form.foro}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        foro: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* TEXTO FINAL */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Texto Final
                  </label>

                  <textarea
                    rows={4}
                    value={form.texto_final}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        texto_final: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* CIDADE */}
                <div>
                  <label className="block mb-2 font-semibold">
                    Cidade da assinatura
                  </label>

                  <input
                    type="text"
                    value={form.cidade_assinatura}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        cidade_assinatura: e.target.value,
                      })
                    }
                    className="w-full bg-[#0f1729] border border-purple-500/20 rounded-xl p-4"
                  />
                </div>

                {/* BOTÃO */}
                <button
                  onClick={salvarModelo}
                  className="w-full py-4 rounded-2xl bg-gradient-to-r from-purple-600 to-blue-500 font-bold text-lg hover:opacity-90 transition"
                >
                  Salvar Modelo de Contrato
                </button>

              </div>
            )}
          </div>
        </div>
        </div>
        </AppLayout>
      </PlanProtectedRoute>
    </ProtectedRoute>
  );
}