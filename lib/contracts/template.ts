export type ContractClause = {
  id: string;
  content: string;
};

export type ContractTopic = {
  id: string;
  title: string;
  clauses: ContractClause[];
};

export type LegacyContractFields = {
  objeto_base?: string | null;
  remuneracao_base?: string | null;
  obrigacao_contratado?: string | null;
  obrigacao_contratante?: string | null;
  multa_contratado?: string | null;
  multa_contratante?: string | null;
  foro?: string | null;
  texto_final?: string | null;
};

export type ContractVariable = {
  key: string;
  label: string;
  description: string;
};

export const CONTRACT_VARIABLES: ContractVariable[] = [
  { key: "local", label: "Local", description: "Endereço do evento" },
  { key: "data_evento", label: "Data", description: "Data da apresentação" },
  { key: "hora_inicio", label: "Início", description: "Horário inicial" },
  { key: "hora_fim", label: "Término", description: "Horário calculado" },
  { key: "duracao", label: "Duração", description: "Duração do show" },
  { key: "formato", label: "Formato", description: "Formato artístico" },
  { key: "valor", label: "Valor", description: "Cachê formatado" },
  { key: "valor_extenso", label: "Valor por extenso", description: "Cachê por extenso" },
  { key: "pagamento", label: "Pagamento", description: "Condição de pagamento" },
];

const fallback = (value: string | null | undefined, defaultValue: string) =>
  value?.trim() || defaultValue;

export function createLegacyContractTopics(fields: LegacyContractFields): ContractTopic[] {
  return [
    createTopic(
      "objeto",
      "DO OBJETO DO CONTRATO",
      `${fallback(fields.objeto_base, "O presente contrato tem como objeto a realização de apresentação artística musical pelo CONTRATADO.")} A apresentação será realizada no local **{local}**, no dia **{data_evento}**, iniciando-se às **{hora_inicio}** e terminando às **{hora_fim}**, com duração de **{duracao}**, no formato **{formato}**.`,
    ),
    createTopic(
      "remuneracao",
      "DA REMUNERAÇÃO",
      `${fallback(fields.remuneracao_base, "O CONTRATANTE pagará o valor acordado pela apresentação do artista contratado.")} O valor será de **{valor} ({valor_extenso})**, com pagamento em **{pagamento}**.`,
    ),
    createTopic(
      "obrigacao-contratado",
      "DAS OBRIGAÇÕES DO CONTRATADO",
      fallback(fields.obrigacao_contratado, "O CONTRATADO deverá comparecer no dia, local e horário acordados para realizar a apresentação descrita neste contrato."),
    ),
    createTopic(
      "obrigacao-contratante",
      "DAS OBRIGAÇÕES DO CONTRATANTE",
      fallback(fields.obrigacao_contratante, "O CONTRATANTE deverá disponibilizar as condições necessárias para a realização da apresentação."),
    ),
    createTopic(
      "multa-contratado",
      "DO CANCELAMENTO PELO CONTRATADO",
      fallback(fields.multa_contratado, "Em caso de cancelamento pelo CONTRATADO, serão aplicadas as condições acordadas entre as partes."),
    ),
    createTopic(
      "multa-contratante",
      "DO CANCELAMENTO PELO CONTRATANTE",
      fallback(fields.multa_contratante, "Em caso de cancelamento pelo CONTRATANTE, serão aplicadas as condições acordadas entre as partes."),
    ),
    createTopic(
      "foro",
      "DO FORO",
      fallback(fields.foro, "Fica eleito o foro da comarca indicada neste contrato para dirimir eventuais questões decorrentes deste instrumento."),
    ),
    createTopic(
      "final",
      "DAS DISPOSIÇÕES FINAIS",
      fallback(fields.texto_final, "E, por estarem de comum acordo, as partes assinam o presente contrato em duas vias de igual teor e forma."),
    ),
  ];
}

export function normalizeContractTopics(
  value: unknown,
  legacy: LegacyContractFields,
): ContractTopic[] {
  if (Array.isArray(value)) {
    const topics = value
      .map((item, index) => {
        const source = item as Partial<ContractTopic> & { content?: unknown };
        const clauses = Array.isArray(source.clauses)
          ? source.clauses.map((clause, clauseIndex) => {
              const clauseSource = clause as Partial<ContractClause>;
              return {
                id: String(clauseSource.id || cryptoId(`clause-${index + 1}-${clauseIndex + 1}`)),
                content: String(clauseSource.content || ""),
              };
            })
          : [createContractClause(String(source.content || ""))];

        return {
          id: String(source.id || cryptoId(`topic-${index + 1}`)),
          title: String(source.title || "NOVO TÓPICO"),
          clauses: clauses.length ? clauses : [createContractClause()],
        };
      })
      .filter((topic) =>
        topic.title.trim() || topic.clauses.some((clause) => clause.content.trim()),
      );
    if (topics.length) return topics;
  }
  return createLegacyContractTopics(legacy);
}

export function replaceContractVariables(
  template: string,
  variables: Record<string, string>,
) {
  return (template || "").replace(/\{([a-z0-9_]+)\}/gi, (match, key: string) =>
    Object.prototype.hasOwnProperty.call(variables, key) ? variables[key] : match,
  );
}

export function buildContractText(args: {
  title: string;
  contractor: string;
  client: string;
  topics: ContractTopic[];
  variables: Record<string, string>;
  city: string;
  signatureDate: string;
}) {
  let clauseNumber = 0;
  const renderedTopics = args.topics.map((topic) => {
    const renderedClauses = topic.clauses.map((clause) => {
      clauseNumber += 1;
      const content = replaceContractVariables(clause.content, args.variables);
      return `**Cláusula ${clauseNumber}ª.** ${content}`;
    });
    return [topic.title.trim() || "TÓPICO DO CONTRATO", ...renderedClauses].join("\n\n");
  });

  return [
    args.title,
    `CONTRATANTE:\n\n${args.client}`,
    `CONTRATADO:\n\n${args.contractor}`,
    "As partes acima identificadas têm, entre si, justo e contratado o presente Contrato de Prestação de Serviços Artísticos, mediante as cláusulas e condições seguintes.",
    ...renderedTopics,
    `**${args.city}, ${args.signatureDate}.**`,
  ].join("\n\n");
}

export function countClausesBefore(topics: ContractTopic[], topicIndex: number) {
  return topics
    .slice(0, topicIndex)
    .reduce((total, topic) => total + topic.clauses.length, 0);
}

export function createContractClause(content = ""): ContractClause {
  return { id: cryptoId("clause"), content };
}

function createTopic(prefix: string, title: string, content: string): ContractTopic {
  return { id: cryptoId(prefix), title, clauses: [createContractClause(content)] };
}

function cryptoId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
