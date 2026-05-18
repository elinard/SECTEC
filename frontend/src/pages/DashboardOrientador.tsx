import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  BarChart3,
  Check,
  CheckCircle2,
  Clock3,
  FileText,
  FolderOpen,
  MessageSquare,
  Plus,
  Save,
  Search,
  Settings2,
  SlidersHorizontal,
  Trash2,
  Users,
  X,
} from "lucide-react";

import { MainLayout } from "../componentes/SideBarUniversal";
import EixoDropdown, {
  EIXOS_LIST,
  type EixoTematico,
} from "../componentes/EixoDropdown";
import { apiRequest } from "../lib/api";

type EixoProjeto = Exclude<EixoTematico, "todos">;
type Risco = "alto" | "medio" | "baixo";
type StatusEntrega = "pendente" | "revisada" | "recusada";
type StatusProjeto = "aguardando" | "aprovado" | "ajustes";
type FiltroSolicitacao = "pendentes" | "reprovadas" | "todas";

type RegistroComEixo = {
  eixoSlug: EixoProjeto;
  temaId?: number;
};

type Equipe = RegistroComEixo & {
  id: string;
  projetoId?: number;
  nome: string;
  turma: string;
  eixo: string;
  tema: string;
  lider: string;
  integrantes: number;
  progresso: number;
  ultimoContato: string;
  proximaReuniao: string;
  risco: Risco;
};

type Entrega = RegistroComEixo & {
  id: string;
  projetoId?: number;
  materialId?: number;
  arquivo: string;
  equipe: string;
  turma: string;
  aluno: string;
  etapa: string;
  data: string;
  status: StatusEntrega;
};

type Projeto = RegistroComEixo & {
  id: string;
  projetoId?: number;
  orientacaoId?: number;
  titulo: string;
  equipe: string;
  turma: string;
  enviadoEm: string;
  status: StatusProjeto;
};

type UsuarioProjetoApi = {
  id: number | string;
  nome: string;
  ano?: number;
  turma?: string | null;
};

type ProjetoApi = {
  id: number;
  titulo: string;
  descricao?: string;
  temaId?: number;
  tema?: TemaOrientadorApi;
  criadoEm?: string;
  evento?: {
    id: number;
    titulo?: string;
  };
  alunoAutor?: UsuarioProjetoApi;
  projetoAlunos?: Array<{
    id?: number | string;
    aluno?: UsuarioProjetoApi;
  }>;
};

type OrientacaoApi = {
  id: number;
  status: "pendente" | "aceito" | "recusado";
  criadoEm?: string;
  respondidoEm?: string | null;
  projeto?: ProjetoApi;
};

type MaterialApi = {
  id: number;
  tipo: "pdf" | "pdf_relatorio" | "link";
  status: "em_analise" | "aprovado" | "recusado";
  conteudo: string;
  opiniao?: string;
  criadoEm?: string;
};

type PdfApi = {
  fileId: number;
  materialId?: number;
  projetoId: number;
  originalName?: string;
  status?: string;
  enviadoEm?: string;
};

type TemaOrientadorApi = {
  id: number;
  nome: string;
};

type EventoAtualApi = {
  id: number;
  titulo: string;
  temas?: TemaOrientadorApi[];
};

type UsuarioOrientadorApi = {
  id: number | string;
  temasSelecionados?: TemaOrientadorApi[];
};

const eixosProjeto = EIXOS_LIST.filter((eixo): eixo is EixoProjeto => eixo !== "todos");
function cx(...classes: Array<string | false | undefined>) {
  return classes.filter(Boolean).join(" ");
}

function eixoFromTemaId(temaId?: number): EixoProjeto {
  if (!temaId || temaId < 1) return "tecnologia";
  return eixosProjeto[(temaId - 1) % eixosProjeto.length];
}

function temaIdFromProjeto(projeto?: ProjetoApi) {
  return projeto?.temaId ?? projeto?.tema?.id;
}

function temaNomeFromProjeto(projeto?: ProjetoApi) {
  return projeto?.tema?.nome ?? (temaIdFromProjeto(projeto) ? `Tema #${temaIdFromProjeto(projeto)}` : "Tema não informado");
}

function formatBackendDate(value?: string | null) {
  if (!value) return "Sem data";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Sem data";

  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function turmaFromProjeto(projeto?: ProjetoApi) {
  const ano = projeto?.alunoAutor?.ano ?? projeto?.projetoAlunos?.find((item) => item.aluno?.ano)?.aluno?.ano;
  const turma =
    projeto?.alunoAutor?.turma ?? projeto?.projetoAlunos?.find((item) => item.aluno?.turma)?.aluno?.turma;

  if (ano && turma) return `${ano}º ano - ${turma}`;
  if (ano) return `${ano}º ano`;
  if (turma) return turma;
  return "Turma não informada";
}

function liderFromProjeto(projeto?: ProjetoApi) {
  return projeto?.alunoAutor?.nome ?? projeto?.projetoAlunos?.[0]?.aluno?.nome ?? "Aluno não informado";
}

function nomeCurto(nome: string) {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length <= 2) return nome;
  return `${partes[0]} ${partes[partes.length - 1]}`;
}

function integrantesFromProjeto(projeto?: ProjetoApi) {
  const ids = new Set<number | string>();

  if (projeto?.alunoAutor?.id) ids.add(projeto.alunoAutor.id);
  projeto?.projetoAlunos?.forEach((item) => {
    if (item.aluno?.id) ids.add(item.aluno.id);
  });

  return Math.max(ids.size, 1);
}

function statusProjetoFromOrientacao(status: OrientacaoApi["status"]): StatusProjeto {
  if (status === "aceito") return "aprovado";
  if (status === "recusado") return "ajustes";
  return "aguardando";
}

function riscoFromOrientacao(status: OrientacaoApi["status"]): Risco {
  if (status === "pendente") return "alto";
  if (status === "recusado") return "medio";
  return "baixo";
}

function progressoFromOrientacao(status: OrientacaoApi["status"]) {
  if (status === "aceito") return 75;
  if (status === "recusado") return 35;
  return 45;
}

function mapOrientacaoToProjeto(orientacao: OrientacaoApi): Projeto {
  const projeto = orientacao.projeto;
  const temaId = temaIdFromProjeto(projeto);
  const eixoSlug = eixoFromTemaId(temaId);

  return {
    id: `orientacao-${orientacao.id}`,
    projetoId: projeto?.id,
    orientacaoId: orientacao.id,
    titulo: projeto?.titulo ?? "Projeto sem título",
    equipe: liderFromProjeto(projeto),
    turma: turmaFromProjeto(projeto),
    enviadoEm: formatBackendDate(orientacao.criadoEm),
    status: statusProjetoFromOrientacao(orientacao.status),
    eixoSlug,
    temaId,
  };
}

function mapProjetoToOrientacao(projeto: ProjetoApi): OrientacaoApi {
  return {
    id: projeto.id,
    status: "aceito",
    criadoEm: projeto.criadoEm,
    respondidoEm: null,
    projeto,
  };
}

