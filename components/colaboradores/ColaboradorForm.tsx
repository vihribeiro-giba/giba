import type React from "react";
import type { PixTipo } from "./types";
import { placeholderPix } from "./utils";
import AvatarUpload from "./AvatarUpload";

type ColaboradorFormProps = {
  editandoId: string | null;
  salvando: boolean;
  enviandoFoto: boolean;

  nome: string;
  setNome: (v: string) => void;
  funcao: string;
  setFuncao: (v: string) => void;
  celular: string;
  setCelular: (v: string) => void;
  email: string;
  setEmail: (v: string) => void;
  instagram: string;
  setInstagram: (v: string) => void;
  senha: string;
  setSenha: (v: string) => void;
  status: string;
  setStatus: (v: string) => void;
  pixTipo: PixTipo;
  setPixTipo: (v: PixTipo) => void;
  pixChave: string;
  setPixChave: (v: string) => void;
  pixFavorecido: string;
  setPixFavorecido: (v: string) => void;
  observacoes: string;
  setObservacoes: (v: string) => void;

  photoUrl: string | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  onSelecionarFoto: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoverFoto: () => void;

  formRef: React.RefObject<HTMLDivElement | null>;
  onSubmit: (e: React.FormEvent) => void;
  onCancelar: () => void;
};


function formatarCelular(valor: string) {
  const numeros = valor.replace(/\D/g, "").slice(0, 11)

  if (numeros.length <= 2) return numeros
  if (numeros.length <= 3) return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`
  if (numeros.length <= 7) return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3)}`

  return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 3)} ${numeros.slice(3, 7)}-${numeros.slice(7)}`
}

export default function ColaboradorForm({
  editandoId,
  salvando,
  enviandoFoto,
  nome,
  setNome,
  funcao,
  setFuncao,
  celular,
  setCelular,
  email,
  setEmail,
  instagram,
  setInstagram,
  senha,
  setSenha,
  status,
  setStatus,
  pixTipo,
  setPixTipo,
  pixChave,
  setPixChave,
  pixFavorecido,
  setPixFavorecido,
  observacoes,
  setObservacoes,
  photoUrl,
  fileInputRef,
  onSelecionarFoto,
  onRemoverFoto,
  formRef,
  onSubmit,
  onCancelar,
}: ColaboradorFormProps) {
  return (
    <div ref={formRef} style={panelStyle}>
      <div style={panelHeaderStyle}>
        <h2 style={panelTitleStyle}>
          {editandoId ? "Editar Colaborador" : "Cadastrar Colaborador"}
        </h2>
        {editandoId && <span style={editandoBadgeStyle}>Editando</span>}
      </div>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14, marginTop: 20 }}>
        <AvatarUpload
          photoUrl={photoUrl}
          nome={nome}
          enviandoFoto={enviandoFoto}
          fileInputRef={fileInputRef}
          onSelecionar={onSelecionarFoto}
          onRemover={onRemoverFoto}
        />

        <input
          className="col-input"
          style={inputStyle}
          placeholder="Nome completo"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />

        <input
          className="col-input"
          style={inputStyle}
          placeholder="Função. Ex: Baterista, Técnico de som..."
          value={funcao}
          onChange={(e) => setFuncao(e.target.value)}
        />

        <input
          className="col-input"
          style={inputStyle}
          placeholder="Celular"
          value={celular}
          onChange={(e) => setCelular(formatarCelular(e.target.value))}
          inputMode="numeric"
          maxLength={16}
        />

        <input
          className="col-input"
          style={inputStyle}
          placeholder="E-mail. Ex: NomeSobrenome@NomeArtistico.com.br"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          className="col-input"
          style={inputStyle}
          placeholder="Instagram. Ex: @plataformagiba"
          value={instagram}
          onChange={(e) => setInstagram(e.target.value)}
        />

        <input
          className="col-input"
          style={inputStyle}
          placeholder={
            editandoId
              ? "Nova senha do colaborador (opcional)"
              : "Senha de acesso do colaborador"
          }
          type="password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          required={!editandoId}
        />

        {/* PIX */}
        <div style={pixGridStyle}>
          <select
            style={selectStyle}
            value={pixTipo}
            onChange={(e) => setPixTipo(e.target.value as PixTipo)}
          >
            <option value="CPF" style={optionStyle}>CPF</option>
            <option value="Telefone" style={optionStyle}>Telefone</option>
            <option value="E-mail" style={optionStyle}>E-mail</option>
            <option value="Chave Aleatória" style={optionStyle}>Chave Aleatória</option>
          </select>
          <input
            className="col-input"
            style={inputStyle}
            placeholder={placeholderPix(pixTipo)}
            value={pixChave}
            onChange={(e) => setPixChave(e.target.value)}
          />
        </div>

        <textarea
          className="col-input"
          style={textareaStyle}
          placeholder="Observações"
          rows={4}
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
        />

        <select
          style={selectStyle}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option style={optionStyle}>Ativo</option>
          <option style={optionStyle}>Inativo</option>
        </select>

        <button
          type="submit"
          style={{
            ...botaoPrincipal,
            opacity: salvando || enviandoFoto ? 0.7 : 1,
            cursor: salvando || enviandoFoto ? "not-allowed" : "pointer",
          }}
          disabled={salvando || enviandoFoto}
        >
          {salvando
            ? "Salvando..."
            : enviandoFoto
            ? "Enviando foto..."
            : editandoId
            ? "Salvar Alterações"
            : "Cadastrar Colaborador"}
        </button>

        {editandoId && (
          <button type="button" onClick={onCancelar} style={botaoSecundario}>
            Cancelar edição
          </button>
        )}
      </form>
    </div>
  );
}

const panelStyle: React.CSSProperties = {
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.10)",
  borderRadius: 24,
  padding: 24,
  boxShadow: "0 0 40px rgba(0,0,0,0.25)",
};

const panelHeaderStyle: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 10,
};

const panelTitleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 19,
  fontWeight: 800,
  color: "#FFFFFF",
};

const editandoBadgeStyle: React.CSSProperties = {
  padding: "5px 12px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  color: "#00AAFF",
  background: "rgba(0,170,255,0.14)",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.28)",
  color: "#fff",
  fontSize: 15,
  boxSizing: "border-box",
};


const selectStyle: React.CSSProperties = {
  ...inputStyle,
  appearance: "none",
  WebkitAppearance: "none",
  background:
    "linear-gradient(135deg, rgba(7,11,22,0.96), rgba(10,15,28,0.96))",
  color: "#FFFFFF",
  cursor: "pointer",
};

const optionStyle: React.CSSProperties = {
  background: "#0A0F1C",
  color: "#FFFFFF",
};

const textareaStyle: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(0,0,0,0.28)",
  color: "#fff",
  fontSize: 15,
  boxSizing: "border-box",
  resize: "vertical",
  minHeight: 96,
  fontFamily: "inherit",
  lineHeight: 1.5,
};

const pixGridStyle: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "1fr 1fr",
  gap: 12,
};

const botaoPrincipal: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "none",
  background: "linear-gradient(90deg, #8B35FF, #00AAFF)",
  color: "#fff",
  fontSize: 16,
  fontWeight: "bold",
  cursor: "pointer",
  boxShadow: "0 14px 30px rgba(139,53,255,0.26)",
};

const botaoSecundario: React.CSSProperties = {
  width: "100%",
  padding: 14,
  borderRadius: 12,
  border: "1px solid rgba(255,255,255,0.16)",
  background: "rgba(255,255,255,0.08)",
  color: "#fff",
  cursor: "pointer",
  fontWeight: 700,
};
