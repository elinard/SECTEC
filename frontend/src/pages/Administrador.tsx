import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  PiArrowUpRight,
  PiBookOpen,
  PiBuildings,
  PiCalendarBlank,
  PiCheckCircle,
  PiFilePdf,
  PiFunnel,
  PiMagnifyingGlass,
  PiNotebook,
  PiPlus,
  PiTextAlignLeft,
  PiUsersThree,
  PiWarningCircle,
  PiXCircle,
  PiUploadSimple,
  PiYoutubeLogo,
} from "react-icons/pi";
import {
  AlertTriangle,
  ArrowRight,
  CalendarRange,
  ClipboardCheck,
  Eye,
  FileWarning,
  FolderKanban,
  Loader2,
  Pencil,
  RefreshCw,
  Save,
  Trash2,
  UsersRound,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { MainLayout } from "../componentes/SideBarUniversal";
import Swal from "sweetalert2";
import { apiRequest, API_BASE_URL, type UsuarioApi } from "../lib/api";

type StatusProjeto =
  | "Rascunho"
  | "Pendente de Orientação"
  | "Aceito"
  | "Em Desenvolvimento"
  | "Sob Revisão"
  | "Aprovado para Avaliação"
  | "Avaliado";
type Prioridade = "baixa" | "media" | "alta";

type AlunoRelatorio = {
  id: number;
  nome: string;
  email: string;
  ano: number;
  turma: string | null;
};

type AlunosSemProjetoResponse = Record<string, AlunoRelatorio[]>;

type ComissaoPorEventoResponse = Record<
  string,
  {
    eventoId: number;
    alunos: AlunoRelatorio[];
  }
>;

type EixosPorEventoResponse = Record<
  string,
  {
    eventoId: number;
    eixos: {
      temaId: number;
      temaNome: string;
      totalProjetos: number;
      projetosPendentes: number;
      projetosAceitos: number;
    }[];
  }
>;

type ProjetosPorOrientadorResponse = {
  orientadorId: number;
  orientadorNome: string;
  email: string;
  totalProjetosAceitos: number;
  projetos: string[];
}[];

type ProjetosPorTurmaResponse = Record<
  string,
  {
    turma: string;
    ano: number;
    totalCriados: number;
    totalAprovados: number;
  }
>;

type ProjetoAdmin = {
  id: number;
  titulo: string;
  eixo: string;
  autor: string;
  turma: string;
  orientador: string;
  status: StatusProjeto;
  prioridade: Prioridade;
  atualizadoEm: string;
  materiais: {
    pdf: boolean;
    youtube: boolean;
    resumo: boolean;
  };
};

type TurmaAdmin = {
  id: number;
  nome: string;
  curso: string;
  serie: "1º ano" | "2º ano" | "3º ano";
  turno: "Manhã" | "Tarde" | "Noite";
  alunos: number;
  projetos: number;
  orientadoresVinculados: number;
  status: "Ativa" | "Fechada";
};

type TemaEventoApi = {
  id: number;
  nome: string;
};

type PeriodoEventoApi = {
  inicio?: string | null;
  fim?: string | null;
};

type CreateEventoPayload = {
  titulo: string;
  descricao?: string;
  prazoInicial: string;
  prazoFinal: string;
  inscricao?: PeriodoEventoApi;
  aceitacao?: PeriodoEventoApi;
  submissao?: PeriodoEventoApi;
  avaliacao?: PeriodoEventoApi;
};

type EventoApi = {
  id: number;
  titulo: string;
  descricao?: string | null;
  prazoInicial: string;
  prazoFinal: string;
  inscricao?: PeriodoEventoApi | null;
  aceitacao?: PeriodoEventoApi | null;
  submissao?: PeriodoEventoApi | null;
  avaliacao?: PeriodoEventoApi | null;
  temas?: TemaEventoApi[];
};

type ProjetoCoordenacaoApi = {
  id: number;
  titulo: string;
  descricao?: string;
  status?: string | null;
  situacao?: string | null;
  criadoEm?: string;
  evento?: {
    id: number;
    titulo: string;
  };
  alunoAutor?: {
    id: number;
    nome: string;
    email_institucional?: string | null;
    turma?: string | null;
    ano?: number | null;
  };
  tema?: {
    id: number;
    nome: string;
  } | null;
  temaId?: number | null;
  projetoAlunos?: Array<{
    aluno?: {
      id: number;
      nome: string;
      email_institucional?: string | null;
      turma?: string | null;
      ano?: number | null;
    } | null;
  }>;
  orientadores?: Array<{
    id: number;
    status?: string | null;
    criadoEm?: string | null;
    respondidoEm?: string | null;
    orientador?: {
      id: number;
      nome: string;
      email_institucional?: string | null;
    } | null;
  }>;
};

type EventoComProjetosApi = {
  id: number;
  titulo: string;
  prazoInicial?: string | null;
  projetos?: ProjetoCoordenacaoApi[];
};

type ProjetoCoordenacaoListagem = ProjetoCoordenacaoApi & {
  eventoTitulo?: string;
  eventoId?: number;
};

const projetosMock: ProjetoAdmin[] = [
  {
    id: 1,
    titulo: "Monitoramento Ambiental com IoT",
    eixo: "Tecnologia e Sustentabilidade",
    autor: "João Felipe",
    turma: "3º Informática",
    orientador: "Prof. Marcos Lima",
    status: "Sob Revisão",
    prioridade: "alta",
    atualizadoEm: "Hoje, 09:40",
    materiais: { pdf: true, youtube: true, resumo: true },
  },
  {
    id: 2,
    titulo: "Biblioteca Digital Escolar",
    eixo: "Gestão e Cultura Digital",
    autor: "Ana Beatriz",
    turma: "2º Informática",
    orientador: "Prof. Carla Nunes",
    status: "Em Desenvolvimento",
    prioridade: "media",
    atualizadoEm: "Ontem, 16:12",
    materiais: { pdf: true, youtube: false, resumo: true },
  },
  {
    id: 3,
    titulo: "Filtro Inteligente de Água",
    eixo: "Ciências Aplicadas",
    autor: "Lucas Pereira",
    turma: "3º Enfermagem",
    orientador: "Sem orientador",
    status: "Pendente de Orientação",
    prioridade: "alta",
    atualizadoEm: "Segunda, 11:03",
    materiais: { pdf: false, youtube: false, resumo: true },
  },
  {
    id: 4,
    titulo: "Sistema de Registro de Frequência",
    eixo: "Automação Escolar",
    autor: "Maria Eduarda",
    turma: "1º Informática",
    orientador: "Prof. Renato Alves",
    status: "Aprovado para Avaliação",
    prioridade: "baixa",
    atualizadoEm: "08/05/2026",
    materiais: { pdf: true, youtube: true, resumo: true },
  },
];

const turmasMock: TurmaAdmin[] = [
  {
    id: 1,
    nome: "3º Info",
    curso: "Técnico em Informática",
    serie: "3º ano",
    turno: "Manhã",
    alunos: 34,
    projetos: 12,
    orientadoresVinculados: 4,
    status: "Ativa",
  },
  {
    id: 2,
    nome: "2º Info",
    curso: "Técnico em Informática",
    serie: "2º ano",
    turno: "Tarde",
    alunos: 29,
    projetos: 8,
    orientadoresVinculados: 3,
    status: "Ativa",
  },
  {
    id: 3,
    nome: "3º Enfermagem",
    curso: "Técnico em Enfermagem",
    serie: "3º ano",
    turno: "Manhã",
    alunos: 31,
    projetos: 9,
    orientadoresVinculados: 2,
    status: "Ativa",
  },
];

const statusStyle: Record<StatusProjeto, string> = {
  Rascunho: "bg-slate-100 text-slate-600 ring-slate-200",
  "Pendente de Orientação": "bg-amber-50 text-amber-700 ring-amber-200",
  Aceito: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  "Em Desenvolvimento": "bg-sky-50 text-sky-700 ring-sky-200",
  "Sob Revisão": "bg-indigo-50 text-indigo-700 ring-indigo-200",
  "Aprovado para Avaliação": "bg-sectec-50 text-sectec-700 ring-sectec-200",
  Avaliado: "bg-slate-900 text-white ring-slate-900",
};

const prioridadeStyle: Record<Prioridade, string> = {
  baixa: "border-slate-200 text-slate-500",
  media: "border-amber-200 text-amber-700",
  alta: "border-red-200 text-red-700",
};

function handleAcaoIndisponivel(acao: string) {
  window.alert(`${acao} depende dos endpoints do backend. A interface já está pronta para ligar na API.`);
}

function PanelTitle({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-sectec-100 bg-sectec-50 text-sectec-700">
        {icon}
      </span>
      <div>
        <h2 className="text-base font-black text-slate-900">{title}</h2>
        {subtitle && <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function AdminChip({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-black uppercase ring-1 ${className}`}>
      {children}
    </span>
  );
}

function PainelDetalhes({ aberto, titulo, onClose, children }: { aberto: boolean; titulo: string; onClose: () => void; children: React.ReactNode }) {
  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-sm">
      <div className="h-full w-full max-w-xl overflow-y-auto bg-white p-6 shadow-2xl">
        <div className="mb-6 flex items-center justify-between gap-4">
          <h2 className="text-xl font-black text-slate-950">{titulo}</h2>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 cursor-pointer items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:bg-slate-50 hover:text-slate-900"
            aria-label="Fechar painel de detalhes"
          >
            ×
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}

function AdminPageShell({ children }: { children: React.ReactNode }) {
  return (
    <MainLayout userRole="coordenador">
      <main className="min-h-screen bg-[#f4f9f6] px-4 py-5 sm:px-7 sm:py-7">
        <div className="mx-auto w-full max-w-[1500px] space-y-5">{children}</div>
      </main>
    </MainLayout>
  );
}

function TurmasCoordenacao() {
  return (
    <AdminPageShell>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <PanelTitle icon={<PiBuildings size={20} />} title="Todas as turmas" subtitle="Distribuição por curso, série, turno, projetos e orientadores vinculados." />
          <button type="button" onClick={() => handleAcaoIndisponivel("Criar turma")} className="inline-flex h-10 items-center justify-center gap-2 rounded-xl bg-sectec-700 px-4 text-sm font-black text-white transition hover:bg-sectec-800">
            <PiPlus size={17} /> Nova turma
          </button>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1fr_0.8fr_0.6fr_0.6fr_0.6fr_44px] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 lg:grid">
            <span>Turma</span><span>Curso</span><span>Turno</span><span>Alunos</span><span>Projetos</span><span />
          </div>
          <div className="divide-y divide-slate-100">
            {turmasMock.map((turma) => (
              <article key={turma.id} className="grid gap-3 px-4 py-4 lg:grid-cols-[1fr_0.8fr_0.6fr_0.6fr_0.6fr_44px] lg:items-center">
                <div>
                  <h3 className="font-black text-slate-900">{turma.nome}</h3>
                  <p className="text-xs font-semibold text-slate-400">{turma.serie} · {turma.status}</p>
                </div>
                <p className="text-sm font-semibold text-slate-600">{turma.curso}</p>
                <p className="text-sm font-black text-slate-700">{turma.turno}</p>
                <p className="text-sm font-black text-slate-700">{turma.alunos}</p>
                <p className="text-sm font-black text-sectec-700">{turma.projetos}</p>
                <button type="button" onClick={() => handleAcaoIndisponivel(`Gerenciar ${turma.nome}`)} className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-500 transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700" aria-label={`Gerenciar ${turma.nome}`}>
                  <PiArrowUpRight size={18} />
                </button>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}

function FrequenciaCoordenacao() {
  return (
    <AdminPageShell>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <PanelTitle icon={<PiBookOpen size={20} />} title="Frequência" subtitle="Acompanhamento operacional por turma e participação nos encontros de orientação." />
        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          {turmasMock.map((turma) => {
            const percentual = Math.min(98, Math.round((turma.projetos / Math.max(turma.alunos, 1)) * 260));
            return (
              <article key={turma.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-black text-slate-900">{turma.nome}</h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">{turma.curso} · {turma.turno}</p>
                  </div>
                  <AdminChip className="bg-sectec-50 text-sectec-700 ring-sectec-200">{percentual}%</AdminChip>
                </div>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-sectec-600" style={{ width: `${percentual}%` }} />
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <span className="rounded-xl bg-white px-2 py-2 text-xs font-black text-slate-700">{turma.alunos} alunos</span>
                  <span className="rounded-xl bg-white px-2 py-2 text-xs font-black text-slate-700">{turma.projetos} projetos</span>
                  <span className="rounded-xl bg-white px-2 py-2 text-xs font-black text-slate-700">{turma.orientadoresVinculados} orient.</span>
                </div>
              </article>
            );
          })}
        </div>
      </section>
    </AdminPageShell>
  );
}

function NotasCoordenacao() {
  return (
    <AdminPageShell>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <PanelTitle icon={<PiNotebook size={20} />} title="Notas" subtitle="Visão da coordenação sobre situação de avaliação, materiais enviados e prioridades." />
        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1.2fr_0.75fr_0.7fr_0.5fr] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 lg:grid">
            <span>Projeto</span><span>Status</span><span>Materiais</span><span>Prioridade</span>
          </div>
          <div className="divide-y divide-slate-100">
            {projetosMock.map((projeto) => (
              <article key={projeto.id} className="grid gap-4 px-4 py-4 lg:grid-cols-[1.2fr_0.75fr_0.7fr_0.5fr] lg:items-center">
                <div>
                  <h3 className="font-black text-slate-900">{projeto.titulo}</h3>
                  <p className="mt-1 text-sm font-semibold text-slate-500">{projeto.autor} · {projeto.turma}</p>
                  <p className="mt-1 text-xs text-slate-400">{projeto.orientador} · {projeto.atualizadoEm}</p>
                </div>
                <AdminChip className={statusStyle[projeto.status]}>{projeto.status}</AdminChip>
                <div className="flex gap-2 text-xl">
                  <span className={projeto.materiais.pdf ? "text-emerald-600" : "text-slate-300"} title="PDF"><PiFilePdf /></span>
                  <span className={projeto.materiais.youtube ? "text-emerald-600" : "text-slate-300"} title="Vídeo"><PiYoutubeLogo /></span>
                  <span className={projeto.materiais.resumo ? "text-emerald-600" : "text-slate-300"} title="Resumo"><PiTextAlignLeft /></span>
                </div>
                <AdminChip className={prioridadeStyle[projeto.prioridade]}>{projeto.prioridade}</AdminChip>
              </article>
            ))}
          </div>
        </div>
      </section>
    </AdminPageShell>
  );
}


function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function temasVisiveis(temas?: TemaEventoApi[]) {
  return (temas ?? []).slice(0, 3);
}

function temasRestantes(temas?: TemaEventoApi[]) {
  return Math.max(0, (temas?.length ?? 0) - 3);
}

function getFasesEvento(evento: EventoApi) {
  return [
    { label: "Inscrição", periodo: evento.inscricao },
    { label: "Aceitação", periodo: evento.aceitacao },
    { label: "Submissão", periodo: evento.submissao },
    { label: "Avaliação", periodo: evento.avaliacao },
  ];
}

function toIsoDate(value: string) {
  if (!value) return undefined;

  return new Date(`${value}T00:00:00`).toISOString();
}

function toDateInput(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toISOString().slice(0, 10);
}

function periodoValido(inicio: string, fim: string) {
  if (!inicio && !fim) return true;
  if (!inicio || !fim) return false;
  return new Date(fim) > new Date(inicio);
}

function formatarPeriodo(periodo?: PeriodoEventoApi | null) {
  if (!periodo?.inicio || !periodo?.fim) return "Não definido";

  const inicio = new Date(periodo.inicio);
  const fim = new Date(periodo.fim);
  if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) return "Não definido";

  return `${inicio.toLocaleDateString("pt-BR")} - ${fim.toLocaleDateString("pt-BR")}`;
}

function formatarData(value: string) {
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) return "-";

  return data.toLocaleDateString("pt-BR");
}

function extrairProjetosDaResposta(data: unknown): any[] {
  if (!Array.isArray(data)) return [];

  return data.flatMap((item: any) => {
    if (Array.isArray(item.projetos)) {
      return item.projetos.map((projeto: any) => ({
        ...projeto,
        eventoTitulo: projeto.evento?.titulo ?? item.titulo,
        eventoId: projeto.evento?.id ?? item.id,
      }));
    }

    return [item];
  });
}

function getFaseAtual(evento: EventoApi | null) {
  if (!evento) return "Nenhum evento vigente";

  const hoje = new Date();

  const fases = [
    { label: "Inscrição", periodo: evento.inscricao },
    { label: "Aceitação", periodo: evento.aceitacao },
    { label: "Submissão", periodo: evento.submissao },
    { label: "Avaliação", periodo: evento.avaliacao },
  ];

  const fase = fases.find(({ periodo }) => {
    if (!periodo?.inicio || !periodo?.fim) return false;

    const inicio = new Date(periodo.inicio);
    const fim = new Date(periodo.fim);

    return hoje >= inicio && hoje <= fim;
  });

  return fase?.label ?? "Fora do período configurado";
}

function buscarEventoDoAnoAtual(eventos: EventoApi[]) {
  const anoAtual = new Date().getFullYear();

  return eventos.find((evento) => {
    const data = new Date(evento.prazoInicial);
    return !Number.isNaN(data.getTime()) && data.getFullYear() === anoAtual;
  }) ?? null;
}

function mensagemErroApi(error: unknown, fallback = "Não foi possível carregar os dados.") {
  const tecnico = error instanceof Error ? error.message : "Erro desconhecido.";

  return {
    amigavel: fallback,
    tecnico,
  };
}

function getAutorProjeto(projeto: ProjetoCoordenacaoListagem) {
  return projeto.alunoAutor ?? projeto.projetoAlunos?.[0]?.aluno ?? null;
}

function getIntegrantesProjeto(projeto: ProjetoCoordenacaoListagem) {
  const autorId = projeto.alunoAutor?.id ? String(projeto.alunoAutor.id) : null;

  return (projeto.projetoAlunos ?? [])
    .map((vinculo) => vinculo.aluno)
    .filter(Boolean)
    .filter((aluno) => !autorId || String(aluno!.id) !== autorId);
}

function getOrientadoresProjeto(projeto: ProjetoCoordenacaoListagem) {
  return projeto.orientadores ?? [];
}

function getStatusOrientacaoProjeto(projeto: ProjetoCoordenacaoListagem) {
  const orientadores = getOrientadoresProjeto(projeto);
  if (orientadores.some((item) => item.status === "aceito")) return "aceito";
  if (orientadores.some((item) => item.status === "pendente")) return "pendente";
  if (orientadores.some((item) => item.status === "recusado")) return "recusado";
  return "sem-orientador";
}

function getDataCriacaoProjeto(projeto: ProjetoCoordenacaoListagem) {
  return projeto.criadoEm ? formatarData(projeto.criadoEm) : "-";
}

function getEventoProjetoId(projeto: ProjetoCoordenacaoListagem) {
  return projeto.eventoId ?? projeto.evento?.id ?? null;
}

function getTemaProjetoId(projeto: ProjetoCoordenacaoListagem) {
  return projeto.temaId ?? projeto.tema?.id ?? null;
}

function getProjetoDescricaoCurta(projeto: ProjetoCoordenacaoListagem) {
  if (!projeto.descricao) return "Sem descrição informada.";
  return projeto.descricao.length > 150 ? `${projeto.descricao.slice(0, 150)}...` : projeto.descricao;
}

function EventosCoordenacao() {
  const [eventos, setEventos] = useState<EventoApi[]>([]);
  const [eventoAtual, setEventoAtual] = useState<EventoApi | null>(null);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [temaInputs, setTemaInputs] = useState<Record<number, string>>({});
  const [eventoSelecionado, setEventoSelecionado] = useState<EventoApi | null>(null);
  const [detalhesEventoAberto, setDetalhesEventoAberto] = useState(false);
  const [projetosEventoSelecionado, setProjetosEventoSelecionado] = useState<ProjetoCoordenacaoListagem[]>([]);
  const [salvandoEvento, setSalvandoEvento] = useState(false);
  const [erroTecnico, setErroTecnico] = useState("");
  
  const formularioEventoRef = useRef<HTMLDivElement | null>(null);
  const [step, setStep] = useState(1);
  const [isEditing, setIsEditing] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    titulo: "",
    descricao: "",
    prazoInicial: "",
    prazoFinal: "",
    inscricaoInicio: "",
    inscricaoFim: "",
    aceitacaoInicio: "",
    aceitacaoFim: "",
    submissaoInicio: "",
    submissaoFim: "",
    avaliacaoInicio: "",
    avaliacaoFim: "",
  });

  async function carregarEventos() {
    setCarregando(true);
    setErro("");
    setErroTecnico("");
    try {
      const dados = await apiRequest<EventoApi[]>("/evento");
      setEventos(dados);

      let vigente: EventoApi | null = null;
      try {
        vigente = await apiRequest<EventoApi>("/evento/atual/vigente");
      } catch {
        vigente = null;
      }

      if (!vigente?.id) {
        vigente = null;
      }

      if (!vigente) {
        const anoAtualBusca = new Date().getFullYear();
        vigente = dados.find((evento) => new Date(evento.prazoInicial).getFullYear() === anoAtualBusca) ?? null;
      }

      setEventoAtual(vigente);
    } catch (error) {
      const erro = mensagemErroApi(error, "Não foi possível carregar os dados.");
      setErro(`${erro.amigavel} Tente novamente em alguns instantes.`);
      setErroTecnico(erro.tecnico);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    let ativo = true;
    async function carregar() {
      if (!ativo) return;
      await carregarEventos();
    }
    carregar();
    return () => { ativo = false; };
  }, []);

  function atualizarForm(campo: keyof typeof formData, valor: string) {
    setFormData((prev) => ({ ...prev, [campo]: valor }));
  }

  function montarPeriodo(inicio: string, fim: string): PeriodoEventoApi | undefined {
    if (!inicio && !fim) return undefined;

    return {
      inicio: toIsoDate(inicio),
      fim: toIsoDate(fim),
    };
  }

  function formatarData(iso: string) {
    const data = new Date(iso);
    if (Number.isNaN(data.getTime())) return "-";

    return data.toLocaleDateString("pt-BR");
  }

  function handleEdit(evento: EventoApi) {
    setIsEditing(evento.id);
    setFormData({
      titulo: evento.titulo || "",
      descricao: evento.descricao || "",
      prazoInicial: toDateInput(evento.prazoInicial),
      prazoFinal: toDateInput(evento.prazoFinal),
      inscricaoInicio: toDateInput(evento.inscricao?.inicio),
      inscricaoFim: toDateInput(evento.inscricao?.fim),
      aceitacaoInicio: toDateInput(evento.aceitacao?.inicio),
      aceitacaoFim: toDateInput(evento.aceitacao?.fim),
      submissaoInicio: toDateInput(evento.submissao?.inicio),
      submissaoFim: toDateInput(evento.submissao?.fim),
      avaliacaoInicio: toDateInput(evento.avaliacao?.inicio),
      avaliacaoFim: toDateInput(evento.avaliacao?.fim),
    });
    setStep(1);

    setTimeout(() => {
      formularioEventoRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function abrirDetalhesEvento(evento: EventoApi) {
    setEventoSelecionado(evento);
    setDetalhesEventoAberto(true);

    try {
      const dados = await apiRequest<EventoComProjetosApi[]>("/projetos");
      const projetos = (dados ?? []).flatMap((item) =>
        (item.projetos ?? []).map((projeto) => ({
          ...projeto,
          eventoTitulo: projeto.evento?.titulo ?? item.titulo,
          eventoId: projeto.evento?.id ?? item.id,
        })),
      );

      setProjetosEventoSelecionado(projetos.filter((projeto) => projeto.eventoId === evento.id));
    } catch {
      setProjetosEventoSelecionado([]);
    }
  }

  function fecharDetalhesEvento() {
    setDetalhesEventoAberto(false);
    setEventoSelecionado(null);
    setProjetosEventoSelecionado([]);
  }

  
  function handleVerDetalhesTema(evento: EventoApi, tema?: TemaEventoApi) {
    const temas = evento.temas ?? [];

    Swal.fire({
      title: tema ? escapeHtml(tema.nome) : "Temas do evento",
      html: `
        <div style="text-align:left">
          <p><strong>Evento:</strong> ${escapeHtml(evento.titulo)}</p>
          <p><strong>Ano:</strong> ${new Date(evento.prazoInicial).getFullYear()}</p>
          <p><strong>Início:</strong> ${formatarData(evento.prazoInicial)}</p>
          <p><strong>Fim:</strong> ${formatarData(evento.prazoFinal)}</p>
          <p><strong>Total de temas:</strong> ${temas.length}</p>
          <hr style="margin:12px 0" />
          <p><strong>Temas:</strong></p>
          <ul style="padding-left:18px">
            ${
              temas.length
                ? temas.map((item) => `<li>${escapeHtml(item.nome)}</li>`).join("")
                : "<li>Nenhum tema cadastrado</li>"
            }
          </ul>
        </div>
      `,
      confirmButtonColor: "#15803d",
    });
  }

  function handleCancelEdit() {
    setIsEditing(null);
    setFormData({
      titulo: "",
      descricao: "",
      prazoInicial: "",
      prazoFinal: "",
      inscricaoInicio: "",
      inscricaoFim: "",
      aceitacaoInicio: "",
      aceitacaoFim: "",
      submissaoInicio: "",
      submissaoFim: "",
      avaliacaoInicio: "",
      avaliacaoFim: "",
    });
    setStep(1);
  }

  const dataInicialDate = new Date(formData.prazoInicial);
  const anoSelecionado = !Number.isNaN(dataInicialDate.getTime()) ? dataInicialDate.getFullYear() : null;
  const temConflitoAno = anoSelecionado
    ? eventos.some((e) => {
        if (isEditing === e.id) return false;
        return new Date(e.prazoInicial).getFullYear() === anoSelecionado;
      })
    : false;

  function nextStep() {
    if (step === 1) {
      if (!formData.titulo.trim()) {
        Swal.fire({ icon: "warning", title: "O título é obrigatório", confirmButtonColor: "#15803d" });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!formData.prazoInicial || !formData.prazoFinal) {
        Swal.fire({ icon: "warning", title: "Preencha os prazos", confirmButtonColor: "#15803d" });
        return;
      }
      if (!periodoValido(formData.prazoInicial, formData.prazoFinal)) {
        Swal.fire({ icon: "warning", title: "Prazo invalido", text: "O prazo final deve ser maior que o inicial.", confirmButtonColor: "#15803d" });
        return;
      }
      if (temConflitoAno) {
        Swal.fire({
          icon: "warning",
          title: "Evento ja cadastrado",
          text: `Ja existe um evento cadastrado para ${anoSelecionado}.`,
          confirmButtonColor: "#15803d",
        });
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const fases = [
        { label: "Inscrição", inicio: formData.inscricaoInicio, fim: formData.inscricaoFim },
        { label: "Aceitação", inicio: formData.aceitacaoInicio, fim: formData.aceitacaoFim },
        { label: "Submissão", inicio: formData.submissaoInicio, fim: formData.submissaoFim },
        { label: "Avaliação", inicio: formData.avaliacaoInicio, fim: formData.avaliacaoFim },
      ];

      for (const fase of fases) {
        if (!periodoValido(fase.inicio, fase.fim)) {
          Swal.fire({
            icon: "warning",
            title: `Período inválido em ${fase.label}`,
            text: "Preencha início e fim, e mantenha o fim maior que o início.",
            confirmButtonColor: "#15803d",
          });
          return;
        }
      }

      setStep(4);
    }
  }

  function prevStep() {
    setStep((s) => Math.max(1, s - 1));
  }

  async function handleGravarEvento() {
    if (!formData.titulo.trim()) {
      await Swal.fire({ icon: "warning", title: "O título é obrigatório", confirmButtonColor: "#15803d" });
      return;
    }
    if (!formData.prazoInicial || !formData.prazoFinal) {
      await Swal.fire({ icon: "warning", title: "Preencha o período geral", confirmButtonColor: "#15803d" });
      return;
    }
    if (!periodoValido(formData.prazoInicial, formData.prazoFinal)) {
      await Swal.fire({ icon: "warning", title: "Prazo inválido", text: "O prazo final deve ser maior que o inicial.", confirmButtonColor: "#15803d" });
      return;
    }

    if (temConflitoAno) {
      await Swal.fire({
        icon: "warning",
        title: "Evento ja cadastrado",
        text: `Ja existe um evento cadastrado para ${anoSelecionado}.`,
        confirmButtonColor: "#15803d",
      });
      return;
    }

    const fases = [
      { label: "Inscrição", inicio: formData.inscricaoInicio, fim: formData.inscricaoFim },
      { label: "Aceitação", inicio: formData.aceitacaoInicio, fim: formData.aceitacaoFim },
      { label: "Submissão", inicio: formData.submissaoInicio, fim: formData.submissaoFim },
      { label: "Avaliação", inicio: formData.avaliacaoInicio, fim: formData.avaliacaoFim },
    ];

    for (const fase of fases) {
      if (!periodoValido(fase.inicio, fase.fim)) {
        await Swal.fire({
          icon: "warning",
          title: `Período inválido em ${fase.label}`,
          text: "Preencha início e fim, e mantenha o fim maior que o início.",
          confirmButtonColor: "#15803d",
        });
        return;
      }
    }

    try {
      setSalvandoEvento(true);
      const payload: CreateEventoPayload = {
        titulo: formData.titulo.trim(),
        descricao: formData.descricao.trim() || undefined,
        prazoInicial: toIsoDate(formData.prazoInicial)!,
        prazoFinal: toIsoDate(formData.prazoFinal)!,
        inscricao: montarPeriodo(formData.inscricaoInicio, formData.inscricaoFim),
        aceitacao: montarPeriodo(formData.aceitacaoInicio, formData.aceitacaoFim),
        submissao: montarPeriodo(formData.submissaoInicio, formData.submissaoFim),
        avaliacao: montarPeriodo(formData.avaliacaoInicio, formData.avaliacaoFim),
      };

      if (isEditing) {
        await apiRequest(`/evento/${isEditing}`, { method: "PATCH", body: payload });
      } else {
        await apiRequest<EventoApi>("/evento", { method: "POST", body: payload });
      }

      Swal.fire({
        icon: "success",
        title: isEditing ? "Evento atualizado!" : "Evento criado!",
        showConfirmButton: false,
        timer: 1300,
        timerProgressBar: true,
      });
      handleCancelEdit();
      await carregarEventos();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro ao salvar evento",
        text: error instanceof Error ? error.message : "Tente novamente.",
        confirmButtonColor: "#15803d",
      });
    } finally {
      setSalvandoEvento(false);
    }
  }

  async function handleAdicionarTema(eventoId: number) {
    const nome = (temaInputs[eventoId] || "").trim();
    if (!nome) {
      Swal.fire({ icon: "warning", title: "Informe o nome do tema", confirmButtonColor: "#15803d" });
      return;
    }
    try {
      await apiRequest(`/evento/${eventoId}/temas`, { method: "POST", body: { nomes: [nome] } });
      Swal.fire({ icon: "success", title: "Tema adicionado!", showConfirmButton: false, timer: 1200, timerProgressBar: true });
      setTemaInputs((prev) => ({ ...prev, [eventoId]: "" }));
      await carregarEventos();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Erro ao adicionar tema", text: error instanceof Error ? error.message : "Tente novamente.", confirmButtonColor: "#15803d" });
    }
  }

  async function handleExcluirEvento(eventoId: number) {
    const result = await Swal.fire({
      icon: "warning", title: "Excluir evento?", text: "Essa acao nao pode ser desfeita.",
      showCancelButton: true, confirmButtonColor: "#15803d", cancelButtonColor: "#e2e8f0",
      confirmButtonText: "Excluir", cancelButtonText: "Cancelar",
    });
    if (!result.isConfirmed) return;

    try {
      await apiRequest(`/evento/${eventoId}`, { method: "DELETE" });
      Swal.fire({ icon: "success", title: "Evento removido", showConfirmButton: false, timer: 1200, timerProgressBar: true });
      await carregarEventos();
    } catch (error) {
      Swal.fire({ icon: "error", title: "Erro ao excluir", text: error instanceof Error ? error.message : "Tente novamente.", confirmButtonColor: "#15803d" });
    }
  }

  const anoAtual = new Date().getFullYear();
  const eventoVigente = eventoAtual?.id
    ? eventoAtual
    : eventos.find((e) => new Date(e.prazoInicial).getFullYear() === anoAtual) ?? null;

  const etapas = [
    { id: 1, label: "Básico" },
    { id: 2, label: "Período geral" },
    { id: 3, label: "Fases da SECTEC" },
    { id: 4, label: "Revisão" },
  ];
  const progresso = ((step - 1) / (etapas.length - 1)) * 100;
  const fasesFormulario = [
    { label: "Inscrição", inicio: "inscricaoInicio", fim: "inscricaoFim" },
    { label: "Aceitação", inicio: "aceitacaoInicio", fim: "aceitacaoFim" },
    { label: "Submissão", inicio: "submissaoInicio", fim: "submissaoFim" },
    { label: "Avaliação", inicio: "avaliacaoInicio", fim: "avaliacaoFim" },
  ] as const;

  return (
    <AdminPageShell>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <section className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
          
          <div ref={formularioEventoRef} className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm flex flex-col">
            <PanelTitle icon={<PiCalendarBlank size={20} />} title="Novo Evento / Etapas" subtitle={isEditing ? "Editando evento existente" : "Fluxo para criar o evento anual."} />
            
            <div ref={formularioEventoRef} className="mt-6 flex-1 flex flex-col justify-between">
              <div>
                <div className="relative mb-8 pt-4">
                  <div className="absolute top-8 left-0 h-1 w-full bg-slate-100 rounded-full"></div>
                  <div className="absolute top-8 left-0 h-1 bg-sectec-500 rounded-full transition-all duration-500 ease-out" style={{ width: `${progresso}%` }}></div>
                  
                  <div className="relative flex justify-between">
                    {etapas.map((etapa) => {
                      const ativa = step === etapa.id;
                      const concluida = step > etapa.id;
                      return (
                        <div key={etapa.id} className="flex flex-col items-center gap-2">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${
                            ativa ? "scale-110 border-sectec-600 bg-sectec-600 text-white shadow-lg shadow-sectec-200"
                            : concluida ? "border-sectec-600 bg-sectec-600 text-white" : "border border-slate-300 bg-white text-slate-400"
                          }`}>
                            {concluida ? <PiCheckCircle size={16} /> : etapa.id}
                          </span>
                          <span className={`text-[10px] uppercase font-black transition-colors ${ativa || concluida ? "text-sectec-700" : "text-slate-400"}`}>
                            {etapa.label}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <div className="relative min-h-[160px]">
                  {step === 1 && (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <label className="text-xs font-black text-slate-500">
                        Título
                        <input value={formData.titulo} onChange={(e) => atualizarForm("titulo", e.target.value)} placeholder="Ex: SECTEC 2026" className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100" />
                      </label>
                      <label className="text-xs font-black text-slate-500">
                        Descrição (opcional)
                        <textarea value={formData.descricao} onChange={(e) => atualizarForm("descricao", e.target.value)} placeholder="Detalhes ou tema geral do evento" className="mt-2 h-24 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100" />
                      </label>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <label className="text-xs font-black text-slate-500">
                          Prazo inicial
                            <input type="date" value={formData.prazoInicial} onChange={(e) => atualizarForm("prazoInicial", e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100" />
                        </label>
                        <label className="text-xs font-black text-slate-500">
                          Prazo final
                            <input type="date" value={formData.prazoFinal} onChange={(e) => atualizarForm("prazoFinal", e.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100" />
                        </label>
                      </div>
                      {temConflitoAno && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700 flex items-start gap-3">
                          <PiWarningCircle className="mt-0.5 shrink-0" size={18} /> 
                          <div>Já existe um evento cadastrado para {anoSelecionado}. Edite o existente ou escolha outro ano.</div>
                        </div>
                      )}
                    </div>
                  )}

                  {step === 3 && (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-right-4 duration-300">
                      {fasesFormulario.map((fase) => (
                        <div key={fase.label} className="rounded-2xl border border-slate-200 bg-white p-4">
                          <p className="text-xs font-black uppercase tracking-wider text-slate-500">{fase.label}</p>
                          <div className="mt-3 grid gap-4 sm:grid-cols-2">
                            <label className="text-xs font-black text-slate-500">
                              Início
                              <input
                                type="date"
                                value={formData[fase.inicio]}
                                onChange={(e) => atualizarForm(fase.inicio, e.target.value)}
                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100"
                              />
                            </label>
                            <label className="text-xs font-black text-slate-500">
                              Fim
                              <input
                                type="date"
                                value={formData[fase.fim]}
                                onChange={(e) => atualizarForm(fase.fim, e.target.value)}
                                className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100"
                              />
                            </label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {step === 4 && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-300 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm font-semibold text-slate-600">
                      <p className="mb-3 uppercase text-[10px] font-black text-slate-400">Revisão dos dados</p>
                      <ul className="space-y-2">
                        <li><strong className="text-slate-900">Título:</strong> {formData.titulo}</li>
                        <li><strong className="text-slate-900">Descrição:</strong> {formData.descricao || "Nenhum"}</li>
                        <li><strong className="text-slate-900">Período geral:</strong> {formatarPeriodo(montarPeriodo(formData.prazoInicial, formData.prazoFinal))}</li>
                        <li><strong className="text-slate-900">Inscrição:</strong> {formatarPeriodo(montarPeriodo(formData.inscricaoInicio, formData.inscricaoFim))}</li>
                        <li><strong className="text-slate-900">Aceitação:</strong> {formatarPeriodo(montarPeriodo(formData.aceitacaoInicio, formData.aceitacaoFim))}</li>
                        <li><strong className="text-slate-900">Submissão:</strong> {formatarPeriodo(montarPeriodo(formData.submissaoInicio, formData.submissaoFim))}</li>
                        <li><strong className="text-slate-900">Avaliação:</strong> {formatarPeriodo(montarPeriodo(formData.avaliacaoInicio, formData.avaliacaoFim))}</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5">
                <div className="flex gap-2">
                   {isEditing ? (
                    <button type="button" onClick={handleCancelEdit} className="cursor-pointer h-11 px-4 text-sm font-bold text-slate-400 transition hover:text-slate-600">Cancelar edição</button>
                   ) : <span />}
                </div>
                
                <div className="flex gap-2">
                  {step > 1 && (
                    <button type="button" onClick={prevStep} className="cursor-pointer inline-flex h-11 items-center justify-center rounded-2xl bg-white border border-slate-200 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                      Voltar
                    </button>
                  )}
                  {step < 4 ? (
                    <button type="button" onClick={nextStep} disabled={step === 2 && temConflitoAno} className="cursor-pointer inline-flex h-11 items-center justify-center rounded-2xl bg-sectec-600 px-5 text-sm font-black text-white transition hover:bg-sectec-700 disabled:cursor-not-allowed disabled:opacity-50">
                      Próximo
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleGravarEvento}
                      disabled={salvandoEvento}
                      className="cursor-pointer inline-flex h-11 items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {salvandoEvento ? <Loader2 className="animate-spin" size={18} /> : <PiCheckCircle size={18} />}
                      {salvandoEvento ? "Salvando..." : isEditing ? "Salvar alterações" : "Criar evento"}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm text-center flex flex-col">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 text-slate-500 border border-slate-100 mb-4">
              <PiCalendarBlank size={24} />
            </div>
            <h3 className="text-sm font-black text-slate-900">Resumo {anoAtual}</h3>
            {eventoVigente ? (
               <div className="mt-4 rounded-2xl border border-emerald-100 bg-emerald-50/50 p-4">
                 <strong className="block text-emerald-900 font-black text-sm">{eventoVigente.titulo}</strong>
                 <p className="text-xs text-emerald-700 mt-1 font-semibold">{eventoVigente.temas?.length || 0} temas cadastrados</p>
               </div>
            ) : (
               <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                 <strong className="block text-amber-900 font-bold text-xs">Nenhum evento cadastrado para {anoAtual}.</strong>
               </div>
            )}
          </aside>
        </section>

        <section className="rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm">
          <h2 className="text-sm font-black uppercase text-slate-800 mb-5">Eventos cadastrados</h2>
          
          {carregando && <div className="text-sm font-medium text-slate-500">Carregando...</div>}
          {!carregando && erro && (
            <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-black text-red-700">{erro}</p>
              {erroTecnico && <p className="text-xs font-semibold text-slate-500">Erro técnico: {erroTecnico}</p>}
              <button
                type="button"
                onClick={carregarEventos}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
              >
                <RefreshCw size={14} /> Tentar novamente
              </button>
            </div>
          )}
          
          {!carregando && !erro && eventos.length === 0 && (
             <div className="flex flex-col items-center justify-center py-12 text-center">
               <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-400 mb-4">
                 <PiCalendarBlank size={28} />
               </div>
               <h3 className="text-sm font-black text-slate-900">Nenhum evento cadastrado</h3>
               <p className="mt-1 text-sm font-medium text-slate-500">Crie o evento anual para liberar os temas e prazos da SECTEC.</p>
             </div>
          )}
          
          {!carregando && !erro && eventos.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {eventos.map((evento) => (
                <motion.article
                  key={evento.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-sectec-200 hover:shadow-md"
                >
                  <div className="flex justify-between items-start gap-2 mb-3">
                    <div className="flex items-center gap-2">
                       <span className="rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-slate-600">{new Date(evento.prazoInicial).getFullYear()}</span>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <button
                        type="button"
                        onClick={() => abrirDetalhesEvento(evento)}
                        aria-label={`Ver detalhes do evento ${evento.titulo}`}
                        className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sectec-300 hover:bg-sectec-50 hover:text-sectec-700"
                      >
                        <Eye size={16} />
                      </button>
                      <button type="button" onClick={() => handleEdit(evento)} className="cursor-pointer flex h-8 items-center justify-center rounded-xl bg-slate-50 px-3 text-xs font-black text-slate-600 transition hover:bg-sectec-50 hover:text-sectec-700">Editar</button>
                      <button type="button" onClick={() => handleExcluirEvento(evento.id)} className="cursor-pointer flex h-8 w-8 items-center justify-center rounded-xl bg-slate-50 text-slate-400 transition hover:bg-red-50 hover:text-red-600"><PiXCircle size={16} /></button>
                    </div>
                  </div>
                  
                  <h3 className="text-base font-black text-slate-900 leading-tight">{evento.titulo}</h3>
                  {evento.descricao && <p className="mt-1 text-xs font-semibold text-slate-500 line-clamp-2">{evento.descricao}</p>}
                  
                  <div className="mt-3 text-[11px] font-semibold text-slate-400 bg-slate-50 rounded-xl p-2.5">
                    De: <span className="text-slate-600">{formatarData(evento.prazoInicial)}</span> <br/>
                    Até: <span className="text-slate-600">{formatarData(evento.prazoFinal)}</span>
                  </div>

                  <div className="mt-4 rounded-2xl border border-slate-100 bg-slate-50 p-3">
                    <p className="mb-2 text-[10px] font-black uppercase tracking-wider text-slate-400">Cronograma</p>
                    <div className="grid gap-2">
                      {getFasesEvento(evento).map((fase) => (
                        <div key={fase.label} className="flex items-center justify-between gap-3 text-xs">
                          <span className="font-black text-slate-700">{fase.label}</span>
                          <span className="font-semibold text-slate-500">{formatarPeriodo(fase.periodo)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex-1">
                    <div className="flex flex-wrap items-center gap-1.5 mb-3">
                      {(evento.temas || []).length === 0 && <span className="text-[10px] uppercase font-bold text-slate-300">Sem temas</span>}
                      {temasVisiveis(evento.temas).map((tema) => (
                        <button
                          key={tema.id}
                          type="button"
                          onClick={() => handleVerDetalhesTema(evento, tema)}
                          className="cursor-pointer inline-flex items-center rounded-full border border-sectec-100 bg-sectec-50 px-3 py-1 text-xs font-bold text-sectec-700 transition hover:bg-sectec-100"
                        >
                          {tema.nome}
                        </button>
                      ))}
                      {temasRestantes(evento.temas) > 0 && (
                        <button
                          type="button"
                          onClick={() => handleVerDetalhesTema(evento)}
                          className="cursor-pointer inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-bold text-slate-600 transition hover:bg-slate-100"
                        >
                          +{temasRestantes(evento.temas)} temas
                        </button>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-auto pt-3 border-t border-slate-100 flex gap-2">
                    <input value={temaInputs[evento.id] || ""} onChange={(e) => setTemaInputs((prev) => ({ ...prev, [evento.id]: e.target.value }))} placeholder="Novo tema..." className="h-9 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-xs font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100" />
                    <button type="button" onClick={() => handleAdicionarTema(evento.id)} className="cursor-pointer inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-800 text-white transition hover:bg-slate-700"><PiPlus size={14} /></button>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </section>

        <PainelDetalhes
          aberto={detalhesEventoAberto}
          titulo={eventoSelecionado ? `Detalhes · ${eventoSelecionado.titulo}` : "Detalhes do evento"}
          onClose={fecharDetalhesEvento}
        >
          {eventoSelecionado ? (
            <div className="space-y-5">
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Visão geral</p>
                <h3 className="mt-2 text-lg font-black text-slate-900">{eventoSelecionado.titulo}</h3>
                <p className="mt-2 text-sm font-medium text-slate-600">{eventoSelecionado.descricao || "Sem descrição"}</p>
                <p className="mt-3 text-xs text-slate-500">Ano: <span className="font-black text-slate-700">{new Date(eventoSelecionado.prazoInicial).getFullYear()}</span></p>
                <p className="mt-1 text-xs text-slate-500">Período geral: <span className="font-black text-slate-700">{formatarPeriodo({ inicio: eventoSelecionado.prazoInicial, fim: eventoSelecionado.prazoFinal })}</span></p>
              </div>

              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Cronograma</p>
                <div className="mt-3 grid gap-2">
                  {getFasesEvento(eventoSelecionado).map((fase) => (
                    <div key={fase.label} className="flex items-center justify-between gap-3 text-sm">
                      <span className="font-black text-slate-700">{fase.label}</span>
                      <span className="font-semibold text-slate-500">{formatarPeriodo(fase.periodo)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Temas ({eventoSelecionado.temas?.length ?? 0})</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(eventoSelecionado.temas ?? []).length === 0 && (
                    <span className="text-sm font-semibold text-slate-500">Nenhum tema cadastrado para este evento.</span>
                  )}
                  {(eventoSelecionado.temas ?? []).map((tema) => (
                    <span
                      key={tema.id}
                      className="inline-flex items-center rounded-full border border-sectec-100 bg-sectec-50 px-3 py-1 text-xs font-bold text-sectec-700"
                    >
                      {tema.nome}
                    </span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-widest text-slate-500">Projetos vinculados ({projetosEventoSelecionado.length})</p>
                <div className="mt-3 space-y-2">
                  {projetosEventoSelecionado.length === 0 ? (
                    <p className="text-sm font-semibold text-slate-500">Nenhum projeto vinculado a este evento.</p>
                  ) : (
                    projetosEventoSelecionado.map((projeto) => (
                      <div key={projeto.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                        <p className="font-black text-slate-900">{projeto.titulo}</p>
                        <p className="mt-1 text-xs text-slate-500">
                          {projeto.tema?.nome || "Sem tema"} · {projeto.alunoAutor?.nome || projeto.projetoAlunos?.[0]?.aluno?.nome || "Sem autor"}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm font-semibold text-slate-500">Carregando detalhes...</p>
          )}
        </PainelDetalhes>
      </div>
    </AdminPageShell>
  );
}


type UsuarioCoordenacao = {
  id: string;
  nome: string;
  email: string;
  perfil: "Aluno" | "Orientador" | "Comissão";
  turma?: string;
  ano?: number;
};

function UsuariosCoordenacao() {
  const [abaAtiva, setAbaAtiva] = useState<"alunos" | "orientadores" | "comissao">("alunos");
  const [busca, setBusca] = useState("");
  const [turmaFiltro, setTurmaFiltro] = useState("todas");
  const [paginaAtual, setPaginaAtual] = useState(1);
  const [alunos, setAlunos] = useState<UsuarioCoordenacao[]>([]);
  const [orientadores, setOrientadores] = useState<UsuarioCoordenacao[]>([]);
  const [comissao, setComissao] = useState<UsuarioCoordenacao[]>([]);
  const [projetosCoordenacao, setProjetosCoordenacao] = useState<any[]>([]);
  const [usuarioSelecionado, setUsuarioSelecionado] = useState<UsuarioCoordenacao | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState("");
  const [erroTecnico, setErroTecnico] = useState("");
  const [importandoTipo, setImportandoTipo] = useState<"alunos" | "orientadores" | null>(null);
  const inputAlunosRef = useRef<HTMLInputElement>(null);
  const inputOrientadoresRef = useRef<HTMLInputElement>(null);

  const totalAlunos = alunos.length;
  const totalOrientadores = orientadores.length;
  const totalComissao = comissao.length;
  const totalGeral = totalAlunos + totalOrientadores + totalComissao;

  function normalizarUsuarios(lista: UsuarioApi[], perfil: UsuarioCoordenacao["perfil"]) {
    return lista.map((usuario) => ({
      id: String(usuario.id),
      nome: usuario.nome,
      email: usuario.email_institucional ?? "",
      perfil,
      turma: (usuario as { turma?: string })?.turma,
      ano: typeof usuario.ano === "string" ? Number(usuario.ano) : usuario.ano ?? undefined,
    }));
  }

  async function carregarUsuarios() {
    setCarregando(true);
    setErro("");

    try {
      const [alunosResponse, orientadoresResponse, comissaoResponse] = await Promise.all([
        apiRequest<UsuarioApi[]>("/users/alunos"),
        apiRequest<UsuarioApi[]>("/users/orientadores"),
        apiRequest<UsuarioApi[]>("/users/comissao"),
      ]);

      setAlunos(normalizarUsuarios(alunosResponse, "Aluno"));
      setOrientadores(normalizarUsuarios(orientadoresResponse, "Orientador"));
      setComissao(normalizarUsuarios(comissaoResponse, "Comissão"));
    } catch (error) {
      const erro = mensagemErroApi(error, "Não foi possível carregar os dados.");
      setErro(`${erro.amigavel} Tente novamente em alguns instantes.`);
      setErroTecnico(erro.tecnico);
    } finally {
      setCarregando(false);
    }
  }

  async function carregarProjetos() {
    try {
      const dados = await apiRequest<any[]>('/projetos');
      const flatten = Array.isArray(dados) ? dados.flatMap((item) => (Array.isArray(item.projetos) ? item.projetos.map((p: any) => ({ ...p, evento: p.evento ?? { id: item.id, titulo: item.titulo } })) : [item])) : [];
      setProjetosCoordenacao(flatten);
    } catch {
      setProjetosCoordenacao([]);
    }
  }

  async function lerMensagemErro(response: Response) {
    try {
      const data = await response.json();
      if (typeof data?.message === "string") return data.message;
      if (Array.isArray(data?.message)) return data.message.join(" ");
    } catch {
      // fallback para erros sem JSON
    }

    return "Nao foi possivel concluir a importacao.";
  }

  async function handleUploadCsv(tipo: "alunos" | "orientadores", file?: File) {
    if (!file) return;

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);
    setImportandoTipo(tipo);

    try {
      const rota = tipo === "alunos" ? "/users/upload-csv/alunos" : "/users/upload-csv/professores";
      const response = await fetch(`${API_BASE_URL}${rota}`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData,
      });

      if (!response.ok) {
        const message = await lerMensagemErro(response);
        throw new Error(message);
      }

      Swal.fire({
        icon: "success",
        title: "CSV importado com sucesso!",
        showConfirmButton: false,
        timer: 1400,
        timerProgressBar: true,
      });
      await carregarUsuarios();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Erro ao importar CSV",
        text: error instanceof Error ? error.message : "Tente novamente.",
        confirmButtonColor: "#15803d",
      });
    } finally {
      setImportandoTipo(null);
      if (tipo === "alunos" && inputAlunosRef.current) inputAlunosRef.current.value = "";
      if (tipo === "orientadores" && inputOrientadoresRef.current) inputOrientadoresRef.current.value = "";
    }
  }

  async function promoverAlunoParaComissao(usuario: UsuarioCoordenacao) {
    if (usuario.perfil !== "Aluno") {
      await Swal.fire({
        icon: "warning",
        title: "Ação indisponível",
        text: "Apenas alunos podem ser movidos para a comissão.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    const result = await Swal.fire({
      icon: "question",
      title: "Tornar aluno da comissão?",
      text: `Deseja mover ${usuario.nome} para a comissão organizadora?`,
      showCancelButton: true,
      confirmButtonText: "Sim, tornar comissão",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#15803d",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      await apiRequest(`/users/${usuario.id}/promote-comissao`, { method: "PATCH" });

      await Swal.fire({
        icon: "success",
        title: "Aluno movido para comissão",
        text: `${usuario.nome} agora faz parte da comissão.`,
        confirmButtonColor: "#15803d",
      });

      await carregarUsuarios();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro ao mover para comissão",
        text: error instanceof Error ? error.message : "Não foi possível mover o aluno para a comissão.",
        confirmButtonColor: "#15803d",
      });
    }
  }

  useEffect(() => {
    let ativo = true;

    async function carregar() {
      if (!ativo) return;
      await Promise.all([carregarUsuarios(), carregarProjetos()]);
    }

    carregar();

    return () => {
      ativo = false;
    };
  }, []);

  function getProjetosDoUsuario(usuario: UsuarioCoordenacao) {
    const usuarioId = String(usuario.id);

    return projetosCoordenacao.filter((projeto: any) => {
      const autorId = projeto.alunoAutor?.id ? String(projeto.alunoAutor.id) : null;
      const ehAutor = autorId === usuarioId;
      const ehIntegrante = Array.isArray(projeto.projetoAlunos)
        ? projeto.projetoAlunos.some((v: any) => String(v.aluno?.id) === usuarioId)
        : false;
      return ehAutor || ehIntegrante;
    });
  }

  function abrirDetalhesUsuario(usuario: UsuarioCoordenacao) {
    setUsuarioSelecionado(usuario);
    setDetalhesAberto(true);
  }

  function fecharDetalhesUsuario() {
    setDetalhesAberto(false);
    setUsuarioSelecionado(null);
  }

  const listaAtual = abaAtiva === "alunos" ? alunos : abaAtiva === "orientadores" ? orientadores : comissao;
  const termo = busca.trim().toLowerCase();
  const podeFiltrarTurma = abaAtiva !== "orientadores";
  const turmasDisponiveis = podeFiltrarTurma
    ? [
        "todas",
        ...Array.from(new Set(listaAtual.map((usuario) => usuario.turma).filter(Boolean))).sort(),
      ] as string[]
    : ["todas"];

  const listaFiltrada = listaAtual.filter((usuario) => {
    const bateBusca =
      !termo ||
      usuario.nome.toLowerCase().includes(termo) ||
      usuario.email.toLowerCase().includes(termo);
    const bateTurma =
      !podeFiltrarTurma ||
      turmaFiltro === "todas" ||
      (usuario.turma?.toLowerCase() ?? "") === turmaFiltro.toLowerCase();

    return bateBusca && bateTurma;
  });

  const itensPorPagina = 10;
  const totalPaginas = Math.max(1, Math.ceil(listaFiltrada.length / itensPorPagina));
  const paginaSegura = Math.min(paginaAtual, totalPaginas);
  const inicio = (paginaSegura - 1) * itensPorPagina;
  const listaPaginada = listaFiltrada.slice(inicio, inicio + itensPorPagina);

  useEffect(() => {
    setPaginaAtual(1);
  }, [abaAtiva, busca, turmaFiltro]);

  useEffect(() => {
    if (!podeFiltrarTurma && turmaFiltro !== "todas") {
      setTurmaFiltro("todas");
    }
  }, [podeFiltrarTurma, turmaFiltro]);

  return (
    <AdminPageShell>
      <section className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={<PiUsersThree size={20} />} title="Usuarios" subtitle="Cadastro via CSV e comissão real carregada do backend." />
          <div className="grid w-full gap-2 sm:grid-cols-2 lg:w-auto lg:grid-cols-1 xl:grid-cols-2">
            <input
              ref={inputAlunosRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => handleUploadCsv("alunos", event.target.files?.[0])}
            />
            <input
              ref={inputOrientadoresRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(event) => handleUploadCsv("orientadores", event.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => inputAlunosRef.current?.click()}
              disabled={importandoTipo !== null}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-black text-emerald-700 transition hover:bg-emerald-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importandoTipo === "alunos" ? <Loader2 className="animate-spin" size={18} /> : <PiUploadSimple size={18} />}
              {importandoTipo === "alunos" ? "Importando alunos..." : "Importar CSV (alunos)"}
            </button>
            <button
              type="button"
              onClick={() => inputOrientadoresRef.current?.click()}
              disabled={importandoTipo !== null}
              className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {importandoTipo === "orientadores" ? <Loader2 className="animate-spin" size={18} /> : <PiUploadSimple size={18} />}
              {importandoTipo === "orientadores" ? "Importando orientadores..." : "Importar CSV (orientadores)"}
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {[
            { label: "Total de alunos", value: totalAlunos },
            { label: "Total de orientadores", value: totalOrientadores },
            { label: "Total de comissão", value: totalComissao },
            { label: "Total geral", value: totalGeral },
          ].map((card) => (
            <article key={card.label} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{card.label}</p>
              <strong className="mt-2 block text-2xl font-black text-slate-900">{card.value}</strong>
            </article>
          ))}
        </div>

        <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="inline-flex rounded-2xl border border-slate-200 bg-slate-50 p-1">
            {[
              { id: "alunos", label: "Alunos" },
              { id: "orientadores", label: "Orientadores" },
              { id: "comissao", label: "Comissão" },
            ].map((aba) => {
              const ativa = abaAtiva === aba.id;
              return (
                <button
                  key={aba.id}
                  type="button"
                  onClick={() => setAbaAtiva(aba.id as "alunos" | "orientadores" | "comissao")}
                  className={`cursor-pointer px-4 py-2 text-sm font-black transition ${
                    ativa
                      ? "rounded-xl bg-white text-sectec-700 shadow-sm"
                      : "text-slate-500 hover:bg-sectec-50 hover:text-sectec-700"
                  }`}
                >
                  {aba.label}
                </button>
              );
            })}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
              <input
                value={busca}
                onChange={(event) => setBusca(event.target.value)}
                placeholder="Buscar por nome ou email"
                className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100 sm:w-60"
              />
            </label>
            {podeFiltrarTurma && (
              <label className="relative block">
                <PiFunnel className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <select
                  value={turmaFiltro}
                  onChange={(event) => setTurmaFiltro(event.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-8 text-sm font-black text-slate-600 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100 sm:w-48"
                >
                  {turmasDisponiveis.map((turma) => (
                    <option key={turma} value={turma}>
                      {turma === "todas" ? "Todas as turmas" : turma}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </div>

        <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
          <div className="hidden grid-cols-[1fr_1fr_0.7fr_0.7fr_0.5fr] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-400 lg:grid">
            <span>Nome</span>
            <span>Email institucional</span>
            <span>Turma / ano</span>
            <span>Perfil</span>
            <span className="text-right">Ações</span>
          </div>

          <div className="divide-y divide-slate-100">
            {carregando && (
              <div className="space-y-2 p-4">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-10 animate-pulse rounded-xl bg-slate-100" />
                ))}
              </div>
            )}
            {!carregando && erro && (
              <div className="space-y-3 px-4 py-6">
                <p className="text-sm font-black text-red-600">{erro}</p>
                {erroTecnico && <p className="text-xs font-semibold text-slate-400">Erro técnico: {erroTecnico}</p>}
                <button
                  type="button"
                  onClick={carregarUsuarios}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
                >
                  <RefreshCw size={14} /> Tentar novamente
                </button>
              </div>
            )}
            {!carregando && !erro && listaFiltrada.length === 0 && (
              <div className="px-4 py-6 text-sm font-semibold text-slate-500">Nenhum usuário encontrado.</div>
            )}
            {!carregando && !erro && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={abaAtiva}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                >
                  {listaPaginada.map((usuario) => (
                    <article key={usuario.id} className="grid gap-2 px-4 py-4 lg:grid-cols-[1fr_1fr_0.7fr_0.7fr_0.5fr] lg:items-center transition hover:bg-sectec-50/40">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-black text-slate-900">{usuario.nome}</p>
                      </div>
                      <p className="truncate text-sm font-semibold text-slate-600">{usuario.email || "-"}</p>
                      <p className="truncate text-sm font-semibold text-slate-600">
                        {usuario.turma || "-"}
                        {usuario.ano ? ` · ${usuario.ano}` : ""}
                      </p>
                      <p className="text-sm font-black text-slate-700">{usuario.perfil}</p>
                      <div className="flex justify-end">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => abrirDetalhesUsuario(usuario)}
                            aria-label={`Ver detalhes de ${usuario.nome}`}
                            className="inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 transition hover:border-sectec-300 hover:bg-sectec-50 hover:text-sectec-700"
                          >
                            <Eye size={16} />
                          </button>

                          {abaAtiva === "alunos" && usuario.perfil === "Aluno" ? (
                            <button
                              type="button"
                              onClick={() => promoverAlunoParaComissao(usuario)}
                              className="inline-flex cursor-pointer items-center justify-center rounded-xl border border-sectec-200 bg-sectec-50 px-3 py-2 text-xs font-black text-sectec-700 transition hover:bg-sectec-100 hover:text-sectec-800"
                            >
                              Tornar comissão
                            </button>
                          ) : (
                            <span className="text-xs font-semibold text-slate-400">Sem ações disponíveis</span>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {!carregando && !erro && totalPaginas > 1 && (
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-sm font-semibold text-slate-600">
            <span>
              Pagina {paginaSegura} de {totalPaginas}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPaginaAtual((prev) => Math.max(1, prev - 1))}
                className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={paginaSegura === 1}
              >
                Anterior
              </button>
              <button
                type="button"
                onClick={() => setPaginaAtual((prev) => Math.min(totalPaginas, prev + 1))}
                className="cursor-pointer rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-600 transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={paginaSegura === totalPaginas}
              >
                Proxima
              </button>
            </div>
          </div>
        )}
      </section>
      <PainelDetalhes aberto={detalhesAberto} titulo={usuarioSelecionado ? usuarioSelecionado.nome : "Detalhes do usuário"} onClose={fecharDetalhesUsuario}>
        {usuarioSelecionado ? (
          <div className="space-y-4">
            <div>
              <p className="text-sm font-black text-slate-900">{usuarioSelecionado.nome}</p>
              <p className="mt-1 text-sm font-semibold text-slate-600">{usuarioSelecionado.email || "-"}</p>
              <p className="mt-1 text-xs text-slate-500">Perfil: <strong className="text-slate-700">{usuarioSelecionado.perfil}</strong></p>
              <p className="mt-1 text-xs text-slate-500">Turma: {usuarioSelecionado.turma || "-"}{usuarioSelecionado.ano ? ` · ${usuarioSelecionado.ano}` : ""}</p>
            </div>

            <div>
              <h4 className="text-sm font-black text-slate-900">Projetos vinculados</h4>
              <div className="mt-3 space-y-3">
                {getProjetosDoUsuario(usuarioSelecionado).length === 0 ? (
                  <div className="text-sm text-slate-500">Nenhum projeto vinculado a este usuário.</div>
                ) : (
                  getProjetosDoUsuario(usuarioSelecionado).map((projeto) => (
                    <div key={projeto.id} className="rounded-xl border border-slate-100 p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-black text-slate-900">{projeto.titulo}</p>
                          <p className="mt-1 text-xs text-slate-500">{projeto.tema?.nome || "Sem tema"} · {projeto.evento?.titulo || projeto.eventoTitulo || "Sem evento"}</p>
                        </div>
                        <div className="text-xs font-black text-slate-700">{String(projeto.alunoAutor?.id) === usuarioSelecionado.id ? 'Autor' : 'Integrante'}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-slate-500">Carregando...</div>
        )}
      </PainelDetalhes>
    </AdminPageShell>
  );
}

function ProjetosCoordenacao() {
  const [projetos, setProjetos] = useState<ProjetoCoordenacaoListagem[]>([]);
  const [eventos, setEventos] = useState<EventoApi[]>([]);
  const [alunos, setAlunos] = useState<UsuarioApi[]>([]);
  const [busca, setBusca] = useState("");
  const [eventoFiltro, setEventoFiltro] = useState("todos");
  const [turmaFiltro, setTurmaFiltro] = useState("todas");
  const [statusOrientacaoFiltro, setStatusOrientacaoFiltro] = useState("todos");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [erroTecnico, setErroTecnico] = useState("");
  const [projetoSelecionado, setProjetoSelecionado] = useState<ProjetoCoordenacaoListagem | null>(null);
  const [detalhesAberto, setDetalhesAberto] = useState(false);
  const [edicaoAberta, setEdicaoAberta] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [formProjeto, setFormProjeto] = useState({
    titulo: "",
    descricao: "",
    temaId: "",
    evento: "",
    alunosIds: [] as number[],
  });

  async function carregarProjetos() {
    setCarregando(true);
    setErro("");
    setErroTecnico("");

    try {
      const [projetosResponse, eventosResponse, alunosResponse] = await Promise.all([
        apiRequest<unknown>("/projetos"),
        apiRequest<EventoApi[]>("/evento").catch(() => []),
        apiRequest<UsuarioApi[]>("/users/alunos").catch(() => []),
      ]);

      setProjetos(extrairProjetosDaResposta(projetosResponse) as ProjetoCoordenacaoListagem[]);
      setEventos(eventosResponse);
      setAlunos(alunosResponse);
    } catch (error) {
      const erro = mensagemErroApi(error, "Não foi possível carregar os dados.");
      setErro(`${erro.amigavel} Tente novamente em alguns instantes.`);
      setErroTecnico(erro.tecnico);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarProjetos();
  }, []);

  const eventosFiltro = useMemo(() => {
    const mapa = new Map<string, string>();
    projetos.forEach((projeto) => {
      const id = getEventoProjetoId(projeto);
      const titulo = projeto.eventoTitulo ?? projeto.evento?.titulo;
      if (id && titulo) mapa.set(String(id), titulo);
    });
    return Array.from(mapa.entries()).map(([id, titulo]) => ({ id, titulo }));
  }, [projetos]);

  const turmasDisponiveis = useMemo(() => {
    const turmas = new Set<string>();
    projetos.forEach((projeto) => {
      const autor = getAutorProjeto(projeto);
      if (autor?.turma) turmas.add(autor.turma);
      getIntegrantesProjeto(projeto).forEach((aluno) => {
        if (aluno?.turma) turmas.add(aluno.turma);
      });
    });
    return Array.from(turmas).sort();
  }, [projetos]);

  const statusOrientacaoDisponiveis = useMemo(() => {
    const status = new Set<string>();
    projetos.forEach((projeto) => {
      getOrientadoresProjeto(projeto).forEach((orientacao) => {
        if (orientacao.status) status.add(orientacao.status);
      });
    });
    return Array.from(status).sort();
  }, [projetos]);

  const projetosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    return projetos.filter((projeto) => {
      const autor = getAutorProjeto(projeto);
      const integrantes = getIntegrantesProjeto(projeto);
      const orientadores = getOrientadoresProjeto(projeto);
      const eventoId = getEventoProjetoId(projeto);
      const statusOrientacao = getStatusOrientacaoProjeto(projeto);

      const bateBusca =
        !termo ||
        projeto.titulo.toLowerCase().includes(termo) ||
        projeto.descricao?.toLowerCase().includes(termo) ||
        projeto.tema?.nome.toLowerCase().includes(termo) ||
        autor?.nome.toLowerCase().includes(termo) ||
        integrantes.some((aluno) => aluno?.nome.toLowerCase().includes(termo)) ||
        orientadores.some((item) => item.orientador?.nome.toLowerCase().includes(termo));

      const bateEvento = eventoFiltro === "todos" || String(eventoId) === eventoFiltro;
      const bateTurma =
        turmaFiltro === "todas" ||
        autor?.turma === turmaFiltro ||
        integrantes.some((aluno) => aluno?.turma === turmaFiltro);
      const bateStatusOrientacao =
        statusOrientacaoFiltro === "todos" || statusOrientacao === statusOrientacaoFiltro;

      return bateBusca && bateEvento && bateTurma && bateStatusOrientacao;
    });
  }, [busca, eventoFiltro, projetos, statusOrientacaoFiltro, turmaFiltro]);

  const eventoSelecionadoNoForm = eventos.find((evento) => String(evento.id) === formProjeto.evento);
  const temasDoEventoSelecionado = eventoSelecionadoNoForm?.temas ?? [];

  function abrirDetalhesProjeto(projeto: ProjetoCoordenacaoListagem) {
    setProjetoSelecionado(projeto);
    setDetalhesAberto(true);
  }

  function abrirEdicaoProjeto(projeto: ProjetoCoordenacaoListagem) {
    const autorId = projeto.alunoAutor?.id ? String(projeto.alunoAutor.id) : null;
    const alunosIds = getIntegrantesProjeto(projeto)
      .map((aluno) => Number(aluno?.id))
      .filter((id) => Number.isFinite(id) && String(id) !== autorId);

    setProjetoSelecionado(projeto);
    setFormProjeto({
      titulo: projeto.titulo,
      descricao: projeto.descricao ?? "",
      temaId: String(getTemaProjetoId(projeto) ?? ""),
      evento: String(getEventoProjetoId(projeto) ?? ""),
      alunosIds,
    });
    setEdicaoAberta(true);
  }

  function alternarAlunoIntegrante(id: number) {
    setFormProjeto((prev) => ({
      ...prev,
      alunosIds: prev.alunosIds.includes(id)
        ? prev.alunosIds.filter((item) => item !== id)
        : [...prev.alunosIds, id],
    }));
  }

  async function salvarProjeto() {
    if (!projetoSelecionado) return;

    const autorId = projetoSelecionado.alunoAutor?.id ? Number(projetoSelecionado.alunoAutor.id) : null;
    const alunosIds = formProjeto.alunosIds.filter((id) => id !== autorId);
    const totalGrupo = alunosIds.length + 1;

    if (!formProjeto.titulo.trim() || !formProjeto.descricao.trim() || !formProjeto.temaId || !formProjeto.evento) {
      await Swal.fire({
        icon: "warning",
        title: "Preencha os campos obrigatórios",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    if (totalGrupo < 3 || totalGrupo > 7) {
      await Swal.fire({
        icon: "warning",
        title: "Grupo inválido",
        text: "O grupo deve ter entre 3 e 7 pessoas contando o autor.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    setSalvando(true);
    try {
      await apiRequest(`/projetos/${projetoSelecionado.id}`, {
        method: "PATCH",
        body: {
          titulo: formProjeto.titulo.trim(),
          descricao: formProjeto.descricao.trim(),
          temaId: Number(formProjeto.temaId),
          evento: Number(formProjeto.evento),
          alunosIds,
        },
      });

      await Swal.fire({
        icon: "success",
        title: "Projeto atualizado",
        showConfirmButton: false,
        timer: 1300,
        timerProgressBar: true,
      });
      setEdicaoAberta(false);
      setProjetoSelecionado(null);
      await carregarProjetos();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro ao salvar projeto",
        text: error instanceof Error ? error.message : "Tente novamente.",
        confirmButtonColor: "#15803d",
      });
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProjeto(projeto: ProjetoCoordenacaoListagem) {
    const result = await Swal.fire({
      icon: "warning",
      title: "Excluir projeto?",
      text: `Essa ação removerá "${projeto.titulo}".`,
      showCancelButton: true,
      confirmButtonText: "Excluir",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
    });

    if (!result.isConfirmed) return;

    try {
      await apiRequest(`/projetos/${projeto.id}`, { method: "DELETE" });
      await Swal.fire({
        icon: "success",
        title: "Projeto excluído",
        showConfirmButton: false,
        timer: 1200,
        timerProgressBar: true,
      });
      await carregarProjetos();
    } catch (error) {
      await Swal.fire({
        icon: "error",
        title: "Erro ao excluir projeto",
        text: error instanceof Error ? error.message : "Tente novamente.",
        confirmButtonColor: "#15803d",
      });
    }
  }

  function renderOrientadores(projeto: ProjetoCoordenacaoListagem) {
    const orientadores = getOrientadoresProjeto(projeto);

    if (orientadores.length === 0) {
      return <p className="text-sm font-semibold text-slate-500">Nenhum orientador aceito/vinculado.</p>;
    }

    return (
      <div className="space-y-2">
        {orientadores.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
            <p className="text-sm font-black text-slate-900">{item.orientador?.nome ?? "Orientador não identificado"}</p>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {item.status ?? "sem status"} · {item.orientador?.email_institucional ?? "-"}
            </p>
          </div>
        ))}
      </div>
    );
  }

  return (
    <AdminPageShell>
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <PanelTitle icon={<PiNotebook size={20} />} title="Projetos" subtitle="Gestão real de projetos cadastrados, agrupados ou não por evento." />
          <button
            type="button"
            onClick={carregarProjetos}
            disabled={carregando}
            className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {carregando ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
            Atualizar
          </button>
        </div>

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px_180px_210px]">
          <label className="relative block">
            <PiMagnifyingGlass className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar por título, autor, integrante ou tema"
              className="h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 pl-10 pr-3 text-sm font-semibold text-slate-700 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100"
            />
          </label>

          <select
            value={eventoFiltro}
            onChange={(event) => setEventoFiltro(event.target.value)}
            className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-600 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100"
          >
            <option value="todos">Todos os eventos</option>
            {eventosFiltro.map((evento) => (
              <option key={evento.id} value={evento.id}>{evento.titulo}</option>
            ))}
          </select>

          {turmasDisponiveis.length > 0 && (
            <select
              value={turmaFiltro}
              onChange={(event) => setTurmaFiltro(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-600 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100"
            >
              <option value="todas">Todas as turmas</option>
              {turmasDisponiveis.map((turma) => (
                <option key={turma} value={turma}>{turma}</option>
              ))}
            </select>
          )}

          {statusOrientacaoDisponiveis.length > 0 && (
            <select
              value={statusOrientacaoFiltro}
              onChange={(event) => setStatusOrientacaoFiltro(event.target.value)}
              className="h-11 rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-600 outline-none transition focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100"
            >
              <option value="todos">Todas orientações</option>
              {statusOrientacaoDisponiveis.map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
              <option value="sem-orientador">Sem orientador</option>
            </select>
          )}
        </div>

        <div className="mt-6">
          {carregando && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {[1, 2, 3].map((item) => (
                <div key={item} className="h-56 animate-pulse rounded-3xl bg-slate-100" />
              ))}
            </div>
          )}

          {!carregando && erro && (
            <div className="space-y-3 rounded-2xl border border-red-100 bg-red-50 p-4">
              <p className="text-sm font-black text-red-700">{erro}</p>
              {erroTecnico && <p className="text-xs font-semibold text-slate-500">Erro técnico: {erroTecnico}</p>}
              <button
                type="button"
                onClick={carregarProjetos}
                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-white px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100"
              >
                <RefreshCw size={14} /> Tentar novamente
              </button>
            </div>
          )}

          {!carregando && !erro && projetosFiltrados.length === 0 && (
            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
              <h3 className="text-sm font-black text-slate-900">Nenhum projeto encontrado.</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">Ajuste os filtros ou cadastre projetos pelo fluxo dos alunos.</p>
            </div>
          )}

          {!carregando && !erro && projetosFiltrados.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {projetosFiltrados.map((projeto, index) => {
                const autor = getAutorProjeto(projeto);
                const integrantes = getIntegrantesProjeto(projeto);
                const orientadores = getOrientadoresProjeto(projeto);

                return (
                  <motion.article
                    key={projeto.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.18, delay: index * 0.03 }}
                    className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <div className="flex h-20 items-center justify-between bg-gradient-to-br from-emerald-700 to-slate-900 px-5 text-white">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-lg font-black">
                        {projeto.titulo.charAt(0).toUpperCase()}
                      </div>
                      <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-black uppercase text-white/75">
                        Banner visual
                      </span>
                    </div>

                    <div className="p-5">
                      <h3 className="line-clamp-2 text-base font-black text-slate-950">{projeto.titulo}</h3>
                      <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-500">{getProjetoDescricaoCurta(projeto)}</p>

                      <div className="mt-4 space-y-2 text-xs font-semibold text-slate-500">
                        <p><strong className="text-slate-700">Evento:</strong> {projeto.eventoTitulo ?? projeto.evento?.titulo ?? "Sem evento"}</p>
                        <p><strong className="text-slate-700">Tema:</strong> {projeto.tema?.nome ?? "Sem tema"}</p>
                        <p><strong className="text-slate-700">Autor:</strong> {autor?.nome ?? "Sem autor"}</p>
                        <p><strong className="text-slate-700">Integrantes:</strong> {integrantes.length || "Sem integrantes adicionais"}</p>
                        <p><strong className="text-slate-700">Orientação:</strong> {orientadores.length ? getStatusOrientacaoProjeto(projeto) : "Nenhum orientador aceito/vinculado"}</p>
                        <p><strong className="text-slate-700">Criação:</strong> {getDataCriacaoProjeto(projeto)}</p>
                      </div>

                      <div className="mt-5 flex flex-wrap gap-2">
                        <button type="button" onClick={() => abrirDetalhesProjeto(projeto)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-black text-slate-700 transition hover:bg-slate-50">
                          <Eye size={15} /> Ver
                        </button>
                        <button type="button" onClick={() => abrirEdicaoProjeto(projeto)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700 transition hover:bg-emerald-100">
                          <Pencil size={15} /> Editar
                        </button>
                        <button type="button" onClick={() => excluirProjeto(projeto)} className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-xs font-black text-red-700 transition hover:bg-red-100">
                          <Trash2 size={15} /> Excluir
                        </button>
                      </div>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <PainelDetalhes aberto={detalhesAberto} titulo={projetoSelecionado?.titulo ?? "Detalhes do projeto"} onClose={() => setDetalhesAberto(false)}>
        {projetoSelecionado && (
          <div className="space-y-5">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Visão geral</p>
              <h3 className="mt-2 text-lg font-black text-slate-900">{projetoSelecionado.titulo}</h3>
              <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{projetoSelecionado.descricao || "Sem descrição"}</p>
              <p className="mt-3 text-xs text-slate-500">Evento: <strong className="text-slate-700">{projetoSelecionado.eventoTitulo ?? projetoSelecionado.evento?.titulo ?? "Sem evento"}</strong></p>
              <p className="mt-1 text-xs text-slate-500">Tema: <strong className="text-slate-700">{projetoSelecionado.tema?.nome ?? "Sem tema"}</strong></p>
              <p className="mt-1 text-xs text-slate-500">Criado em: <strong className="text-slate-700">{getDataCriacaoProjeto(projetoSelecionado)}</strong></p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Aluno autor</p>
              <p className="mt-2 text-sm font-black text-slate-900">{getAutorProjeto(projetoSelecionado)?.nome ?? "Sem autor identificado"}</p>
              <p className="mt-1 text-xs font-semibold text-slate-500">{getAutorProjeto(projetoSelecionado)?.turma ?? "-"} {getAutorProjeto(projetoSelecionado)?.ano ? `· ${getAutorProjeto(projetoSelecionado)?.ano}` : ""}</p>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Integrantes</p>
              <div className="mt-3 space-y-2">
                {getIntegrantesProjeto(projetoSelecionado).length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">Sem integrantes adicionais.</p>
                ) : (
                  getIntegrantesProjeto(projetoSelecionado).map((aluno) => (
                    <div key={aluno!.id} className="rounded-xl bg-slate-50 p-3">
                      <p className="text-sm font-black text-slate-900">{aluno!.nome}</p>
                      <p className="mt-1 text-xs font-semibold text-slate-500">{aluno!.turma ?? "-"} {aluno!.ano ? `· ${aluno!.ano}` : ""}</p>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-100 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Orientadores</p>
              <div className="mt-3">{renderOrientadores(projetoSelecionado)}</div>
              <p className="mt-3 text-xs font-semibold text-slate-400">Troca de orientador ainda não está disponível pelo backend.</p>
            </div>
          </div>
        )}
      </PainelDetalhes>

      <PainelDetalhes aberto={edicaoAberta} titulo="Editar projeto" onClose={() => setEdicaoAberta(false)}>
        {projetoSelecionado && (
          <div className="space-y-4">
            <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
              Título
              <input value={formProjeto.titulo} onChange={(e) => setFormProjeto((prev) => ({ ...prev, titulo: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-semibold text-slate-700 outline-none focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100" />
            </label>

            <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
              Descrição
              <textarea value={formProjeto.descricao} onChange={(e) => setFormProjeto((prev) => ({ ...prev, descricao: e.target.value }))} className="mt-2 h-28 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold text-slate-700 outline-none focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100" />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                Evento
                <select value={formProjeto.evento} onChange={(e) => setFormProjeto((prev) => ({ ...prev, evento: e.target.value, temaId: "" }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-600 outline-none focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100">
                  <option value="">Selecione</option>
                  {eventos.map((evento) => (
                    <option key={evento.id} value={evento.id}>{evento.titulo}</option>
                  ))}
                </select>
              </label>

              <label className="block text-xs font-black uppercase tracking-widest text-slate-500">
                Tema
                <select value={formProjeto.temaId} onChange={(e) => setFormProjeto((prev) => ({ ...prev, temaId: e.target.value }))} className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-black text-slate-600 outline-none focus:border-sectec-500 focus:bg-white focus:ring-2 focus:ring-sectec-100">
                  <option value="">Selecione</option>
                  {projetoSelecionado.tema && !temasDoEventoSelecionado.some((tema) => tema.id === projetoSelecionado.tema?.id) && (
                    <option value={projetoSelecionado.tema.id}>{projetoSelecionado.tema.nome}</option>
                  )}
                  {temasDoEventoSelecionado.map((tema) => (
                    <option key={tema.id} value={tema.id}>{tema.nome}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="rounded-2xl border border-slate-200 p-4">
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">Integrantes</p>
              <p className="mt-1 text-xs font-semibold text-slate-400">Autor não entra em alunosIds. Grupo total: {formProjeto.alunosIds.length + 1}/7.</p>
              <div className="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1">
                {alunos.length === 0 ? (
                  <p className="text-sm font-semibold text-slate-500">Lista de alunos indisponível.</p>
                ) : (
                  alunos
                    .filter((aluno) => String(aluno.id) !== String(projetoSelecionado.alunoAutor?.id))
                    .map((aluno) => (
                      <label key={aluno.id} className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-slate-100 bg-slate-50 px-3 py-2 transition hover:bg-sectec-50">
                        <span>
                          <span className="block text-sm font-black text-slate-800">{aluno.nome}</span>
                          <span className="block text-xs font-semibold text-slate-500">{aluno.turma ?? "-"} {aluno.ano ? `· ${aluno.ano}` : ""}</span>
                        </span>
                        <input
                          type="checkbox"
                          checked={formProjeto.alunosIds.includes(Number(aluno.id))}
                          onChange={() => alternarAlunoIntegrante(Number(aluno.id))}
                          className="h-4 w-4 accent-sectec-700"
                        />
                      </label>
                    ))
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
              Banner real e troca direta de orientador dependem de suporte no backend.
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
              <button type="button" onClick={() => setEdicaoAberta(false)} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-black text-slate-700 transition hover:bg-slate-50">
                <X size={16} /> Cancelar
              </button>
              <button type="button" onClick={salvarProjeto} disabled={salvando} className="inline-flex cursor-pointer items-center gap-2 rounded-2xl bg-sectec-700 px-4 py-3 text-sm font-black text-white transition hover:bg-sectec-800 disabled:cursor-not-allowed disabled:opacity-60">
                {salvando ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </div>
        )}
      </PainelDetalhes>
    </AdminPageShell>
  );
}

function Administrador() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const projetosResumoRef = useRef<HTMLElement | null>(null);
  const [carregandoDashboard, setCarregandoDashboard] = useState(true);
  const [erroDashboard, setErroDashboard] = useState("");
  const [eventoVigente, setEventoVigente] = useState<EventoApi | null>(null);
  const [relatorioAlunosSemProjeto, setRelatorioAlunosSemProjeto] = useState<AlunosSemProjetoResponse>({});
  const [relatorioComissaoPorEvento, setRelatorioComissaoPorEvento] = useState<ComissaoPorEventoResponse>({});
  const [relatorioEixos, setRelatorioEixos] = useState<EixosPorEventoResponse>({});
  const [relatorioProjetosPorOrientador, setRelatorioProjetosPorOrientador] = useState<ProjetosPorOrientadorResponse>([]);
  const [relatorioProjetosPorTurma, setRelatorioProjetosPorTurma] = useState<ProjetosPorTurmaResponse>({});

  async function requestOrDefault<T>(path: string, fallback: T) {
    try {
      return await apiRequest<T>(path);
    } catch {
      return fallback;
    }
  }

  async function carregarDashboard() {
    setCarregandoDashboard(true);
    setErroDashboard("");

    try {
      const eventosResponse = await requestOrDefault<EventoApi[]>("/evento", []);
      let vigente = await requestOrDefault<EventoApi | null>("/evento/atual/vigente", null);

      if (!vigente?.id) {
        vigente = buscarEventoDoAnoAtual(eventosResponse);
      }

      const [
        alunosSemProjetoResponse,
        comissaoPorEventoResponse,
        eixosResponse,
        projetosPorOrientadorResponse,
        projetosPorTurmaResponse,
      ] = await Promise.all([
        requestOrDefault<AlunosSemProjetoResponse>("/relatorio/alunos-sem-projeto", {}),
        requestOrDefault<ComissaoPorEventoResponse>("/relatorio/comissao-por-evento", {}),
        requestOrDefault<EixosPorEventoResponse>("/relatorio/eixos-tematicos", {}),
        requestOrDefault<ProjetosPorOrientadorResponse>("/relatorio/projetos-por-orientador", []),
        requestOrDefault<ProjetosPorTurmaResponse>("/relatorio/projetos-por-turma", {}),
      ]);
      setEventoVigente(vigente);
      setRelatorioAlunosSemProjeto(alunosSemProjetoResponse);
      setRelatorioComissaoPorEvento(comissaoPorEventoResponse);
      setRelatorioEixos(eixosResponse);
      setRelatorioProjetosPorOrientador(projetosPorOrientadorResponse);
      setRelatorioProjetosPorTurma(projetosPorTurmaResponse);
    } catch (error) {
      const erro = mensagemErroApi(error, "Não foi possível carregar o painel da coordenação.");
      setErroDashboard(`${erro.amigavel} Erro técnico: ${erro.tecnico}`);
    } finally {
      setCarregandoDashboard(false);
    }
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  const faseAtualReal = getFaseAtual(eventoVigente);
  const totalAlunosSemProjetoRelatorio = Object.values(relatorioAlunosSemProjeto).reduce((total, turma) => total + turma.length, 0);
  const turmasAfetadasRelatorio = Object.values(relatorioAlunosSemProjeto).filter((turma) => turma.length > 0).length;
  const eventosComComissaoRelatorio = Object.keys(relatorioComissaoPorEvento).length;
  const totalMembrosComissaoRelatorio = Object.values(relatorioComissaoPorEvento).reduce((total, evento) => total + evento.alunos.length, 0);
  const resumoEixosRelatorio = Object.values(relatorioEixos).reduce(
    (acc, evento) => {
      evento.eixos.forEach((eixo) => {
        acc.eixos += 1;
        acc.projetos += eixo.totalProjetos;
        acc.pendentes += eixo.projetosPendentes;
        acc.aceitos += eixo.projetosAceitos;
      });
      return acc;
    },
    { eixos: 0, projetos: 0, pendentes: 0, aceitos: 0 },
  );
  const totalProjetosAceitosOrientador = relatorioProjetosPorOrientador.reduce((total, orientador) => total + orientador.totalProjetosAceitos, 0);
  const resumoTurmasRelatorio = Object.values(relatorioProjetosPorTurma).reduce(
    (acc, turma) => {
      acc.criados += turma.totalCriados;
      acc.aprovados += turma.totalAprovados;
      return acc;
    },
    { criados: 0, aprovados: 0 },
  );
  const ultimaAtualizacao = new Date().toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const irParaRelatorio = (aba: string) => {
    navigate(`/dashboard/coordenacao/relatorio-alunos?aba=${aba}`);
  };

  function DashboardCard({
    icon,
    title,
    value,
    subtitle,
    children,
    cardRef,
    index = 0,
    onClick,
  }: {
    icon: React.ReactNode;
    title: string;
    value: string | number;
    subtitle?: string;
    children?: React.ReactNode;
    cardRef?: React.Ref<HTMLElement>;
    index?: number;
    onClick?: () => void;
  }) {
    return (
      <motion.article
        ref={cardRef}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -3 }}
        transition={{ duration: 0.22, delay: index * 0.04 }}
        onClick={onClick}
        className={`rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:shadow-md ${
          onClick ? "cursor-pointer" : ""
        }`}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">{title}</p>
            <strong className="mt-3 block text-2xl font-black text-slate-950">{value}</strong>
            {subtitle && <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">{subtitle}</p>}
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sectec-50 text-sectec-700">
            {icon}
          </span>
        </div>
        {children && <div className="mt-5 space-y-2">{children}</div>}
      </motion.article>
    );
  }

  function DetailItem({ label, value }: { label: string; value: string | number }) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-slate-50 px-3 py-2 text-sm">
        <span className="font-semibold text-slate-500">{label}</span>
        <span className="text-right font-black text-slate-800">{value}</span>
      </div>
    );
  }

  function QuickAction({ label, onClick }: { label: string; onClick: () => void }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-left text-sm font-black text-slate-700 shadow-sm transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-800"
      >
        {label}
        <ArrowRight size={16} />
      </button>
    );
  }

  if (pathname.endsWith("/turmas")) return <TurmasCoordenacao />;
  if (pathname.endsWith("/frequencia")) return <FrequenciaCoordenacao />;
  if (pathname.endsWith("/notas")) return <NotasCoordenacao />;
  if (pathname.endsWith("/usuarios")) return <UsuariosCoordenacao />;
  if (pathname.endsWith("/eventos")) return <EventosCoordenacao />;
  if (pathname.endsWith("/projetos")) return <ProjetosCoordenacao />;

  return (
    <MainLayout userRole="coordenador">
      <main className="min-h-screen bg-slate-50 px-4 py-5 sm:px-7 sm:py-7">
        <div className="mx-auto w-full max-w-[1500px] space-y-5">
          <motion.section
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28 }}
            className="rounded-[2rem] bg-gradient-to-br from-emerald-800 via-emerald-700 to-slate-950 p-6 text-white shadow-sm sm:p-8"
          >
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <span className="inline-flex rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-black uppercase tracking-[0.18em] text-white/75">
                  Coordenação SECTEC
                </span>
                <h1 className="mt-5 text-3xl font-black tracking-tight sm:text-4xl">Painel da Coordenação</h1>
                <p className="mt-3 max-w-3xl text-sm font-medium leading-6 text-white/70 sm:text-base">
                  Resumo operacional da SECTEC com evento vigente, usuários, projetos e pendências.
                </p>
                <p className="mt-4 text-xs font-black uppercase tracking-widest text-white/45">
                  Última atualização: {ultimaAtualizacao}
                </p>
              </div>

              <button
                type="button"
                onClick={carregarDashboard}
                disabled={carregandoDashboard}
                className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white px-5 py-3 text-sm font-black text-emerald-800 shadow-sm transition hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {carregandoDashboard ? <Loader2 className="animate-spin" size={17} /> : <RefreshCw size={17} />}
                {carregandoDashboard ? "Atualizando..." : "Atualizar dados"}
              </button>
            </div>

            {erroDashboard && (
              <div className="mt-5 rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white/85">
                {erroDashboard}
              </div>
            )}
          </motion.section>

          <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <DashboardCard
              index={0}
              icon={<AlertTriangle size={22} />}
              title="Alunos sem projeto"
              value={totalAlunosSemProjetoRelatorio}
              subtitle={`${turmasAfetadasRelatorio} turma(s) afetada(s)`}
              onClick={() => irParaRelatorio("alunos-sem-projeto")}
            >
              <DetailItem label="Fonte" value="/relatorio/alunos-sem-projeto" />
              <DetailItem label="Ação" value="Ver relatório" />
            </DashboardCard>

            <DashboardCard
              index={1}
              icon={<UsersRound size={22} />}
              title="Comissão por evento"
              value={eventosComComissaoRelatorio}
              subtitle={`${totalMembrosComissaoRelatorio} membro(s) registrados`}
              onClick={() => irParaRelatorio("comissao-por-evento")}
            >
              <DetailItem label="Histórico" value="Real" />
              <DetailItem label="Ação" value="Ver histórico" />
            </DashboardCard>

            <DashboardCard
              index={2}
              icon={<ClipboardCheck size={22} />}
              title="Eixos temáticos"
              value={resumoEixosRelatorio.eixos}
              subtitle={`${resumoEixosRelatorio.projetos} projetos mapeados`}
              onClick={() => irParaRelatorio("eixos-tematicos")}
            >
              <DetailItem label="Pendentes" value={resumoEixosRelatorio.pendentes} />
              <DetailItem label="Aceitos" value={resumoEixosRelatorio.aceitos} />
            </DashboardCard>

            <DashboardCard
              index={3}
              cardRef={projetosResumoRef}
              icon={<FolderKanban size={22} />}
              title="Projetos por orientador"
              value={relatorioProjetosPorOrientador.length}
              subtitle={`${totalProjetosAceitosOrientador} projeto(s) aceitos`}
              onClick={() => irParaRelatorio("projetos-por-orientador")}
            >
              <DetailItem label="Orientadores" value={relatorioProjetosPorOrientador.length} />
              <DetailItem label="Ação" value="Ver distribuição" />
            </DashboardCard>

            <DashboardCard
              index={4}
              icon={<CalendarRange size={22} />}
              title="Projetos por turma"
              value={Object.keys(relatorioProjetosPorTurma).length}
              subtitle={`${resumoTurmasRelatorio.criados} criados · ${resumoTurmasRelatorio.aprovados} aprovados`}
              onClick={() => irParaRelatorio("projetos-por-turma")}
            >
              <DetailItem label="Turmas" value={Object.keys(relatorioProjetosPorTurma).length} />
              <DetailItem label="Ação" value="Ver relatório" />
            </DashboardCard>
          </section>

          <section className="grid gap-5 lg:grid-cols-[1fr_0.8fr]">
            <DashboardCard icon={<ClipboardCheck size={22} />} title="Fase atual da SECTEC" value={faseAtualReal} subtitle={eventoVigente?.titulo ?? "Sem evento vigente encontrado"}>
              {getFasesEvento(eventoVigente ?? ({} as EventoApi)).map((fase) => (
                <DetailItem key={fase.label} label={fase.label} value={formatarPeriodo(fase.periodo)} />
              ))}
            </DashboardCard>

            <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Ações rápidas</p>
                  <h2 className="mt-3 text-xl font-black text-slate-950">Ir para gestão</h2>
                  <p className="mt-2 text-sm font-semibold leading-5 text-slate-500">Atalhos para áreas existentes dentro da coordenação.</p>
                </div>
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-sectec-50 text-sectec-700">
                  <FileWarning size={22} />
                </span>
              </div>

              <div className="mt-5 grid gap-2 sm:grid-cols-2">
                <QuickAction label="Alunos sem projeto" onClick={() => irParaRelatorio("alunos-sem-projeto")} />
                <QuickAction label="Comissão por evento" onClick={() => irParaRelatorio("comissao-por-evento")} />
                <QuickAction label="Eixos temáticos" onClick={() => irParaRelatorio("eixos-tematicos")} />
                <QuickAction label="Projetos por turma" onClick={() => irParaRelatorio("projetos-por-turma")} />
              </div>
            </section>
          </section>
        </div>
      </main>
    </MainLayout>
  );
}

export default Administrador;