function orientacaoProjetoKey(orientacao: OrientacaoApi) {
  return orientacao.projeto?.id ? `projeto-${orientacao.projeto.id}` : `orientacao-${orientacao.id}`;
}

function orientacaoStatusWeight(status: OrientacaoApi["status"]) {
  if (status === "aceito") return 3;
  if (status === "pendente") return 2;
  return 1;
}

function dedupeOrientacoes(orientacoes: OrientacaoApi[]) {
  const mapa = new Map<string, OrientacaoApi>();

  orientacoes.forEach((orientacao) => {
    const key = orientacaoProjetoKey(orientacao);
    const atual = mapa.get(key);

    if (!atual || orientacaoStatusWeight(orientacao.status) > orientacaoStatusWeight(atual.status)) {
      mapa.set(key, orientacao);
    }
  });

  return Array.from(mapa.values());
}

function mapOrientacaoToEquipe(orientacao: OrientacaoApi): Equipe {
  const projeto = orientacao.projeto;
  const temaId = temaIdFromProjeto(projeto);
  const eixoSlug = eixoFromTemaId(temaId);
  const lider = liderFromProjeto(projeto);

  return {
    id: `orientacao-${orientacao.id}`,
    projetoId: projeto?.id,
    nome: projeto?.titulo ? `Equipe ${projeto.titulo}` : `Equipe ${lider}`,
    turma: turmaFromProjeto(projeto),
    eixo: temaNomeFromProjeto(projeto),
    eixoSlug,
    tema: projeto?.descricao ?? projeto?.titulo ?? "Projeto sem descrição cadastrada",
    lider,
    integrantes: integrantesFromProjeto(projeto),
    progresso: progressoFromOrientacao(orientacao.status),
    ultimoContato: orientacao.respondidoEm ? formatBackendDate(orientacao.respondidoEm) : formatBackendDate(orientacao.criadoEm),
    proximaReuniao: "A definir",
    risco: riscoFromOrientacao(orientacao.status),
    temaId,
  };
}

function materialStatusToEntregaStatus(status: MaterialApi["status"]): StatusEntrega {
  if (status === "aprovado") return "revisada";
  if (status === "recusado") return "recusada";
  return "pendente";
}

function materialEtapa(tipo: MaterialApi["tipo"]) {
  if (tipo === "pdf_relatorio") return "Relatório final";
  if (tipo === "pdf") return "Banner";
  return "Link de vídeo";
}

function materialArquivo(material: MaterialApi) {
  if (!material.conteudo) return materialEtapa(material.tipo);

  const partes = material.conteudo.split("/");
  return partes.at(-1) || material.conteudo;
}

function mapMaterialToEntrega(material: MaterialApi, orientacao: OrientacaoApi): Entrega {
  const projeto = orientacao.projeto;
  const temaId = temaIdFromProjeto(projeto);
  const eixoSlug = eixoFromTemaId(temaId);

  return {
    id: `material-${material.id}`,
    projetoId: projeto?.id,
    materialId: material.id,
    arquivo: materialArquivo(material),
    equipe: projeto?.titulo ?? "Projeto sem título",
    turma: turmaFromProjeto(projeto),
    aluno: liderFromProjeto(projeto),
    etapa: materialEtapa(material.tipo),
    data: formatBackendDate(material.criadoEm),
    status: materialStatusToEntregaStatus(material.status),
    eixoSlug,
    temaId,
  };
}

function mapPdfToEntrega(pdf: PdfApi, orientacao: OrientacaoApi): Entrega {
  const projeto = orientacao.projeto;
  const temaId = temaIdFromProjeto(projeto);
  const eixoSlug = eixoFromTemaId(temaId);

  return {
    id: `pdf-${pdf.fileId}`,
    projetoId: projeto?.id,
    materialId: pdf.materialId,
    arquivo: pdf.originalName ?? `PDF #${pdf.fileId}`,
    equipe: projeto?.titulo ?? "Projeto sem título",
    turma: turmaFromProjeto(projeto),
    aluno: liderFromProjeto(projeto),
    etapa: "PDF do projeto",
    data: formatBackendDate(pdf.enviadoEm),
    status: pdf.status === "VALID" || pdf.status === "aprovado" ? "revisada" : "pendente",
    eixoSlug,
    temaId,
  };
}

function useOrientadorBackendData() {
  const [orientacoes, setOrientacoes] = useState<OrientacaoApi[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;

    async function carregar() {
      setCarregando(true);

      try {
        const [todasResult, pendentesResult] = await Promise.allSettled([
          apiRequest<OrientacaoApi[]>("/orientacoes"),
          apiRequest<OrientacaoApi[]>("/orientacoes/pendentes"),
        ]);
        if (!active) return;

        if (todasResult.status === "rejected" && pendentesResult.status === "rejected") {
          throw todasResult.reason;
        }

        const todas = todasResult.status === "fulfilled" ? todasResult.value : [];
        const pendentes = pendentesResult.status === "fulfilled" ? pendentesResult.value : [];
        setOrientacoes(dedupeOrientacoes([...todas, ...pendentes]));
        setErro(pendentesResult.status === "rejected" ? "Orientações carregadas; pendentes dedicadas não puderam ser consultadas." : "");
      } catch (error) {
        try {
          const projetos = await apiRequest<ProjetoApi[]>("/projetos");
          if (!active) return;
          setOrientacoes(dedupeOrientacoes(projetos.map(mapProjetoToOrientacao)));
          setErro("O servidor publicado não tem /orientacoes; usando /projetos. Aceitar/recusar orientação fica sem backend.");
        } catch (fallbackError) {
          if (!active) return;
          setOrientacoes([]);
          setErro(
            fallbackError instanceof Error
              ? fallbackError.message
              : error instanceof Error
                ? error.message
                : "Não foi possível carregar dados do orientador no backend."
          );
        }
      } finally {
        if (active) setCarregando(false);
      }
    }

    carregar();

    return () => {
      active = false;
    };
  }, []);

  const equipes = useMemo(
    () => orientacoes.filter((orientacao) => orientacao.status === "aceito").map(mapOrientacaoToEquipe),
    [orientacoes]
  );
  const projetos = useMemo(() => orientacoes.map(mapOrientacaoToProjeto), [orientacoes]);

  async function responderProjeto(projeto: Projeto, status: StatusProjeto) {
    if (!projeto.orientacaoId) {
      throw new Error("Sem endpoint no backend publicado para aceitar ou recusar orientações.");
    }

    const action = status === "aprovado" ? "aceito" : "recusado";
    const orientacaoAtualizada = await apiRequest<OrientacaoApi>(`/orientacoes/${projeto.orientacaoId}/responder`, {
      method: "PATCH",
      body: { action },
    });

    setOrientacoes((lista) =>
      dedupeOrientacoes(
        lista.map((orientacao) =>
          orientacao.id === orientacaoAtualizada.id
            ? { ...orientacao, ...orientacaoAtualizada, projeto: orientacaoAtualizada.projeto ?? orientacao.projeto }
            : orientacao
        )
      )
    );

    return true;
  }

  async function buscarProjetoDetalhe(projetoId: number) {
    return apiRequest<ProjetoApi>(`/projetos/${projetoId}`);
  }

  return { orientacoes, equipes, projetos, carregando, erro, responderProjeto, buscarProjetoDetalhe };
}

