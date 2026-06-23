import type React from "react";
import {
  Briefcase,
  Phone,
  Mail,
  CreditCard,
  Instagram,
  UserCircle,
  StickyNote,
  MessageCircle,
  Copy,
  Check,
  Pencil,
  Trash2,
} from "lucide-react";
import type { Colaborador } from "./types";
import { corAvatar, iniciais } from "./utils";

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
          {!colaborador.senha && <span style={semAcessoBadge}>Sem acesso</span>}
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
              {colaborador.email}
            </span>
          )}
          {colaborador.instagram && (
            <span style={infoItemStyle}>
              <Instagram size={14} color="#E879A6" />
              {colaborador.instagram}
            </span>
          )}
          {colaborador.pix_key && (
            <span style={infoItemStyle}>
              <CreditCard size={14} color="#37E884" />
              {colaborador.pix_type ? `PIX (${colaborador.pix_type}): ` : "PIX: "}
              {colaborador.pix_key}
            </span>
          )}
          {colaborador.pix_favorecido && (
            <span style={infoItemStyle}>
              <UserCircle size={14} color="#37E884" />
              Favorecido: {colaborador.pix_favorecido}
            </span>
          )}
        </div>

        {colaborador.observacoes && (
          <div style={obsStyle}>
            <StickyNote size={14} color="#FBBF24" style={{ marginTop: 2, minWidth: 14 }} />
            <span style={obsTextoStyle}>{colaborador.observacoes}</span>
          </div>
        )}

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
            style={btnCopiarStyle}
          >
            {copiado ? (
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
  gap: 16,
  padding: 18,
  borderRadius: 20,
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.10)",
  boxShadow: "0 14px 34px rgba(0,0,0,0.20)",
};

const cardAvatarWrapStyle: React.CSSProperties = {
  width: 60,
  height: 60,
  minWidth: 60,
  borderRadius: 18,
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
  fontSize: 20,
};

const cardTopStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 10,
  flexWrap: "wrap",
};

const cardNomeStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 17,
  fontWeight: 800,
  color: "#FFFFFF",
};

const statusBadge: React.CSSProperties = {
  padding: "5px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 800,
};

const semAcessoBadge: React.CSSProperties = {
  padding: "5px 11px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  color: "#FBBF24",
  background: "rgba(245,158,11,0.14)",
};

const infoLinhasStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "8px 18px",
  margin: "12px 0 4px",
};

const infoItemStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 7,
  color: "#CBD5E1",
  fontSize: 13.5,
};

const obsStyle: React.CSSProperties = {
  display: "flex",
  gap: 8,
  marginTop: 10,
  padding: "10px 12px",
  borderRadius: 12,
  background: "rgba(245,158,11,0.08)",
  border: "1px solid rgba(245,158,11,0.18)",
};

const obsTextoStyle: React.CSSProperties = {
  color: "#E2E8F0",
  fontSize: 13,
  lineHeight: 1.5,
  whiteSpace: "pre-wrap",
};

const acoesWrapStyle: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
  marginTop: 14,
};

const acaoBaseStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  height: 38,
  padding: "0 14px",
  borderRadius: 11,
  border: "1px solid transparent",
  fontSize: 13,
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
