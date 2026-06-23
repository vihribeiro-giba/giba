import type React from "react";
import { Camera, X } from "lucide-react";
import { corAvatar, iniciais } from "./utils";

type AvatarUploadProps = {
  photoUrl: string | null;
  nome: string;
  enviandoFoto: boolean;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelecionar: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemover: () => void;
};

export default function AvatarUpload({
  photoUrl,
  nome,
  enviandoFoto,
  fileInputRef,
  onSelecionar,
  onRemover,
}: AvatarUploadProps) {
  return (
    <div style={fotoWrapperStyle}>
      <div style={fotoPreviewStyle}>
        {enviandoFoto ? (
          <div style={fotoSpinnerStyle} aria-label="Enviando foto" />
        ) : photoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photoUrl || "/placeholder.svg"}
            alt="Foto do colaborador"
            style={fotoImgStyle}
          />
        ) : (
          <div
            style={{
              ...fotoIniciaisStyle,
              background: corAvatar(nome || "?"),
            }}
          >
            {iniciais(nome)}
          </div>
        )}
      </div>

      <div style={{ display: "grid", gap: 8, flex: 1 }}>
        <span style={fotoLabelStyle}>Foto do colaborador</span>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={enviandoFoto}
            style={{
              ...fotoUploadBtnStyle,
              opacity: enviandoFoto ? 0.6 : 1,
              cursor: enviandoFoto ? "not-allowed" : "pointer",
            }}
          >
            <Camera size={15} />
            {enviandoFoto ? "Enviando..." : photoUrl ? "Trocar" : "Enviar foto"}
          </button>
          {photoUrl && !enviandoFoto && (
            <button type="button" onClick={onRemover} style={fotoRemoverBtnStyle}>
              <X size={15} />
              Remover
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onSelecionar}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

const fotoWrapperStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 16,
  padding: 14,
  borderRadius: 16,
  background: "rgba(0,0,0,0.22)",
  border: "1px solid rgba(255,255,255,0.10)",
};

const fotoPreviewStyle: React.CSSProperties = {
  width: 72,
  height: 72,
  minWidth: 72,
  borderRadius: 20,
  overflow: "hidden",
  border: "1px solid rgba(255,255,255,0.14)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  background: "rgba(255,255,255,0.04)",
};

const fotoImgStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  objectFit: "cover",
  display: "block",
};

const fotoIniciaisStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#FFFFFF",
  fontWeight: 900,
  fontSize: 22,
};

const fotoSpinnerStyle: React.CSSProperties = {
  width: 26,
  height: 26,
  borderRadius: "50%",
  border: "3px solid rgba(255,255,255,0.18)",
  borderTopColor: "#00AAFF",
  animation: "colSpin .7s linear infinite",
};

const fotoLabelStyle: React.CSSProperties = {
  color: "#CBD5E1",
  fontSize: 13,
  fontWeight: 700,
};

const fotoUploadBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid rgba(0,170,255,0.30)",
  background: "rgba(0,170,255,0.14)",
  color: "#38BDF8",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};

const fotoRemoverBtnStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "8px 14px",
  borderRadius: 10,
  border: "1px solid rgba(255,91,138,0.30)",
  background: "rgba(255,91,138,0.12)",
  color: "#FF7AA2",
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
};