function useTemasOrientadorData() {
  const [temas, setTemas] = useState<TemaOrientadorApi[]>([]);
  const [selecionadosIds, setSelecionadosIds] = useState<number[]>([]);
  const [eventoTitulo, setEventoTitulo] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;

    async function carregar() {
      setCarregando(true);

      try {
        const evento = await apiRequest<EventoAtualApi | null>("/evento/atual/vigente");
        let temasSelecionadosIds: number[] = [];
        let avisoSelecao = "";

        try {
          const userId = typeof window !== "undefined" ? localStorage.getItem("userId") : null;
          const orientadores = await apiRequest<UsuarioOrientadorApi[]>("/users/orientadores");
          const orientadorAtual = orientadores.find((orientador) => String(orientador.id) === String(userId));
          temasSelecionadosIds = orientadorAtual?.temasSelecionados?.map((tema) => tema.id) ?? [];
        } catch {
          avisoSelecao = "Eixos carregados do evento atual; seleção anterior do orientador não pôde ser carregada.";
        }

        if (!active) return;
        const temasEvento = evento?.temas ?? [];
        setTemas(temasEvento);
        setSelecionadosIds(temasSelecionadosIds);
        setEventoTitulo(evento?.titulo ?? "");
        setErro(avisoSelecao);
      } catch (error) {
        if (!active) return;
        setTemas([]);
        setSelecionadosIds([]);
        setEventoTitulo("");
        setErro(error instanceof Error ? error.message : "Não foi possível carregar os eixos temáticos do evento atual.");
      } finally {
        if (active) setCarregando(false);
      }
    }

    carregar();

    return () => {
      active = false;
    };
  }, []);

  async function salvar(novosSelecionadosIds: number[]) {
    setSalvando(true);

    try {
      await apiRequest("/evento/temas/sincronizar", {
        method: "POST",
        body: { temasIds: novosSelecionadosIds },
      });
      setSelecionadosIds(novosSelecionadosIds);
      setErro("");
    } finally {
      setSalvando(false);
    }
  }

  return {
    temas,
    selecionadosIds,
    setSelecionadosIds,
    eventoTitulo,
    carregando,
    salvando,
    erro,
    salvar,
  };
}

function useEntregasBackendData(orientacoes: OrientacaoApi[], orientacoesCarregando: boolean) {
  const [entregas, setEntregas] = useState<Entrega[]>([]);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let active = true;

    async function carregar() {
      if (orientacoesCarregando) return;

      const orientacoesAceitas = orientacoes.filter((orientacao) => orientacao.status === "aceito" && orientacao.projeto?.id);

      if (orientacoesAceitas.length === 0) {
        setEntregas([]);
        setErro("");
        setCarregando(false);
        return;
      }

      setCarregando(true);

      const respostas = await Promise.allSettled(
        orientacoesAceitas.map(async (orientacao) => {
          try {
            const materiais = await apiRequest<MaterialApi[]>(`/materiais/projeto/${orientacao.projeto?.id}`);
            return materiais.map((material) => mapMaterialToEntrega(material, orientacao));
          } catch {
            const pdf = await apiRequest<PdfApi>(`/pdf/projeto/${orientacao.projeto?.id}`);
            return [mapPdfToEntrega(pdf, orientacao)];
          }
        })
      );

      if (!active) return;

      const entregasCarregadas = respostas.flatMap((resposta) => (resposta.status === "fulfilled" ? resposta.value : []));
      const falhas = respostas.filter((resposta) => resposta.status === "rejected").length;

      setEntregas(entregasCarregadas);
      setErro(falhas ? "Algumas entregas não puderam ser carregadas. O servidor publicado não tem /materiais para todos os projetos." : "");
      setCarregando(false);
    }

    carregar();

    return () => {
      active = false;
    };
  }, [orientacoes, orientacoesCarregando]);

  async function revisarEntrega(entrega: Entrega, status: "aprovado" | "recusado" = "aprovado") {
    if (!entrega.materialId) {
      throw new Error("Sem endpoint no backend publicado para revisar esta entrega.");
    }

    const atualizado = await apiRequest<MaterialApi>(`/materiais/${entrega.materialId}/revisar`, {
      method: "PATCH",
      body: {
        status,
        opiniao: status === "aprovado" ? "Material revisado e aprovado pelo painel." : "Material revisado e recusado pelo painel.",
      },
    });

    setEntregas((lista) =>
      lista.map((item) =>
        item.materialId === atualizado.id ? { ...item, status: materialStatusToEntregaStatus(atualizado.status) } : item
      )
    );
  }

  return { entregas, carregando, erro, revisarEntrega };
}

function matchesEixo<T extends RegistroComEixo>(item: T, eixoAtivo: EixoTematico) {
  return eixoAtivo === "todos" || item.eixoSlug === eixoAtivo;
}

function filterByEixo<T extends RegistroComEixo>(items: T[], eixoAtivo: EixoTematico) {
  return items.filter((item) => matchesEixo(item, eixoAtivo));
}

function countByEixo<T extends RegistroComEixo>(items: T[], eixo: EixoTematico) {
  return eixo === "todos" ? items.length : items.filter((item) => item.eixoSlug === eixo).length;
}

function filterByTemasSelecionados<T extends RegistroComEixo>(items: T[], temasIds: number[], totalTemas = temasIds.length) {
  if (totalTemas > 0 && temasIds.length === 0) return [];
  if (totalTemas > 0 && temasIds.length >= totalTemas) return items;
  return items.filter((item) => item.temaId !== undefined && temasIds.includes(item.temaId));
}

function countByTema<T extends RegistroComEixo>(items: T[], temaId: number) {
  return items.filter((item) => item.temaId === temaId).length;
}

function filterByTemaAtivo<T extends RegistroComEixo>(items: T[], temaAtivoId: number | "todos") {
  if (temaAtivoId === "todos") return items;
  return items.filter((item) => item.temaId === temaAtivoId);
}

const fadeUp = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0 },
};

function PageShell({
  eyebrow,
  title,
  description,
  actions,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <MainLayout userRole="orientador">
      <motion.div
        initial="hidden"
        animate="visible"
        variants={fadeUp}
        transition={{ duration: 0.25 }}
        className="mx-auto w-full max-w-7xl space-y-6 px-4 py-5 sm:px-6 lg:px-8"
      >
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-sectec-700">
              {eyebrow}
            </p>
            <h1 className="mt-2 break-words text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              {title}
            </h1>
            <p className="mt-2 break-words text-sm font-medium leading-6 text-slate-500">
              {description}
            </p>
          </div>

          {actions && <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">{actions}</div>}
        </div>

        {children}
      </motion.div>
    </MainLayout>
  );
}

function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  className,
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition sm:w-auto",
        variant === "primary" && "bg-sectec-700 text-white hover:bg-sectec-800",
        variant === "secondary" && "border border-slate-200 bg-white text-slate-700 hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700",
        variant === "danger" && "border border-red-100 bg-red-50 text-red-600 hover:bg-red-100",
        disabled && "cursor-not-allowed opacity-50 hover:bg-inherit",
        className
      )}
    >
      {children}
    </button>
  );
}

