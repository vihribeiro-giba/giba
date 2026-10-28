"use client";

import { useEffect, useState } from "react";
import { getAccessModule, getFirstAllowedRoute, getModuleForPath, type AccessModuleKey } from "../lib/access-modules";
import { clearCollaboratorSession, resolveAccessContext } from "../lib/access-session";
import { supabase } from "../lib/supabase";

export default function ProtectedRoute({ children, adminOnly = false, modulo }: { children: React.ReactNode; adminOnly?: boolean; modulo?: AccessModuleKey }) {
  const [state, setState] = useState<"loading" | "allowed" | "denied">("loading");
  const [fallbackRoute, setFallbackRoute] = useState("/login");

  useEffect(() => {
    let active = true;
    async function verify() {
      const context = await resolveAccessContext();
      if (!active) return;
      if (!context) {
        clearCollaboratorSession();
        window.location.href = "/login";
        return;
      }
      const effectiveModule = modulo || getModuleForPath(window.location.pathname);
      const moduleDefinition = effectiveModule ? getAccessModule(effectiveModule) : null;
      if (context.actor === "owner") {
        if (moduleDefinition?.planFeature) {
          const { data: subscription } = await supabase.from("subscriptions").select("plano,data_fim").eq("user_id", context.accountUserId).eq("status", "ativo").order("created_at", { ascending: false }).limit(1).maybeSingle();
          const expired = subscription?.data_fim && new Date(subscription.data_fim) < new Date();
          if (!subscription || expired) {
            setFallbackRoute("/assinatura");
            setState("denied");
            return;
          }
          if (subscription.plano !== "owner") {
            const { data: feature } = await supabase.from("plan_features").select("id").eq("plano", subscription.plano).eq("modulo", moduleDefinition.planFeature).eq("ativo", true).maybeSingle();
            if (!feature) {
              setFallbackRoute("/assinatura");
              setState("denied");
              return;
            }
          }
        }
        setState("allowed");
        return;
      }

      const ownerRestricted = Boolean(adminOnly && (!moduleDefinition || moduleDefinition.ownerOnly));
      const denied = ownerRestricted || !effectiveModule || moduleDefinition?.ownerOnly || !context.allowedModules.includes(effectiveModule);
      if (denied) {
        setFallbackRoute(getFirstAllowedRoute(context.allowedModules));
        setState("denied");
        return;
      }
      setState("allowed");
    }
    void verify();
    return () => { active = false; };
  }, [adminOnly, modulo]);

  if (state === "loading") return <div className="grid min-h-screen place-items-center bg-[#050510] p-8 text-white">Verificando acesso...</div>;
  if (state === "denied") {
    return <div className="grid min-h-screen place-items-center bg-[#050510] p-6 text-white"><div className="w-full max-w-lg rounded-[28px] border border-white/10 bg-white/[0.06] p-8 text-center"><h1 className="text-2xl font-black">Acesso Não Autorizado</h1><p className="mt-3 leading-7 text-slate-300">Você não possui permissão para acessar este módulo.</p><button type="button" onClick={() => { window.location.href = fallbackRoute; }} className="mt-6 min-h-12 rounded-xl bg-gradient-to-r from-violet-600 to-sky-500 px-6 font-black">Ir para um módulo liberado</button><button type="button" onClick={async () => { clearCollaboratorSession(); await supabase.auth.signOut(); window.location.href = "/login"; }} className="mt-3 block w-full text-sm font-bold text-slate-400">Sair da conta</button></div></div>;
  }
  return <>{children}</>;
}
