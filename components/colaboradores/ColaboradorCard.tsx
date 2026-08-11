import type React from "react";
import {
  Briefcase,
  Phone,
  Mail,
  MessageCircle,
  Copy,
  Check,
  Pencil,
  Trash2,
  ShieldCheck,
  LockKeyhole,
} from "lucide-react";
import type { Colaborador } from "./types";
import { corAvatar, iniciais } from "./utils";
import { sanitizeAllowedModules, summarizeAllowedModules } from "../../lib/access-modules";

type ColaboradorCardProps = {
  colaborador: Colaborador;
  copiado: boolean;
  onWhatsApp: (c: Colaborador) => void;
  onCopiar: (c: Colaborador) => void;
  onEditar: (c: Colaborador) => void;
  onExcluir: (id: string) => void;
};

export default function ColaboradorCard({
  colaborador,
  copiado,
  onWhatsApp,
  onCopiar,
  onEditar,
  onExcluir,
}: ColaboradorCardProps) {
  const ativo = colaborador.status === "Ativo";
  const configuredModules = sanitizeAllowedModules(colaborador.allowed_modules);
  const effectiveModules = configuredModules.length ? configuredModules : colaborador.senha ? ["agenda_colaborador" as const] : [];
  const possuiAcesso = ativo && Boolean(colaborador.auth_user_id || colaborador.senha) && effectiveModules.length > 0;

  return (
    <article className="col-card-anim" style={cardColaboradorStyle}>
      {/* Avatar */}
      <div style={cardAvatarWrapStyle}>
        {colaborador.photo_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={colaborador.photo_url || "/placeholder.svg"}
            alt={colaborador.nome}
            style={cardAvatarImgStyle}
          />
        ) : (
          <div
            style={{
              ...cardAvatarStyle,
              background: corAvatar(colaborador.nome),
            }}
          >
            {iniciais(colaborador.nome)}
          </div>
        )}
      </div>

      {/* Infos */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={cardTopStyle}>
          <h3 style={cardNomeStyle}>{colaborador.nome}</h3>
          <span
            style={{
              ...statusBadge,
              color: ativo ? "#37E884" : "#FF7AA2",
              background: ativo
                ? "rgba(55,232,132,0.14)"
                : "rgba(255,91,138,0.14)",
            }}
          >
            {colaborador.status}
          </span>
          {!possuiAcesso && <span style={semAcessoBadge}>{effectiveModules.length ? "Acesso ainda não criado" : "Sem acesso"}</span>}
        </div>

        <div style={infoLinhasStyle}>
          {colaborador.funcao && (
            <span style={infoItemStyle}>
              <Briefcase size={14} color="#8B35FF" />
              {colaborador.funcao}
            </span>
          )}
          {colaborador.celular && (
            <span style={infoItemStyle}>
              <Phone size={14} color="#00AAFF" />
              {colaborador.celular}
            </span>
          )}
          {colaborador.email && (
            <span style={infoItemStyle}>
              <Mail size={14} color="#38BDF8" />
              Acesso: {colaborador.email}
            </span>
          )}
        </div>

        <div style={accessStyle}>
          <ShieldCheck size={14} color={effectiveModules.length ? "#67E8F9" : "#94A3B8"} />
          <span>{summarizeAllowedModules(effectiveModules)}</span>
        </div>

        {/* Ações */}
        <div style={acoesWrapStyle}>
          <button
            type="button"
            onClick={() => onWhatsApp(colaborador)}
            style={btnWhatsappStyle}
          >
            <MessageCircle size={15} />
            WhatsApp
          </button>
          <button
            type="button"
            onClick={() => onCopiar(colaborador)}
            disabled={!possuiAcesso}
            style={{ ...btnCopiarStyle, opacity: possuiAcesso ? 1 : 0.5, cursor: possuiAcesso ? "pointer" : "not-allowed" }}
          >
            {!possuiAcesso ? (
              <>
                <LockKeyhole size={15} />
                Acesso não criado
              </>
            ) : copiado ? (
              <>
                <Check size={15} />
                Copiado!
              </>
            ) : (
              <>
                <Copy size={15} />
                Copiar acesso
              </>
            )}
          </button>
          <button
            type="button"
            onClick={() => onEditar(colaborador)}
            style={btnEditarStyle}
          >
            <Pencil size={15} />
            Editar
          </button>
          <button
            type="button"
            onClick={() => onExcluir(colaborador.id)}
            style={btnExcluirStyle}
          >
            <Trash2 size={15} />
            Excluir
          </button>
        </div>
      </div>
    </article>
  );
}

const cardColaboradorStyle: React.CSSProperties = {
  display: "flex",
  gap: 12,
  padding: 14,
  borderRadius: 16,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.20)",
};

const cardAvatarWrapStyle: React.CSSProperties = {
  width: 48,
  height: 48,
  minWidth: 48,
  borderRadius: 14,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.14)",
};

const cardAvatarImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const cardAvatarStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontWeight: 900,
  fontSize: 17,
};

const cardTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  flexWrap: "wrap",
};

const cardNomeStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 800,
  color: "#FFFFFF",
};

const statusBadge: React.CSSProperties = {
  padding: "4px 9px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const semAcessoBadge: React.CSSProperties = {
  padding: "4px 9px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  color: "#FBBF24",
  background: "rgba(245,158,11,0.14)",
};

const infoLinhasStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "6px 14px",
  margin: "8px 0 2px",
};

const infoItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  color: "#CBD5E1",
  fontSize: 13,
};

const accessStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 8,
  marginTop: 7,
  color: "#CBD5E1",
  fontSize: 12.5,
  fontWeight: 700,
};

const acoesWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 10,
};

const acaoBaseStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  height: 34,
  padding: "0 11px",
  borderRadius: 10,
  border: "1px solid transparent",
  fontSize: 12,
  fontWeight: 700,
  cursor: "pointer",
};

const btnWhatsappStyle: React.CSSProperties = {
  ...acaoBaseStyle,
  background: "rgba(55,232,132,0.14)",
  color: "#37E884",
  border: "1px solid rgba(55,232,132,0.26)",
};

const btnCopiarStyle: React.CSSProperties = {
  ...acaoBaseStyle,
  background: "rgba(139,53,255,0.16)",
  color: "#C4A0FF",
  border: "1px solid rgba(139,53,255,0.28)",
};

const btnEditarStyle: React.CSSProperties = {
  ...acaoBaseStyle,
  background: "rgba(0,170,255,0.16)",
  color: "#38BDF8",
  border: "1px solid rgba(0,170,255,0.28)",
};

const btnExcluirStyle: React.CSSProperties = {
  ...acaoBaseStyle,
  background: "rgba(255,91,138,0.14)",
  color: "#FF7AA2",
  border: "1px solid rgba(255,91,138,0.26)",
};