function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className={cx("min-w-0 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5", className)}
    >
      {children}
    </motion.div>
  );
}

function Badge({
  children,
  tone = "neutral",
}: {
  children: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "blue" | "neutral";
}) {
  return (
    <span
      className={cx(
        "inline-flex max-w-full items-center rounded-md px-2.5 py-1 text-[11px] font-semibold",
        tone === "green" && "bg-sectec-50 text-sectec-700",
        tone === "yellow" && "bg-amber-50 text-amber-700",
        tone === "red" && "bg-red-50 text-red-600",
        tone === "blue" && "bg-sky-50 text-sky-700",
        tone === "neutral" && "bg-slate-100 text-slate-600"
      )}
    >
      {children}
    </span>
  );
}

function Notice({ message }: { message: string }) {
  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-sectec-200 bg-sectec-50 px-4 py-3 text-sm font-semibold text-sectec-800"
    >
      {message}
    </motion.div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-dashed border-slate-200 p-6 text-center text-sm font-semibold text-slate-400">
      {text}
    </div>
  );
}

function Progress({ value }: { value: number }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-400">andamento</span>
        <span className="text-slate-700">{value}%</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-slate-100">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.65, ease: "easeOut" }}
          className="h-full rounded-full bg-sectec-600"
        />
      </div>
    </div>
  );
}

function riscoTone(risco: Risco) {
  if (risco === "alto") return "red";
  if (risco === "medio") return "yellow";
  return "green";
}

function entregaTone(status: StatusEntrega) {
  if (status === "recusada") return "red";
  if (status === "pendente") return "yellow";
  return "green";
}

function projetoTone(status: StatusProjeto) {
  if (status === "aprovado") return "green";
  if (status === "ajustes") return "yellow";
  return "blue";
}

function projetoLabel(status: StatusProjeto) {
  if (status === "aguardando") return "analisar";
  if (status === "ajustes") return "reprovado";
  return "aprovado";
}

function StatCard({
  label,
  value,
  detail,
  icon,
  tone = "green",
  className,
}: {
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone?: "green" | "yellow" | "red" | "blue";
  className?: string;
}) {
  return (
    <Card className={cx("h-full", className)}>
      <div className="flex h-full items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold text-slate-900">{value}</p>
          <p
            className={cx(
              "mt-1 text-xs font-medium",
              tone === "red" && "text-red-500",
              tone === "yellow" && "text-amber-600",
              tone === "blue" && "text-sky-600",
              tone === "green" && "text-slate-400"
            )}
          >
            {detail}
          </p>
        </div>
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-sectec-50 text-sectec-700">
          {icon}
        </div>
      </div>
    </Card>
  );
}

function DetailLine({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-slate-400">{label}</p>
      <div className="mt-1 break-words text-sm font-semibold text-slate-700">{value}</div>
    </div>
  );
}

function FiltroEixoBox({
  eixoAtivo,
  onChange,
  contagemPorEixo,
  title = "Filtro por eixo",
  description = "Use o dropdown para ver apenas os dados do eixo selecionado.",
}: {
  eixoAtivo: EixoTematico;
  onChange: (eixo: EixoTematico) => void;
  contagemPorEixo: (eixo: EixoTematico) => number;
  title?: string;
  description?: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">{title}</p>
        <p className="mt-1 text-sm font-medium text-slate-500">{description}</p>
      </div>
      <EixoDropdown
        eixoAtivo={eixoAtivo}
        eixosList={EIXOS_LIST}
        contagemPorEixo={contagemPorEixo}
        onChange={onChange}
      />
    </div>
  );
}

