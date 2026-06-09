"use client";

import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({
  children,
  adminOnly = false,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
}) {
  const [liberado, setLiberado] = useState(false);

  useEffect(() => {
    async function verificarAcesso() {
      const colaboradorSession = localStorage.getItem("giba_colaborador_session");

      if (colaboradorSession) {
        if (adminOnly) {
          window.location.href = "/agenda-colaborador";
          return;
        }

        setLiberado(true);
        return;
      }

      const { data } = await supabase.auth.getUser();

      const email = data.user?.email;

      if (!email) {
        window.location.href = "/login";
        return;
      }

      const { data: colaborador } = await supabase
        .from("collaborators")
        .select("*")
        .eq("email", email)
        .eq("status", "Ativo")
        .maybeSingle();

      if (colaborador) {
        localStorage.setItem(
          "giba_colaborador_session",
          JSON.stringify({
            id: colaborador.id,
            nome: colaborador.nome,
            email: colaborador.email,
            funcao: colaborador.funcao,
            user_id: colaborador.user_id,
            tipo: "colaborador",
          })
        );
      }

      if (adminOnly && colaborador) {
        window.location.href = "/agenda-colaborador";
        return;
      }

      setLiberado(true);
    }

    verificarAcesso();
  }, [adminOnly]);

  if (!liberado) {
    return (
      <div style={{ color: "#fff", padding: "40px" }}>
        Verificando acesso...
      </div>
    );
  }

  return <>{children}</>;
}