function TemasChecklist({
  temas,
  selecionadosIds,
  eventoTitulo,
  carregando,
  salvando,
  contagemPorTema,
  onChange,
  onSave,
}: {
  temas: TemaOrientadorApi[];
  selecionadosIds: number[];
  eventoTitulo: string;
  carregando: boolean;
  salvando: boolean;
  contagemPorTema: (temaId: number) => number;
  onChange: (ids: number[]) => void;
  onSave: () => void;
}) {
  const [modalAberto, setModalAberto] = useState(false);

  function toggleTema(temaId: number) {
    onChange(
      selecionadosIds.includes(temaId)
        ? selecionadosIds.filter((id) => id !== temaId)
        : [...selecionadosIds, temaId]
    );
  }

  return (
    <>
      <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Eixos temáticos</p>
          <h2 className="mt-1 text-lg font-bold text-slate-900">
            {selecionadosIds.length} eixo(s) ativo(s)
          </h2>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {eventoTitulo ? `Evento atual: ${eventoTitulo}` : "Eixos carregados pelo evento atual."}
          </p>
        </div>

        <Button onClick={() => setModalAberto(true)} disabled={carregando}>
          <SlidersHorizontal size={16} />
          Eixos temáticos
        </Button>
      </div>

      <AnimatePresence>
        {modalAberto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 grid place-items-center bg-slate-950/40 px-4 py-6"
          >
            <motion.div
              initial={{ opacity: 0, y: 18, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.98 }}
              className="max-h-[90vh] w-full max-w-3xl overflow-hidden rounded-xl bg-white shadow-2xl"
            >
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 p-5">
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Eixos temáticos</p>
                  <h2 className="mt-1 text-lg font-bold text-slate-900">Eixos que o professor orienta</h2>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAberto(false)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                  aria-label="Fechar eixos temáticos"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="max-h-[60vh] overflow-y-auto p-5">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {carregando ? (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-400 sm:col-span-2">
                      Carregando eixos do evento atual...
                    </div>
                  ) : temas.length > 0 ? (
                    temas.map((tema) => {
                      const ativo = selecionadosIds.includes(tema.id);

                      return (
                        <label
                          key={tema.id}
                          className={cx(
                            "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition",
                            ativo
                              ? "border-sectec-300 bg-sectec-50 text-sectec-800"
                              : "border-slate-200 bg-white text-slate-600 hover:border-sectec-200 hover:bg-sectec-50"
                          )}
                        >
                          <input
                            type="checkbox"
                            checked={ativo}
                            onChange={() => toggleTema(tema.id)}
                            className="h-4 w-4 shrink-0 accent-sectec-700"
                          />
                          <span className="min-w-0 flex-1 break-words text-sm font-semibold">{tema.nome}</span>
                          <span className="rounded-md bg-white px-2 py-1 text-xs font-bold text-slate-500">
                            {contagemPorTema(tema.id)}
                          </span>
                        </label>
                      );
                    })
                  ) : (
                    <div className="rounded-lg border border-dashed border-slate-200 p-4 text-sm font-semibold text-slate-400 sm:col-span-2">
                      Nenhum eixo temático veio do evento atual.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2 border-t border-slate-100 p-5 sm:flex-row sm:justify-end">
                <Button variant="secondary" onClick={() => onChange(temas.map((tema) => tema.id))} disabled={carregando || salvando}>
                  Todos
                </Button>
                <Button
                  onClick={() => {
                    onSave();
                    setModalAberto(false);
                  }}
                  disabled={carregando || salvando || temas.length === 0}
                >
                  <Save size={16} />
                  {salvando ? "Salvando" : "Salvar temas"}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function FiltroTemaOrientador({
  temas,
  temaAtivoId,
  contagemPorTema,
  onChange,
}: {
  temas: TemaOrientadorApi[];
  temaAtivoId: number | "todos";
  contagemPorTema: (temaId: number | "todos") => number;
  onChange: (temaId: number | "todos") => void;
}) {
  if (temas.length === 0) return null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Filtro por tema</p>
        <p className="mt-1 text-sm font-medium text-slate-500">
          Aparecem aqui somente os temas que ficaram marcados para o orientador.
        </p>
      </div>
      <select
        value={String(temaAtivoId)}
        onChange={(event) => {
          const value = event.target.value;
          onChange(value === "todos" ? "todos" : Number(value));
        }}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100 sm:w-72"
      >
        <option value="todos">Todos ({contagemPorTema("todos")})</option>
        {temas.map((tema) => (
          <option key={tema.id} value={tema.id}>
            {tema.nome} ({contagemPorTema(tema.id)})
          </option>
        ))}
      </select>
    </div>
  );
}

function ProjetoDetalheCard({
  projeto,
  carregando,
  erro,
  onClose,
}: {
  projeto: ProjetoApi | null;
  carregando: boolean;
  erro: string;
  onClose: () => void;
}) {
  if (!projeto && !carregando && !erro) return null;

  const integrantes = projeto?.projetoAlunos?.flatMap((item) => (item.aluno?.nome ? [item.aluno.nome] : [])) ?? [];

  return (
    <Card>
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Detalhe do backend</p>
          <h2 className="mt-1 break-words text-lg font-bold text-slate-900">
            {carregando ? "Carregando projeto..." : projeto?.titulo ?? "Projeto"}
          </h2>
        </div>
        <Button variant="secondary" onClick={onClose} className="w-auto sm:w-auto">
          Fechar
        </Button>
      </div>

      {erro ? (
        <EmptyState text={erro} />
      ) : carregando ? (
        <EmptyState text="Buscando /projetos/:id no backend..." />
      ) : projeto ? (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <DetailLine label="Título" value={projeto.titulo} />
          <DetailLine label="Aluno autor" value={projeto.alunoAutor?.nome ?? "Não informado"} />
          <DetailLine label="Turma" value={turmaFromProjeto(projeto)} />
          <DetailLine label="Tema" value={temaNomeFromProjeto(projeto)} />
          <DetailLine label="Evento" value={projeto.evento?.titulo ?? projeto.evento?.id ?? "Não informado"} />
          <DetailLine label="Criado em" value={formatBackendDate(projeto.criadoEm)} />
          <div className="sm:col-span-2">
            <DetailLine label="Descrição" value={projeto.descricao || "Sem descrição cadastrada"} />
          </div>
          <div className="sm:col-span-2">
            <DetailLine
              label="Integrantes"
              value={
                integrantes.length > 0 ? (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {integrantes.map((nome) => (
                      <span
                        key={nome}
                        title={nome}
                        className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700"
                      >
                        {nomeCurto(nome)}
                      </span>
                    ))}
                  </div>
                ) : (
                  "Nenhum integrante extra retornado"
                )
              }
            />
          </div>
        </div>
      ) : null}
    </Card>
  );
}

function EquipeRow({
  equipe,
  onOpen,
}: {
  equipe: Equipe;
  onOpen?: (equipe: Equipe) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-200 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{equipe.nome}</h3>
            <Badge tone={riscoTone(equipe.risco)}>
              {equipe.risco === "alto" ? "risco alto" : equipe.risco === "medio" ? "acompanhar" : "em dia"}
            </Badge>
          </div>
          <p className="mt-1 text-sm font-medium leading-6 text-slate-500">{equipe.tema}</p>
          <p className="mt-2 text-xs font-semibold text-slate-400">
            {equipe.turma} · {equipe.eixo} · líder: {equipe.lider}
          </p>
        </div>

        <Button variant="secondary" onClick={() => onOpen?.(equipe)}>
          <MessageSquare size={15} />
          Abrir
        </Button>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-end">
        <Progress value={equipe.progresso} />
        <div className="text-xs">
          <p className="font-semibold text-slate-400">último contato</p>
          <p className="break-words font-semibold text-slate-700">{equipe.ultimoContato}</p>
        </div>
        <div className="text-xs">
          <p className="font-semibold text-slate-400">próxima orientação</p>
          <p className="break-words font-semibold text-slate-700">{equipe.proximaReuniao}</p>
        </div>
      </div>
    </div>
  );
}

function DashboardOrientador() {
  const backend = useOrientadorBackendData();
  const temasBackend = useTemasOrientadorData();
  const [turmaFiltro, setTurmaFiltro] = useState("todas");
  const [temaFiltro, setTemaFiltro] = useState<number | "todos">("todos");
  const [filtroSolicitacao, setFiltroSolicitacao] = useState<FiltroSolicitacao>("pendentes");
  const [aviso, setAviso] = useState("");
  const [projetoDetalhe, setProjetoDetalhe] = useState<ProjetoApi | null>(null);
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false);
  const [erroDetalhe, setErroDetalhe] = useState("");
  const equipesData = backend.equipes;
  const projetosData = backend.projetos;
  const temasSelecionados = useMemo(
    () => temasBackend.temas.filter((tema) => temasBackend.selecionadosIds.includes(tema.id)),
    [temasBackend.selecionadosIds, temasBackend.temas]
  );

  useEffect(() => {
    if (temaFiltro !== "todos" && !temasBackend.selecionadosIds.includes(temaFiltro)) {
      setTemaFiltro("todos");
    }
  }, [temaFiltro, temasBackend.selecionadosIds]);

  const equipesPorTemasSelecionados = useMemo(
    () => filterByTemasSelecionados(equipesData, temasBackend.selecionadosIds, temasBackend.temas.length),
    [equipesData, temasBackend.selecionadosIds, temasBackend.temas.length]
  );
  const projetosPorTemasSelecionados = useMemo(
    () => filterByTemasSelecionados(projetosData, temasBackend.selecionadosIds, temasBackend.temas.length),
    [projetosData, temasBackend.selecionadosIds, temasBackend.temas.length]
  );
  const equipesFiltradas = useMemo(
    () => filterByTemaAtivo(equipesPorTemasSelecionados, temaFiltro),
    [equipesPorTemasSelecionados, temaFiltro]
  );
  const projetosPorTema = useMemo(
    () => filterByTemaAtivo(projetosPorTemasSelecionados, temaFiltro),
    [projetosPorTemasSelecionados, temaFiltro]
  );
  const turmasSolicitacoes = useMemo(
    () => Array.from(new Set(projetosPorTema.map((projeto) => projeto.turma))).sort(),
    [projetosPorTema]
  );
  const projetosParaAnalise = useMemo(
    () =>
      projetosPorTema.filter((projeto) => {
        const bateTurma = turmaFiltro === "todas" || projeto.turma === turmaFiltro;
        const bateStatus =
          filtroSolicitacao === "todas" ||
          (filtroSolicitacao === "pendentes" && projeto.status === "aguardando") ||
          (filtroSolicitacao === "reprovadas" && projeto.status === "ajustes");

        return bateTurma && bateStatus;
      }),
    [filtroSolicitacao, projetosPorTema, turmaFiltro]
  );

  const riscosAltos = equipesFiltradas.filter((equipe) => equipe.risco === "alto").length;
  const solicitacoesPendentes = projetosPorTema.filter((projeto) => projeto.status === "aguardando").length;
  const solicitacoesAprovadas = projetosPorTema.filter((projeto) => projeto.status === "aprovado").length;
  const solicitacoesReprovadas = projetosPorTema.filter((projeto) => projeto.status === "ajustes").length;
  const aguardandoAprovacao = projetosParaAnalise.filter((projeto) => projeto.status === "aguardando").length;
  const eixosSelecionadosLabel =
    temasBackend.selecionadosIds.length > 0
      ? `${temasBackend.selecionadosIds.length} eixo(s) selecionado(s)`
      : "nenhum eixo selecionado";
  const avisoEixos =
    !temasBackend.carregando && temasBackend.temas.length > 0 && temasBackend.selecionadosIds.length === 0
      ? "Escolha os eixos temáticos que você orienta para visualizar e filtrar os projetos."
      : "";

  function mostrarAviso(mensagem: string) {
    setAviso(mensagem);
  }

  async function atualizarProjeto(id: string, status: StatusProjeto) {
    const projeto = projetosData.find((item) => item.id === id);

    try {
      if (!projeto) return;
      await backend.responderProjeto(projeto, status);

      mostrarAviso(status === "aprovado" ? "Projeto aprovado." : "Projeto marcado para ajustes.");
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Não foi possível atualizar o projeto.");
    }
  }

  async function salvarTemas() {
    try {
      await temasBackend.salvar(temasBackend.selecionadosIds);
      mostrarAviso("Temas do orientador salvos.");
    } catch (error) {
      mostrarAviso(error instanceof Error ? error.message : "Não foi possível salvar os temas do orientador.");
    }
  }

  async function abrirDetalheProjeto(projetoId?: number) {
    if (!projetoId) {
      setErroDetalhe("Este item não veio do backend com ID de projeto.");
      setProjetoDetalhe(null);
      return;
    }

    setCarregandoDetalhe(true);
    setErroDetalhe("");

    try {
      const detalhe = await backend.buscarProjetoDetalhe(projetoId);
      setProjetoDetalhe(detalhe);
    } catch (error) {
      setProjetoDetalhe(null);
      setErroDetalhe(error instanceof Error ? error.message : "Não foi possível carregar os detalhes do projeto.");
    } finally {
      setCarregandoDetalhe(false);
    }
  }

  function fecharDetalheProjeto() {
    setProjetoDetalhe(null);
    setErroDetalhe("");
    setCarregandoDetalhe(false);
  }

  return (
    <PageShell
      eyebrow="Orientação SECTEC"
      title="Painel do orientador"
      description="Consulte solicitações, equipes e selecione os eixos temáticos que você orienta."
      actions={
        <>
          <Button
            variant="secondary"
            onClick={() => {
              setTurmaFiltro("todas");
              setTemaFiltro("todos");
              setFiltroSolicitacao("todas");
            }}
          >
            <SlidersHorizontal size={16} />
            Limpar filtros
          </Button>
          <Button onClick={() => setFiltroSolicitacao("pendentes")}>
            <Search size={16} />
            Ver pendentes
          </Button>
        </>
      }
    >
      <Notice
        message={
          aviso ||
          avisoEixos ||
          temasBackend.erro
        }
      />

      <TemasChecklist
        temas={temasBackend.temas}
        selecionadosIds={temasBackend.selecionadosIds}
        eventoTitulo={temasBackend.eventoTitulo}
        carregando={temasBackend.carregando}
        salvando={temasBackend.salvando}
        contagemPorTema={(temaId) => countByTema(projetosData, temaId)}
        onChange={temasBackend.setSelecionadosIds}
        onSave={salvarTemas}
      />

      <FiltroTemaOrientador
        temas={temasSelecionados}
        temaAtivoId={temaFiltro}
        contagemPorTema={(temaId) => (temaId === "todos" ? projetosPorTemasSelecionados.length : countByTema(projetosPorTemasSelecionados, temaId))}
        onChange={setTemaFiltro}
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          label="Pendentes"
          value={String(solicitacoesPendentes)}
          detail="solicitações para analisar"
          icon={<Clock3 size={18} />}
          tone="yellow"
        />
        <StatCard
          label="Orientando"
          value={String(equipesFiltradas.length)}
          detail={eixosSelecionadosLabel}
          icon={<FolderOpen size={18} />}
          tone="blue"
        />
        <StatCard
          label="Atenção"
          value={String(riscosAltos + solicitacoesReprovadas)}
          detail={`${riscosAltos} equipe(s) e ${solicitacoesReprovadas} solicitação(ões)`}
          icon={<Users size={18} />}
          tone="red"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Card>
          <div className="mb-5 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Solicitações</p>
              <h2 className="mt-1 text-lg font-bold text-slate-900">Projetos para consultar</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                {aguardandoAprovacao} pendente(s), {solicitacoesAprovadas} aprovado(s)
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_minmax(0,1fr)]">
              <label className="min-w-0 space-y-2">
                <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Turma</span>
                <select
                  value={turmaFiltro}
                  onChange={(event) => setTurmaFiltro(event.target.value)}
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"
                >
                  <option value="todas">Todas</option>
                  {turmasSolicitacoes.map((turma) => (
                    <option key={turma} value={turma}>
                      {turma}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex flex-wrap items-end gap-2">
                {([
                  ["pendentes", "Pendentes"],
                  ["reprovadas", "Reprovadas"],
                  ["todas", "Todas"],
                ] as const).map(([value, label]) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setFiltroSolicitacao(value)}
                    className={cx(
                      "h-10 rounded-lg px-4 text-sm font-semibold transition",
                      filtroSolicitacao === value
                        ? "bg-sectec-700 text-white"
                        : "border border-slate-200 bg-white text-slate-600 hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            {projetosParaAnalise.length > 0 ? (
              projetosParaAnalise.map((projeto) => (
                <div key={projeto.id} className="rounded-lg border border-slate-200 p-4">
                  <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="break-words font-semibold leading-5 text-slate-900">{projeto.titulo}</p>
                        <Badge tone={projetoTone(projeto.status)}>{projetoLabel(projeto.status)}</Badge>
                      </div>
                      <p className="mt-1 break-words text-sm font-medium text-slate-500">
                        {projeto.equipe} · {projeto.turma} · enviado em {projeto.enviadoEm}
                      </p>
                    </div>
                    <div className="flex flex-col gap-2 sm:flex-row">
                      <Button variant="secondary" onClick={() => abrirDetalheProjeto(projeto.projetoId)}>
                        <Search size={15} />
                        Detalhes
                      </Button>
                      <Button variant="secondary" onClick={() => atualizarProjeto(projeto.id, "ajustes")}>
                        <Trash2 size={15} />
                        Reprovar
                      </Button>
                      <Button onClick={() => atualizarProjeto(projeto.id, "aprovado")}>
                        <Check size={15} />
                        Aprovar
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="Nenhum projeto encontrado para estes filtros." />
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 content-start gap-5">
          <ProjetoDetalheCard
            projeto={projetoDetalhe}
            carregando={carregandoDetalhe}
            erro={erroDetalhe}
            onClose={fecharDetalheProjeto}
          />

          <Card>
            <div className="mb-5 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Equipes</p>
                <h2 className="mt-1 text-lg font-bold text-slate-900">Minhas equipes</h2>
              </div>
              <Badge tone="blue">{equipesFiltradas.length}</Badge>
            </div>

            <div className="space-y-3">
              {equipesFiltradas.length > 0 ? (
                equipesFiltradas.map((equipe) => (
                  <div key={equipe.id} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-words font-bold text-slate-900">{equipe.nome}</p>
                        <p className="mt-1 break-words text-sm font-medium text-slate-500">
                          {equipe.turma} · líder: {equipe.lider}
                        </p>
                      </div>
                      <Badge tone={riscoTone(equipe.risco)}>
                        {equipe.risco === "alto" ? "atenção" : equipe.risco === "medio" ? "acompanhar" : "em dia"}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <Progress value={equipe.progresso} />
                    </div>
                    <div className="mt-4">
                      <Button variant="secondary" onClick={() => abrirDetalheProjeto(equipe.projetoId)}>
                        <Search size={15} />
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState text="Nenhuma equipe aprovada para estes temas." />
              )}
            </div>
          </Card>
        </div>
      </div>
    </PageShell>
  );
}

export function TurmasOrientador() {
  const backend = useOrientadorBackendData();
  const [eixoAtivo, setEixoAtivo] = useState<EixoTematico>("todos");
  const equipesData = backend.equipes;
  const equipesFiltradas = useMemo(() => filterByEixo(equipesData, eixoAtivo), [equipesData, eixoAtivo]);
  const turmasResumo = useMemo(() => {
    const mapa = new Map<string, { id: string; nome: string; alunos: number }>();

    equipesFiltradas.forEach((equipe) => {
      const turma = mapa.get(equipe.turma) ?? {
        id: equipe.turma.toLowerCase().replace(/\s+/g, "-"),
        nome: equipe.turma,
        alunos: 0,
      };

      turma.alunos += equipe.integrantes;
      mapa.set(equipe.turma, turma);
    });

    return Array.from(mapa.values());
  }, [equipesFiltradas]);

  return (
    <PageShell
      eyebrow="Turmas"
      title="Minhas turmas"
      description="Resumo das turmas vinculadas, quantidade de equipes, alunos envolvidos e pendências de orientação."
      actions={
        <Button onClick={() => setEixoAtivo("todos")}>
          <Plus size={16} />
          Ver todas
        </Button>
      }
    >
      <Notice
        message={
          backend.carregando
            ? "Carregando dados do backend..."
            : backend.erro || "Turmas são agrupadas pelos projetos/orientações retornados pelo backend; turno da turma ainda não tem endpoint."
        }
      />

      <FiltroEixoBox
        eixoAtivo={eixoAtivo}
        onChange={setEixoAtivo}
        contagemPorEixo={(eixo) => countByEixo(equipesData, eixo)}
        description="Filtra o mapa de orientação e recalcula os dados das turmas pelo eixo."
      />

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {turmasResumo.map((turma) => {
          const equipesDaTurma = equipesFiltradas.filter((equipe) => equipe.turma === turma.nome);
          const pendencias = equipesDaTurma.filter((equipe) => equipe.risco !== "baixo").length;
          const mediaProgresso = equipesDaTurma.length
            ? Math.round(equipesDaTurma.reduce((total, equipe) => total + equipe.progresso, 0) / equipesDaTurma.length)
            : 0;

          return (
            <Card
              key={turma.id}
              className="h-full"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="break-words text-lg font-bold text-slate-900">{turma.nome}</h2>
                  <p className="mt-1 text-sm font-semibold text-slate-400">Turno não disponível no backend</p>
                </div>
                <Badge tone={pendencias > 1 ? "yellow" : "green"}>{pendencias} pendências</Badge>
              </div>

              <div className="mt-6 grid grid-cols-3 gap-2 sm:gap-3">
                <div>
                  <p className="text-2xl font-bold text-slate-900">{turma.alunos}</p>
                  <p className="text-xs font-semibold text-slate-400">alunos</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{equipesDaTurma.length}</p>
                  <p className="text-xs font-semibold text-slate-400">equipes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900">{mediaProgresso}%</p>
                  <p className="text-xs font-semibold text-slate-400">média</p>
                </div>
              </div>

              <div className="mt-5">
                <Progress value={mediaProgresso} />
              </div>
            </Card>
          );
        })}
        {turmasResumo.length === 0 && (
          <Card className="md:col-span-2 xl:col-span-3">
            <EmptyState text="Nenhuma turma retornada pelo backend." />
          </Card>
        )}
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Mapa de orientação</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Equipes por turma</h2>
          </div>
          <Search className="text-slate-300" />
        </div>

        <div className="space-y-3">
          {equipesFiltradas.length > 0 ? (
            equipesFiltradas.map((equipe) => <EquipeRow key={equipe.id} equipe={equipe} />)
          ) : (
            <EmptyState text="Nenhuma equipe encontrada para este filtro." />
          )}
        </div>
      </Card>
    </PageShell>
  );
}

export function EntregasOrientador() {
  const backend = useOrientadorBackendData();
  const entregasBackend = useEntregasBackendData(backend.orientacoes, backend.carregando);
  const [filtro, setFiltro] = useState<"todas" | StatusEntrega>("todas");
  const [eixoAtivo, setEixoAtivo] = useState<EixoTematico>("todos");
  const [aviso, setAviso] = useState("");
  const entregasData = entregasBackend.entregas;

  const entregasPorEixo = useMemo(() => filterByEixo(entregasData, eixoAtivo), [entregasData, eixoAtivo]);
  const entregasFiltradas = useMemo(() => {
    if (filtro === "todas") return entregasPorEixo;
    return entregasPorEixo.filter((entrega) => entrega.status === filtro);
  }, [entregasPorEixo, filtro]);

  async function revisarEntrega(id: string) {
    const entrega = entregasData.find((item) => item.id === id);
    if (!entrega) return;

    try {
      await entregasBackend.revisarEntrega(entrega);
      setAviso("Entrega marcada como revisada no backend.");
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível revisar a entrega.");
    }
  }

  async function marcarLoteRevisado() {
    const entregasPendentes = entregasFiltradas.filter((entrega) => entrega.status !== "revisada");
    const total = entregasFiltradas.filter((entrega) => entrega.status !== "revisada").length;

    if (!total) {
      setAviso("Não há entregas pendentes neste filtro.");
      return;
    }

    try {
      await Promise.all(entregasPendentes.map((entrega) => entregasBackend.revisarEntrega(entrega)));
      setAviso(`${total} entrega(s) marcada(s) como revisadas no backend.`);
    } catch (error) {
      setAviso(error instanceof Error ? error.message : "Não foi possível revisar o lote completo.");
    }
  }

  return (
    <PageShell
      eyebrow="Entregas"
      title="Arquivos para revisar"
      description="Fila de relatórios, protótipos, banners e evidências enviados pelas equipes."
      actions={
        <Button variant="secondary" onClick={marcarLoteRevisado}>
          <CheckCircle2 size={16} />
          Marcar lote revisado
        </Button>
      }
    >
      <Notice
        message={
          aviso ||
          (backend.carregando || entregasBackend.carregando
            ? "Carregando entregas do backend..."
            : backend.erro || entregasBackend.erro || "Entregas são carregadas de /materiais apenas para projetos já aceitos.")
        }
      />

      <FiltroEixoBox
        eixoAtivo={eixoAtivo}
        onChange={setEixoAtivo}
        contagemPorEixo={(eixo) => countByEixo(entregasData, eixo)}
        description="Filtra a fila de entregas pelo eixo temático do projeto."
      />

      <Card>
        <div className="mb-5 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Revisão</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Fila de entregas</h2>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["todas", "pendente", "recusada", "revisada"] as const).map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setFiltro(item)}
                className={cx(
                  "rounded-md px-3 py-1.5 text-xs font-semibold transition",
                  filtro === item
                    ? "bg-sectec-700 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-sectec-50 hover:text-sectec-700"
                )}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        {entregasFiltradas.length === 0 ? (
          <EmptyState text="Nenhuma entrega encontrada neste filtro." />
        ) : (
          <>
            <div className="space-y-3 md:hidden">
              <AnimatePresence mode="popLayout">
                {entregasFiltradas.map((entrega) => (
                  <motion.div
                    key={entrega.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-start gap-2">
                          <FileText size={16} className="mt-0.5 shrink-0 text-slate-400" />
                          <p className="break-all font-semibold text-slate-900">{entrega.arquivo}</p>
                        </div>
                        <p className="mt-2 break-words text-sm font-medium text-slate-500">{entrega.equipe}</p>
                      </div>
                      <Badge tone={entregaTone(entrega.status)}>{entrega.status}</Badge>
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <DetailLine label="Aluno" value={entrega.aluno} />
                      <DetailLine label="Etapa" value={entrega.etapa} />
                      <DetailLine label="Turma" value={entrega.turma} />
                      <DetailLine label="Data" value={entrega.data} />
                    </div>

                    <Button
                      variant="secondary"
                      disabled={entrega.status === "revisada"}
                      onClick={() => revisarEntrega(entrega.id)}
                      className="mt-4"
                    >
                      <Check size={15} />
                      Revisar
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[920px] border-separate border-spacing-0 text-left">
                <thead>
                  <tr className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                    <th className="border-b border-slate-200 py-3">Arquivo</th>
                    <th className="border-b border-slate-200 py-3">Equipe</th>
                    <th className="border-b border-slate-200 py-3">Aluno</th>
                    <th className="border-b border-slate-200 py-3">Etapa</th>
                    <th className="border-b border-slate-200 py-3">Data</th>
                    <th className="border-b border-slate-200 py-3">Status</th>
                    <th className="border-b border-slate-200 py-3 text-right">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  <AnimatePresence mode="popLayout">
                    {entregasFiltradas.map((entrega) => (
                      <motion.tr
                        key={entrega.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm"
                      >
                        <td className="border-b border-slate-100 py-4 font-semibold text-slate-900">
                          <div className="flex items-center gap-2">
                            <FileText size={16} className="text-slate-400" />
                            {entrega.arquivo}
                          </div>
                        </td>
                        <td className="border-b border-slate-100 py-4 text-slate-600">{entrega.equipe}</td>
                        <td className="border-b border-slate-100 py-4 text-slate-600">{entrega.aluno}</td>
                        <td className="border-b border-slate-100 py-4 text-slate-600">{entrega.etapa}</td>
                        <td className="border-b border-slate-100 py-4 text-slate-500">{entrega.data}</td>
                        <td className="border-b border-slate-100 py-4">
                          <Badge tone={entregaTone(entrega.status)}>{entrega.status}</Badge>
                        </td>
                        <td className="border-b border-slate-100 py-4 text-right">
                          <Button
                            variant="secondary"
                            disabled={entrega.status === "revisada"}
                            onClick={() => revisarEntrega(entrega.id)}
                          >
                            <Check size={15} />
                            Revisar
                          </Button>
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          </>
        )}
      </Card>
    </PageShell>
  );
}

export function ConfigOrientador() {
  const [aviso, setAviso] = useState("");
  const nome = typeof window !== "undefined" ? localStorage.getItem("nome") ?? "Orientador" : "Orientador";
  const userId = typeof window !== "undefined" ? localStorage.getItem("userId") ?? "Não informado" : "Não informado";

  return (
    <PageShell
      eyebrow="Sistema"
      title="Configurações do orientador"
      description="Preferências de perfil, regras da feira e alertas importantes do acompanhamento."
      actions={
        <Button onClick={() => setAviso("Configurações do orientador ainda não têm endpoint no backend.")}>
          <Save size={16} />
          Salvar alterações
        </Button>
      }
    >
      <Notice message={aviso || "Não existe backend para perfil editável, regras da feira ou alertas do orientador nesta implementação."} />

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="lg:col-span-8 xl:col-span-7">
          <div className="mb-6 flex items-center gap-3">
            <Settings2 className="text-sectec-600" />
            <h2 className="text-lg font-bold text-slate-900">Perfil do orientador</h2>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">Nome</span>
              <div className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                {nome}
              </div>
            </div>
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">ID do usuário</span>
              <div className="min-h-11 rounded-lg border border-slate-200 bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-700">
                {userId}
              </div>
            </div>
            <div className="sm:col-span-2">
              <EmptyState text="Área, bio e preferências de perfil ainda não vêm do backend." />
            </div>
          </div>
        </Card>

        <Card className="lg:col-span-4 xl:col-span-5">
          <div className="mb-6 flex items-center gap-3">
            <CheckCircle2 className="text-sectec-600" />
            <h2 className="text-lg font-bold text-slate-900">Regras da feira</h2>
          </div>

          <div className="space-y-3">
            <EmptyState text="Regras da feira ainda não têm endpoint no backend." />
          </div>
        </Card>
      </div>

      <Card>
        <div className="mb-5 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">Alertas</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">Notificações importantes</h2>
          </div>
          <BarChart3 className="text-slate-300" />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <EmptyState text="Alertas/notificações ainda não têm endpoint no backend." />
          </div>
        </div>
      </Card>
    </PageShell>
  );
}

export default DashboardOrientador;
