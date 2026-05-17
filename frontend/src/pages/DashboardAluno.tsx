import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { Plus, FlaskConical, Users, ChevronRight, X, Search, UserPlus, UserMinus, ChevronDown, Upload, Video, FileText, CheckCircle, Lock, TriangleAlert, Calendar, Pencil } from "lucide-react";
import { MainLayout } from "../componentes/SideBarUniversal";
import Swal from "sweetalert2";
import { apiRequest, type UsuarioApi } from "../lib/api";

type FaseAtual = 1 | 2 | 3 | 4;
type Etapa = 1 | 2 | 3;
type StatusProjeto = "Rascunho" | "Aguardando Aprovação" | "Aceito" | "Recusado" | "Em Desenvolvimento" | "Submetido" | "Avaliado";
type Membro = { id: string; nome: string; sala: string; turma?: string };
type Orientador = { id: string; nome: string; disciplina: string; temasIds: string[] };
type Projeto = {
  id: string; titulo: string; descricao: string; eixo: string; temaId?: number;
  membros: Membro[]; orientadorId: string; status: StatusProjeto; linkYoutube?: string;
  autorId?: string; // 👈 adiciona aqui
};
type TemaApi = {
  id: string | number;
  nome: string;
  professorId?: string | number;
  orientadorId?: string | number;
  professor?: UsuarioApi;
  orientador?: UsuarioApi;
  professores?: UsuarioApi[];
  orientadores?: UsuarioApi[];
};
type PeriodoEventoApi = {
  inicio?: string | null;
  fim?: string | null;
};
type EventoApi = {
  id: string | number;
  prazoInicial?: string | null;
  prazoFinal?: string | null;
  inscricao?: PeriodoEventoApi | null;
  aceitacao?: PeriodoEventoApi | null;
  submissao?: PeriodoEventoApi | null;
  avaliacao?: PeriodoEventoApi | null;
  temas?: TemaApi[];
};


// INTERFACE ATUALIZADA: Agora com tema (objeto) ao invés de temaId
type ProjetoApi = {
  id: string | number;
  titulo: string;
  descricao: string;
  temaId?: string | number;
  tema?: { id: string | number; nome: string }; // 👈
  alunoAutor?: UsuarioApi;
  projetoAlunos?: Array<{ id: string | number; aluno?: UsuarioApi }>;
  orientadores?: Array<{
    id: string | number;
    status: "pendente" | "aceito" | "recusado";
    orientador?: UsuarioApi;
  }>;
};

type Material = {
  id: number;
  tipo: string;
  status: 'em_analise' | 'aprovado' | 'recusado';
  conteudo: string;
  opiniao: string;
  criadoEm: string;
  driveLink?: string | null; // 👈 adiciona
};

const FASE_PADRAO: FaseAtual = 1;
const FASE_LABELS: Record<FaseAtual, string> = { 1: "Inscrição", 2: "Desenvolvimento", 3: "Submissão", 4: "Avaliação" };
const STATUS_STYLE: Record<StatusProjeto, string> = {
  "Rascunho": "bg-slate-100 text-slate-600",
  "Aguardando Aprovação": "bg-yellow-100 text-yellow-700",
  "Aceito": "bg-sectec-100 text-sectec-700",
  "Recusado": "bg-red-100 text-red-700",
  "Em Desenvolvimento": "bg-blue-100 text-blue-700",
  "Submetido": "bg-purple-100 text-purple-700",
  "Avaliado": "bg-orange-100 text-orange-700",
};
const FASES_FEIRA = [
  { fase: 1 as FaseAtual, label: "Inscrição", data: "01/05 – 15/05", descricao: "Cadastro do projeto e da equipe" },
  { fase: 2 as FaseAtual, label: "Desenvolvimento", data: "16/05 – 30/06", descricao: "Desenvolvimento e orientação" },
  { fase: 3 as FaseAtual, label: "Submissão", data: "01/07 – 10/07", descricao: "Envio do relatório e vídeo" },
  { fase: 4 as FaseAtual, label: "Avaliação", data: "15/07 – 20/07", descricao: "Banca examinadora" },
];
const STATUS_TOOLTIP: Record<StatusProjeto, string> = {
  "Rascunho": "Projeto salvo, mas ainda não enviado para análise.",
  "Aguardando Aprovação": "Enviado! Seu orientador irá analisar e aprovar ou recusar.",
  "Aceito": "Orientador aprovou! Você já pode iniciar o desenvolvimento.",
  "Recusado": "O orientador recusou o projeto. Entre em contato para saber o motivo.",
  "Em Desenvolvimento": "Projeto em andamento. Continue com sua pesquisa!",
  "Submetido": "Relatório e vídeo enviados. Aguarde a avaliação da banca.",
  "Avaliado": "A banca examinadora já avaliou seu projeto.",
};
const SUBMISSAO_TOOLTIP = "Fase 3: envio do relatório final em PDF e link do vídeo no YouTube.";

const MIN_MEMBROS = 3;
const MAX_MEMBROS = 7;

function getUsuarioLogado(): Membro {
  const nome = localStorage.getItem('nome') ?? 'Aluno';
  const id = localStorage.getItem('userId') ?? 'me';
  return { id, nome, sala: '' };
}
const ALUNO_LOGADO = getUsuarioLogado();

function membroFromUsuario(usuario?: UsuarioApi): Membro | null {
  if (!usuario) return null;
  return {
    id: String(usuario.id),
    nome: usuario.nome,
    sala: usuario.ano ? String(usuario.ano) : "",
    turma: usuario.turma ?? "",
  };
}

function normalizarTurmaCampo(valor?: string) {
  return (valor ?? "").trim().toLowerCase();
}

function getReferenciaTurmaEquipe(membros: Membro[]) {
  return membros.find((membro) => membro.sala || membro.turma) ?? null;
}

function pertenceMesmaTurmaEAno(aluno: Membro, referencia: Membro | null) {
  if (!referencia) return true;

  const salaReferencia = normalizarTurmaCampo(referencia.sala);
  const turmaReferencia = normalizarTurmaCampo(referencia.turma);
  const salaAluno = normalizarTurmaCampo(aluno.sala);
  const turmaAluno = normalizarTurmaCampo(aluno.turma);

  const mesmaSala = !salaReferencia || salaAluno === salaReferencia;
  const mesmaTurma = !turmaReferencia || turmaAluno === turmaReferencia;

  return mesmaSala && mesmaTurma;
}

function getMembrosForaDaTurma(membros: Membro[]) {
  const referencia = getReferenciaTurmaEquipe(membros);
  if (!referencia) return [];
  return membros.filter((membro) => !pertenceMesmaTurmaEAno(membro, referencia));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char] ?? char);
}

function mostrarAlertaTurma({ titulo, texto, detalhe }: { titulo: string; texto: string; detalhe?: string }) {
  Swal.fire({
    html: `
        <div class="sectec-alert-content">
          <div class="sectec-alert-icon" aria-hidden="true">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M12 8v5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>
              <circle cx="12" cy="17" r="1.2" fill="currentColor"/>
              <path d="M10.3 4.2 2.4 18a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 4.2a2 2 0 0 0-3.4 0Z" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round"/>
            </svg>
          </div>
          <p class="sectec-alert-kicker">Regra da equipe</p>
          <h2>${escapeHtml(titulo)}</h2>
          <p>${escapeHtml(texto)}</p>
          ${detalhe ? `<div class="sectec-alert-detail">${escapeHtml(detalhe)}</div>` : ""}
        </div>
      `,
    showConfirmButton: true,
    confirmButtonText: "Entendi",
    buttonsStyling: false,
    background: "#ffffff",
    width: "min(420px, 92vw)",
    padding: 0,
    customClass: {
      popup: "sectec-alert-popup",
      confirmButton: "sectec-alert-confirm",
    },
  });
}

function getOrientadorIdsDoEixo(eixo?: TemaApi | null) {
  if (!eixo) return [];

  return [
    eixo.professorId,
    eixo.orientadorId,
    eixo.professor?.id,
    eixo.orientador?.id,
    ...(eixo.professores?.map((professor) => professor.id) ?? []),
    ...(eixo.orientadores?.map((orientador) => orientador.id) ?? []),
  ]
    .filter((id): id is string | number => id !== undefined && id !== null)
    .map(String);
}

function orientadorAtendeEixo(orientador: Orientador, eixoId: string, eixo?: TemaApi | null) {
  return orientador.temasIds.includes(eixoId) || getOrientadorIdsDoEixo(eixo).includes(orientador.id);
}

function statusFromProjetoApi(projeto: ProjetoApi): StatusProjeto {
  const orientacoes = projeto.orientadores ?? [];
  if (orientacoes.some((orientacao) => orientacao.status === "aceito")) return "Aceito";
  if (orientacoes.length > 0 && orientacoes.every((orientacao) => orientacao.status === "recusado")) return "Recusado";
  return "Aguardando Aprovação";
}

function parseEventoDate(value?: string | null, endOfDay = false) {
  if (!value) return null;

  const dateOnly = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnly) {
    const [, year, month, day] = dateOnly;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    if (endOfDay) date.setHours(23, 59, 59, 999);
    return date;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
}

function formatarPeriodoEvento(periodo?: PeriodoEventoApi | null) {
  const inicio = parseEventoDate(periodo?.inicio);
  const fim = parseEventoDate(periodo?.fim);

  if (!inicio || !fim) return "Não definido";

  return `${inicio.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })} – ${fim.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}`;
}

function getFaseAtualEvento(evento?: EventoApi | null): FaseAtual {
  if (!evento) return FASE_PADRAO;

  const hoje = new Date();
  const fases = [
    { fase: 1 as FaseAtual, periodo: evento.inscricao },
    { fase: 2 as FaseAtual, periodo: evento.aceitacao },
    { fase: 3 as FaseAtual, periodo: evento.submissao },
    { fase: 4 as FaseAtual, periodo: evento.avaliacao },
  ];

  const faseEmAndamento = fases.find(({ periodo }) => {
    const inicio = parseEventoDate(periodo?.inicio);
    const fim = parseEventoDate(periodo?.fim, true);
    return inicio && fim && hoje >= inicio && hoje <= fim;
  });

  if (faseEmAndamento) return faseEmAndamento.fase;

  const ultimaEncerrada = [...fases].reverse().find(({ periodo }) => {
    const fim = parseEventoDate(periodo?.fim, true);
    return fim && hoje > fim;
  });

  return ultimaEncerrada?.fase ?? FASE_PADRAO;
}

function buildFasesFeira(evento?: EventoApi | null): typeof FASES_FEIRA {
  if (!evento) return FASES_FEIRA;

  return [
    { fase: 1 as FaseAtual, label: "Inscrição", data: formatarPeriodoEvento(evento.inscricao), descricao: "Cadastro do projeto e da equipe" },
    { fase: 2 as FaseAtual, label: "Desenvolvimento", data: formatarPeriodoEvento(evento.aceitacao), descricao: "Desenvolvimento e orientação" },
    { fase: 3 as FaseAtual, label: "Submissão", data: formatarPeriodoEvento(evento.submissao), descricao: "Envio do relatório e vídeo" },
    { fase: 4 as FaseAtual, label: "Avaliação", data: formatarPeriodoEvento(evento.avaliacao), descricao: "Banca examinadora" },
  ];
}

// FUNÇÃO ATUALIZADA: Agora usa o objeto tema diretamente da API
function mapProjetoApiToProjeto(projeto: ProjetoApi, temasDisponiveis: TemaApi[] = []): Projeto {
  const membrosMap = new Map<string, Membro>();

  // 👇 autor primeiro
  const autor = membroFromUsuario(projeto.alunoAutor);
  if (autor) membrosMap.set(autor.id, autor);

  // 👇 depois os integrantes
  projeto.projetoAlunos?.forEach((item) => {
    const membro = membroFromUsuario(item.aluno);
    if (membro && !membrosMap.has(membro.id)) {
      membrosMap.set(membro.id, membro);
    }
  });

  const orientacaoAceita = projeto.orientadores?.find((item) => item.status === "aceito");
  const primeiraOrientacao = orientacaoAceita ?? projeto.orientadores?.[0];
  const temaId = projeto.temaId ? Number(projeto.temaId) : projeto.tema?.id ? Number(projeto.tema.id) : undefined;
  const temaNome =
    projeto.tema?.nome ??
    temasDisponiveis.find((item) => Number(item.id) === temaId)?.nome ??
    (temaId ? `Eixo #${temaId}` : "Eixo não informado");

  return {
    id: String(projeto.id),
    titulo: projeto.titulo,
    descricao: projeto.descricao,
    eixo: temaNome,
    temaId,
    membros: Array.from(membrosMap.values()),
    // 👇 salva o id do autor para identificar o líder corretamente
    orientadorId: primeiraOrientacao?.orientador?.id ? String(primeiraOrientacao.orientador.id) : "",
    status: statusFromProjetoApi(projeto),
    autorId: autor?.id, // 👈 adiciona isso
  };
}

function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  return (
    <div className="relative group inline-flex">
      {children}
      <div className="absolute bottom-full left-1/2 z-[9999] mb-2 w-64 -translate-x-1/2 invisible opacity-0 transition-all duration-200 pointer-events-none group-hover:visible group-hover:opacity-100">
        <div className="rounded-xl bg-slate-900 px-3 py-2 text-center text-xs leading-relaxed text-white shadow-xl">
          {text}
          <div className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    </div>
  );
}

function FeiraTimeline({ faseAtual, fases }: { faseAtual: FaseAtual; fases: typeof FASES_FEIRA }) {
  return (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-5">
        <Calendar size={14} className="text-sectec-600" />
        <h3 className="min-w-0 break-words text-sm font-semibold text-slate-700">Cronograma da Feira</h3>
      </div>
      <div className="relative">
        <div className="absolute left-3.5 top-3 bottom-3 w-px bg-slate-200" />
        <div className="space-y-5">
          {fases.map(({ fase, label, data, descricao }) => {
            const done = fase < faseAtual;
            const active = fase === faseAtual;
            const pending = fase > faseAtual;
            return (
              <div key={fase} className="flex gap-4 relative">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 text-xs font-bold border-2
                    ${done ? "bg-sectec-600 border-sectec-600 text-white" : active ? "bg-white border-sectec-600 text-sectec-700" : "bg-white border-slate-200 text-slate-400"}`}>
                  {done ? "✓" : fase}
                </div>
                <div className="min-w-0 pb-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className={`break-words text-sm font-semibold ${active ? "text-sectec-700" : pending ? "text-slate-400" : "text-slate-700"}`}>{label}</p>
                    {active && <span className="text-[10px] font-semibold bg-sectec-100 text-sectec-700 px-2 py-0.5 rounded-full">Atual</span>}
                  </div>
                  <p className={`mt-0.5 break-words text-xs ${pending ? "text-slate-300" : "text-slate-400"}`}>{data}</p>
                  <p className={`mt-0.5 break-words text-xs ${pending ? "text-slate-300" : "text-slate-500"}`}>{descricao}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function Dashboard() {
  const [projeto, setProjeto] = useState<Projeto | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [editandoProjeto, setEditandoProjeto] = useState(false);
  const [descricaoExpandida, setDescricaoExpandida] = useState(false);
  const [aba, setAba] = useState<"painel" | "submissao">("painel");

  // ── Form states ──
  const [etapa, setEtapa] = useState<Etapa>(1);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [eixo, setEixo] = useState("");
  const [solicitacoes, setSolicitacoes] = useState<string[]>([]);
  const [membros, setMembros] = useState<Membro[]>([ALUNO_LOGADO]);
  const [buscaAluno, setBuscaAluno] = useState("");
  const [filtrSala, setFiltrSala] = useState("todas");
  const [filtrTurma, setFiltrTurma] = useState("todas");

  // ── Submissão ──
  const [linkYoutube, setLinkYoutube] = useState("");
  const [arquivoPdf, setArquivoPdf] = useState<File | null>(null);
  const inputPdfRef = useRef<HTMLInputElement>(null);
  const [criando, setCriando] = useState(false);

  // ── API data ──
  const [alunosDisponiveis, setAlunosDisponiveis] = useState<Membro[]>([]);
  const [alunosOcupadosIds, setAlunosOcupadosIds] = useState<string[]>([]);
  const [eixosDisponiveis, setEixosDisponiveis] = useState<TemaApi[]>([]);
  const [orientadoresDisponiveis, setOrientadoresDisponiveis] = useState<Orientador[]>([]);
  const [eventoAtual, setEventoAtual] = useState<EventoApi | null>(null);
  const [carregandoDados, setCarregandoDados] = useState(true);
  const [erroDados, setErroDados] = useState("");

  const avisoSenhaDispensadoKey = `passwordNoticeDismissed:${localStorage.getItem("userId") ?? "me"}`;
  const [avisoSenhaDispensado, setAvisoSenhaDispensado] = useState(
    () => localStorage.getItem(avisoSenhaDispensadoKey) === "true"
  );

  const [materiais, setMateriais] = useState<Material[]>([]);
  const [enviandoMaterial, setEnviandoMaterial] = useState(false);

  const ehAutor = projeto?.autorId === ALUNO_LOGADO.id;

  useEffect(() => {
    let active = true;
    async function carregarDados() {
      setCarregandoDados(true);
      setErroDados("");
      try {
        const [alunos, orientadores, ocupadosIds, eventos, eventoVigente, meuProjeto] = await Promise.all([
          apiRequest<UsuarioApi[]>("/users/alunos"),
          apiRequest<UsuarioApi[]>("/users/orientadores"),
          apiRequest<Array<string | number>>("/projetos/alunos-ocupados").catch(() => []),
          apiRequest<EventoApi[]>("/evento").catch(() => []),
          apiRequest<EventoApi | null>("/evento/atual/vigente").catch(() => null),
          apiRequest<ProjetoApi | null>("/projetos/meu-projeto").catch(() => null),
        ]);
        if (!active) return;

        // Debug: verificar o que a API retornou
        if (meuProjeto) {
          console.log('📦 Projeto retornado da API:', meuProjeto);
          console.log('📝 Tema do projeto:', meuProjeto.tema);
          console.log('📛 Nome do tema:', meuProjeto.tema?.nome);
          console.log('📦 Projeto completo:', meuProjeto);       // 👈 adiciona
          console.log('👥 projetoAlunos:', meuProjeto.projetoAlunos); // 👈 adiciona
          console.log('👤 alunoAutor:', meuProjeto.alunoAutor);  // 👈 adiciona
        }

        const eventoAtualApi = eventoVigente ?? [...eventos].sort((a, b) => Number(b.id) - Number(a.id))[0] ?? null;
        const temas = eventoAtualApi?.temas ?? [];
        const ocupadosNormalizados = ocupadosIds.map(String);
        const alunoLogadoApi = membroFromUsuario(alunos.find((a) => String(a.id) === localStorage.getItem('userId')));
        setEventoAtual(eventoAtualApi);
        setEixosDisponiveis(temas);
        setAlunosOcupadosIds(ocupadosNormalizados);
        if (alunoLogadoApi) {
          setMembros((prev) =>
            prev.map((membro) =>
              membro.id === alunoLogadoApi.id
                ? { ...membro, sala: alunoLogadoApi.sala, turma: alunoLogadoApi.turma }
                : membro
            )
          );
        }
        setAlunosDisponiveis(
          alunos
            .filter((a) => String(a.id) !== localStorage.getItem('userId') && !ocupadosNormalizados.includes(String(a.id)))
            .map((a) => membroFromUsuario(a))
            .filter((a): a is Membro => Boolean(a))
        );
        setOrientadoresDisponiveis(
          orientadores.map((o) => ({
            id: String(o.id),
            nome: o.nome,
            disciplina: o.email_institucional ?? 'Orientador',
            temasIds: (o.temasSelecionados ?? []).map((tema) => String(tema.id)),
          }))
        );

        // ATUALIZADO: Agora passa apenas o projeto, sem o parâmetro temas
        setProjeto(meuProjeto ? mapProjetoApiToProjeto(meuProjeto, temas) : null);
        if (meuProjeto) {
          apiRequest<Material[]>(`/materiais/projeto/${meuProjeto.id}`)
            .then(setMateriais)
            .catch(() => { });
        }
      } catch (error) {
        if (!active) return;
        setErroDados(
          error instanceof Error ? error.message : "Não foi possível carregar alunos e orientadores."
        );
      } finally {
        if (active) setCarregandoDados(false);
      }
    }
    carregarDados();
    return () => { active = false; };
  }, []);

  // ── Computed ──
  const salas = ["todas", ...Array.from(new Set(alunosDisponiveis.map((a) => a.sala).filter(Boolean))).sort()];
  const turmas = ["todas", ...Array.from(new Set(alunosDisponiveis.map((a) => a.turma ?? "").filter(Boolean))).sort()];

  const eixoSelecionado = eixosDisponiveis.find((item) => String(item.id) === eixo);
  const orientadoresFiltradosPorEixo = eixo
    ? orientadoresDisponiveis.filter((orientadorItem) => orientadorAtendeEixo(orientadorItem, eixo, eixoSelecionado))
    : [];
  const referenciaTurmaEquipe = getReferenciaTurmaEquipe(membros);

  const alunosFiltrados = alunosDisponiveis.filter((a) => {
    const jaAdicionado = membros.some((m) => m.id === a.id);
    const jaTemEquipe = alunosOcupadosIds.includes(a.id);
    const bateEquipe = pertenceMesmaTurmaEAno(a, referenciaTurmaEquipe);
    const bateNome = a.nome.toLowerCase().includes(buscaAluno.toLowerCase());
    const bateSala = filtrSala === "todas" || a.sala === filtrSala;
    const bateTurma = filtrTurma === "todas" || (a.turma ?? "") === filtrTurma;
    return !jaAdicionado && !jaTemEquipe && bateEquipe && bateNome && bateSala && bateTurma;
  });

  const orientador = orientadoresDisponiveis.find((o) => o.id === solicitacoes[0]);
  const faseAtual = getFaseAtualEvento(eventoAtual);
  const fasesFeira = buildFasesFeira(eventoAtual);
  const projetoAceito = projeto?.status === "Aceito" || projeto?.status === "Em Desenvolvimento";
  const submissaoDesbloqueada = projetoAceito && faseAtual === 3 && projeto?.status !== "Submetido";
  const youtubeValido = linkYoutube === "" || /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{11}/.test(linkYoutube);
  const passwordChangedKey = `passwordChangedAt:${localStorage.getItem("userId") ?? "me"}`;
  const deveMostrarAvisoSenha = !localStorage.getItem(passwordChangedKey) && !avisoSenhaDispensado;

  const podeAvancarEtapa1 = titulo.trim().length > 0 && descricao.trim().length >= 30 && eixo !== "";
  const podeAvancarEtapa2 = solicitacoes.length > 0;

  function dispensarAvisoSenha() {
    localStorage.setItem(avisoSenhaDispensadoKey, "true");
    setAvisoSenhaDispensado(true);
  }

  function fecharModal() {
    setModalAberto(false);
    setEditandoProjeto(false);
    setDescricaoExpandida(false);
    setEtapa(1);
    setTitulo(""); setDescricao(""); setEixo("");
    setSolicitacoes([]);
    setMembros([ALUNO_LOGADO]);
    setBuscaAluno(""); setFiltrSala("todas"); setFiltrTurma("todas");
  }

  function handleEixoChange(eixoId: string) {
    setEixo(eixoId);
    const proximoEixo = eixosDisponiveis.find((item) => String(item.id) === eixoId);
    const orientadoresDoEixo = orientadoresDisponiveis.filter((orientadorItem) =>
      orientadorAtendeEixo(orientadorItem, eixoId, proximoEixo)
    );
    setSolicitacoes(orientadoresDoEixo.length === 1 ? [orientadoresDoEixo[0].id] : []);
  }

  function abrirEdicaoProjeto() {
    if (!projeto) return;
    setEditandoProjeto(true);
    setEtapa(1);
    setTitulo(projeto.titulo);
    setDescricao(projeto.descricao);
    setEixo(projeto.temaId ? String(projeto.temaId) : "");
    setSolicitacoes(projeto.orientadorId ? [projeto.orientadorId] : []);
    setMembros(projeto.membros);
    setBuscaAluno(""); setFiltrSala("todas"); setFiltrTurma("todas");
    setModalAberto(true);
  }

  function toggleSolicitacao(id: string) {
    setSolicitacoes((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
          ? [...prev, id]
          : prev
    );
  }

  function adicionarMembro(aluno: Membro) {
    if (!pertenceMesmaTurmaEAno(aluno, referenciaTurmaEquipe)) {
      mostrarAlertaTurma({
        titulo: "Turma diferente",
        texto: "A equipe só pode ter alunos da mesma turma e do mesmo ano.",
        detalhe: `${aluno.nome} pertence a outra turma.`,
      });
      return;
    }

    setMembros((prev) => [...prev, aluno]);
  }

  async function handleCriarProjeto() {
    const membrosForaDaTurma = getMembrosForaDaTurma(membros);
    if (membrosForaDaTurma.length > 0) {
      mostrarAlertaTurma({
        titulo: "Equipe com turmas diferentes",
        texto: "Revise os integrantes antes de criar o projeto.",
        detalhe: `Remova da equipe: ${membrosForaDaTurma.map((membro) => membro.nome).join(", ")}.`,
      });
      return;
    }

    if (membros.length < MIN_MEMBROS) {
      Swal.fire({
        html: `
            <div style="display:flex;flex-direction:column;align-items:center;gap:12px;padding:8px 0">
              <div style="width:52px;height:52px;border-radius:14px;background:#f0fdf4;border:2px solid #a7f3d0;display:flex;align-items:center;justify-content:center">
                <svg width="24" height="24" fill="none" stroke="#15803d" stroke-width="2.5" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                </svg>
              </div>
              <div>
                <p style="font-size:16px;font-weight:700;color:#0f172a;margin:0 0 6px">Equipe incompleta</p>
                <p style="font-size:13px;color:#64748b;margin:0">A equipe precisa ter no mínimo <strong style="color:#15803d">${MIN_MEMBROS} membros</strong>.<br/>Você adicionou <strong>${membros.length}</strong> até agora.</p>
              </div>
            </div>
          `,
        showConfirmButton: true,
        confirmButtonText: "Entendi",
        confirmButtonColor: "#15803d",
        background: "#ffffff",
        customClass: { popup: "rounded-2xl shadow-xl", confirmButton: "rounded-lg text-sm font-semibold px-6 py-2.5" },
        width: "min(380px, 90vw)",
        padding: "1.5rem",
      });
      return;
    }
    const temaId = Number(eixo);
    if (!Number.isFinite(temaId)) {
      Swal.fire({
        icon: "warning",
        title: "Eixo obrigatório",
        text: "Selecione um eixo temático cadastrado no evento atual.",
        confirmButtonColor: "#15803d",
      });
      return;
    }

    setCriando(true);
    try {
      const alunosIds = membros
        .filter((membro) => membro.id !== ALUNO_LOGADO.id)
        .map((membro) => Number(membro.id))
        .filter((id) => Number.isFinite(id));

      const projetoSalvo = editandoProjeto && projeto
        ? await apiRequest<ProjetoApi>(`/projetos/${projeto.id}`, {
          method: "PATCH",
          body: { titulo, descricao, temaId },
        })
        : await apiRequest<ProjetoApi>("/projetos", {
          method: "POST",
          body: { titulo, descricao, temaId, alunosIds },
        });

      if (solicitacoes.length > 0) {
        await apiRequest("/projetos/solicitar-orientador", {
          method: "POST",
          body: { orientadoresIds: solicitacoes.map(Number).filter((id) => Number.isFinite(id)) },
        });
      }

      // ATUALIZADO: Agora passa apenas o projeto, sem o parâmetro temas
      const projetoAtualizado = mapProjetoApiToProjeto(projetoSalvo, eixosDisponiveis);
      setProjeto({
        ...projetoAtualizado,
        orientadorId: solicitacoes[0] ?? projetoAtualizado.orientadorId,
        status: projetoAtualizado.status === "Aguardando Aprovação" ? "Aguardando Aprovação" : projetoAtualizado.status,
      });
      setAlunosOcupadosIds((prev) => [...new Set([...prev, ...membros.map((membro) => membro.id)])]);
      Swal.fire({
        icon: "success",
        title: editandoProjeto ? "Projeto atualizado" : "Projeto criado",
        text: editandoProjeto ? "As alterações foram salvas no sistema." : "As solicitações foram enviadas aos orientadores selecionados.",
        confirmButtonColor: "#15803d",
      });
      fecharModal();
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Não foi possível salvar",
        text: error instanceof Error ? error.message : "Tente novamente em instantes.",
        confirmButtonColor: "#15803d",
      });
    } finally {
      setCriando(false);
    }
  }

  function handleSubmeter(e: React.FormEvent) {
    e.preventDefault();
    if (!arquivoPdf || !linkYoutube) return;
    setProjeto((p) => p ? { ...p, status: "Submetido", linkYoutube } : p);
  }

  const descricaoLonga = (projeto?.descricao.length ?? 0) > 110;
  const STEP_LABELS = ["Projeto", "Orientador", "Equipe"];

  return (
    <MainLayout userRole="aluno">
      <div className="mx-auto w-full max-w-6xl p-4 sm:p-6 lg:p-8">
        {erroDados && (
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
            {erroDados}
          </div>
        )}

        {deveMostrarAvisoSenha && (
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-amber-900 sm:px-5">
            <Link to="/dashboard/aluno/configuracoes" className="min-w-0 flex-1 transition hover:text-amber-950">
              <h2 className="text-sm font-bold text-amber-900 sm:text-base">Recomendação de segurança</h2>
              <p className="mt-0.5 text-xs text-amber-800 sm:text-sm">
                Por segurança, recomendamos alterar sua senha periodicamente. Escolha uma nova senha que não seja usada em outros sistemas.
              </p>
            </Link>
            <button
              type="button"
              onClick={dispensarAvisoSenha}
              className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-amber-700 transition hover:bg-amber-100 hover:text-amber-900"
              aria-label="Fechar aviso de segurança"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:mb-8 sm:flex-row">
          <div className="min-w-0">
            <p className="mb-1 break-words text-xs text-slate-500 sm:text-sm">
              Fase atual: <span className="font-semibold text-sectec-700">{faseAtual} — {FASE_LABELS[faseAtual]}</span>
            </p>
            <h1 className="break-words text-xl font-bold leading-tight text-slate-900 sm:text-2xl">
              Seja bem-vindo(a), {ALUNO_LOGADO.nome.split(" ")[0]}! 👋
            </h1>
            <p className="mt-1 break-words text-xs text-slate-500 sm:text-sm">
              {projeto ? "Acompanhe o andamento do seu projeto abaixo." : "Você ainda não possui um projeto."}
            </p>
          </div>
          {faseAtual === 1 && !projeto && (
            <button
              onClick={() => setModalAberto(true)}
              className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-sectec-700 px-3 py-2 text-xs font-semibold text-white shadow-md transition-all hover:bg-sectec-800 active:scale-[0.98] sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5 sm:text-sm"
            >
              <Plus size={14} /><span>Novo Projeto</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <div className="lg:col-span-2 min-w-0">
            {!projeto && (
              <div className="flex flex-col items-center justify-center py-14 sm:py-20 border-2 border-dashed border-slate-200 rounded-2xl bg-white text-center px-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-sectec-50 flex items-center justify-center mb-4">
                  <FlaskConical size={22} className="text-sectec-600" />
                </div>
                <h3 className="text-sm sm:text-base font-semibold text-slate-700 mb-1">Nenhum projeto inscrito</h3>
                <p className="text-xs sm:text-sm text-slate-400 max-w-xs">
                  {faseAtual === 1 ? "Toque em \"Novo Projeto\" para se inscrever na feira." : "O período de inscrições encerrou."}
                </p>
              </div>
            )}

            {projeto && (
              <div className="space-y-4">
                <div className="flex gap-1 overflow-visible border-b border-slate-200">
                  {(["painel", "submissao"] as const).map((a) => (
                    <button key={a} onClick={() => setAba(a)}
                      className={`px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-medium border-b-2 -mb-px transition-colors
                          ${aba === a ? "border-sectec-600 text-sectec-700" : "border-transparent text-slate-500 hover:text-slate-700"}`}>
                      {a === "painel" ? "Painel do Projeto" : (
                        <Tooltip text={SUBMISSAO_TOOLTIP}><span>Submissão</span></Tooltip>
                      )}
                    </button>
                  ))}
                </div>

                {aba === "painel" && (
                  <div className="space-y-4">
                    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
                      <div className="flex items-start gap-3 sm:gap-4">
                        <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-sectec-50 border border-sectec-100 flex items-center justify-center shrink-0">
                          <FlaskConical size={18} className="text-sectec-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="mb-1 flex items-start justify-between gap-3">
                            <div className="min-w-0 flex flex-wrap items-start gap-2">
                              <h2 className="text-sm sm:text-base font-semibold text-slate-900 leading-tight break-words">{projeto.titulo}</h2>
                              <Tooltip text={STATUS_TOOLTIP[projeto.status]}>
                                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full shrink-0 cursor-help ${STATUS_STYLE[projeto.status]}`}>
                                  {projeto.status}
                                </span>
                              </Tooltip>
                            </div>
                            {ehAutor && (
                              <button
                                type="button"
                                onClick={abrirEdicaoProjeto}
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700"
                                aria-label="Editar projeto"
                              >
                                <Pencil size={14} />
                              </button>
                            )}
                          </div>
                          <p className="text-xs text-slate-400 mb-1">{projeto.eixo}</p>
                          <p className={`text-xs sm:text-sm text-slate-500 ${descricaoExpandida ? "break-words" : "line-clamp-2"}`}>
                            {projeto.descricao}
                          </p>
                          {descricaoLonga && (
                            <button
                              type="button"
                              onClick={() => setDescricaoExpandida((v) => !v)}
                              className="mt-1 text-xs font-semibold text-sectec-700 transition hover:text-sectec-800"
                            >
                              {descricaoExpandida ? "Ver menos" : "Ver mais"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Users size={13} className="text-slate-400" />
                          <h3 className="text-sm font-semibold text-slate-700">Equipe</h3>
                          <span className="ml-auto text-xs text-slate-400">{projeto.membros.length} membros</span>
                        </div>
                        <div className="space-y-2">
                          {projeto.membros.map((m) => (
                            <div key={m.id} className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-sectec-100 text-sectec-700 text-xs font-semibold flex items-center justify-center shrink-0">{m.nome[0]}</div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-medium text-slate-700 truncate">{m.nome}</p>
                                <p className="text-[10px] text-slate-400">
                                  {m.sala ? `Sala ${m.sala}` : ""}
                                  {m.turma ? ` · Turma ${m.turma}` : ""}
                                </p>
                              </div>
                              {m.id === projeto.autorId && (
                                <span className="text-[9px] bg-sectec-100 text-sectec-700 font-semibold px-1.5 py-0.5 rounded-full shrink-0">líder</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4">
                        <h3 className="text-sm font-semibold text-slate-700 mb-3">Orientador</h3>
                        {orientador ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-yellow-100 text-yellow-700 text-sm font-semibold flex items-center justify-center shrink-0">
                              {orientador.nome.split(" ").at(-1)?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{orientador.nome}</p>
                              <p className="break-words text-xs text-slate-400">{orientador.nome}</p>
                            </div>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400">Nenhum orientador selecionado.</p>
                        )}
                        {faseAtual === 3 && projetoAceito && (
                          <button onClick={() => setAba("submissao")}
                            className="mt-4 w-full flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-sectec-700 bg-sectec-50 rounded-lg hover:bg-sectec-100 transition-colors">
                            Ir para Submissão <ChevronRight size={13} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {aba === "submissao" && (
                  <div className="w-full max-w-lg space-y-4">

                    {/* ── Envio de materiais — só o autor pode enviar ── */}
                    {ehAutor && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">Submissão do Projeto</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mb-5">Envie o relatório final em PDF e o link do vídeo no YouTube.</p>

                        {faseAtual !== 3 && (
                          <div className="flex gap-3 bg-slate-50 border border-slate-200 rounded-xl p-4 mb-5">
                            <Lock size={15} className="text-slate-400 mt-0.5 shrink-0" />
                            <p className="text-xs sm:text-sm text-slate-500">
                              Disponível apenas na <strong>Fase 3 — Submissão</strong>. Fase atual: {faseAtual}.
                            </p>
                          </div>
                        )}

                        {faseAtual === 3 && !projetoAceito && (
                          <div className="flex gap-3 bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-5">
                            <TriangleAlert size={15} className="text-yellow-500 mt-0.5 shrink-0" />
                            <p className="text-xs sm:text-sm text-yellow-700">
                              Seu projeto precisa estar <strong>Aceito</strong> para submeter. Status atual: <strong>{projeto.status}</strong>.
                            </p>
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Relatório Final (PDF) *</label>
                            <input ref={inputPdfRef} type="file" accept=".pdf" disabled={!submissaoDesbloqueada}
                              onChange={(e) => setArquivoPdf(e.target.files?.[0] ?? null)} className="hidden" />
                            <button type="button" disabled={!submissaoDesbloqueada} onClick={() => inputPdfRef.current?.click()}
                              className={`w-full border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 transition-colors
                ${submissaoDesbloqueada ? "border-slate-200 hover:border-sectec-400 hover:bg-sectec-50 cursor-pointer" : "border-slate-100 bg-slate-50 cursor-not-allowed opacity-60"}`}>
                              {arquivoPdf
                                ? <><FileText size={20} className="text-sectec-600" /><span className="text-xs font-medium text-sectec-700 break-all">{arquivoPdf.name}</span></>
                                : <><Upload size={20} className="text-slate-400" /><span className="text-xs text-slate-500">{submissaoDesbloqueada ? "Toque para selecionar o PDF" : "Campo bloqueado"}</span></>
                              }
                            </button>
                          </div>

                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Link do YouTube *</label>
                            <div className="relative">
                              <Video size={14} className={`absolute left-3 top-3 ${submissaoDesbloqueada ? "text-red-500" : "text-slate-300"}`} />
                              <input type="url" inputMode="url" disabled={!submissaoDesbloqueada} value={linkYoutube}
                                onChange={(e) => setLinkYoutube(e.target.value)} placeholder="https://youtube.com/watch?v=..."
                                className={`w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm transition
                  ${!submissaoDesbloqueada ? "bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed"
                                    : !youtubeValido && linkYoutube ? "border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                                      : "border-slate-200 focus:outline-none focus:border-sectec-600 focus:ring-2 focus:ring-sectec-100"}`} />
                            </div>
                            {!youtubeValido && linkYoutube && <p className="text-xs text-red-500 mt-1">Link inválido.</p>}
                          </div>

                          <button
                            type="button"
                            disabled={!submissaoDesbloqueada || (!arquivoPdf && !linkYoutube) || enviandoMaterial}
                            onClick={async () => {
                              if (!projeto) return;
                              setEnviandoMaterial(true);
                              try {
                                if (arquivoPdf) {
                                  const formData = new FormData();
                                  formData.append('file', arquivoPdf);
                                  formData.append('projetoId', projeto.id);
                                  formData.append('tipo', 'pdf');
                                  const token = localStorage.getItem('token');
                                  const res = await fetch('http://localhost:3000/api/materiais', {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` },
                                    body: formData,
                                  });
                                  if (!res.ok) throw new Error('Erro ao enviar PDF');
                                  const material = await res.json();
                                  setMateriais(prev => [material.material ?? material, ...prev]);
                                  setArquivoPdf(null);
                                }
                                if (linkYoutube && youtubeValido) {
                                  const formData = new FormData();
                                  formData.append('projetoId', projeto.id);
                                  formData.append('tipo', 'link');
                                  formData.append('conteudo', linkYoutube);
                                  const token = localStorage.getItem('token');
                                  const res = await fetch('http://localhost:3000/api/materiais', {
                                    method: 'POST',
                                    headers: { Authorization: `Bearer ${token}` },
                                    body: formData,
                                  });
                                  if (!res.ok) throw new Error('Erro ao enviar link');
                                  const material = await res.json();
                                  setMateriais(prev => [material.material ?? material, ...prev]);
                                  setLinkYoutube('');
                                }
                                Swal.fire({ icon: 'success', title: 'Material enviado!', text: 'Aguarde a análise do orientador.', confirmButtonColor: '#15803d' });
                              } catch (e) {
                                Swal.fire({ icon: 'error', title: 'Erro ao enviar', text: e instanceof Error ? e.message : 'Tente novamente.', confirmButtonColor: '#15803d' });
                              } finally {
                                setEnviandoMaterial(false);
                              }
                            }}
                            className="w-full py-2.5 text-sm font-semibold text-white bg-sectec-700 rounded-lg hover:bg-sectec-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                          >
                            {enviandoMaterial && (
                              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                              </svg>
                            )}
                            {enviandoMaterial ? 'Enviando...' : 'Enviar Material'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* ── Mensagem para integrantes ── */}
                    {!ehAutor && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                        <h2 className="text-sm sm:text-base font-semibold text-slate-900 mb-1">Submissão do Projeto</h2>
                        <div className="flex gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
                          <Lock size={15} className="text-blue-400 mt-0.5 shrink-0" />
                          <p className="text-xs sm:text-sm text-blue-700">
                            Apenas o <strong>autor do projeto</strong> pode enviar materiais. Você pode acompanhar o status dos materiais enviados abaixo.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* ── Histórico de materiais — todos veem ── */}
                    {materiais.length > 0 && (
                      <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-6">
                        <h3 className="text-sm font-semibold text-slate-900 mb-4">Materiais Enviados</h3>
                        <div className="space-y-3">
                          {materiais.map((m) => (
                            <div key={m.id} className={`rounded-xl border p-4 ${m.status === 'aprovado' ? 'border-green-200 bg-green-50'
                              : m.status === 'recusado' ? 'border-red-200 bg-red-50'
                                : 'border-slate-200 bg-slate-50'
                              }`}>
                              <div className="flex items-start justify-between gap-3 mb-2">
                                <div className="flex items-center gap-2">
                                  {m.tipo === 'pdf' || m.tipo === 'pdf_relatorio'
                                    ? <FileText size={15} className="text-slate-500 shrink-0" />
                                    : <Video size={15} className="text-slate-500 shrink-0" />
                                  }
                                  <span className="text-xs font-semibold text-slate-700 uppercase">
                                    {m.tipo === 'link' ? 'Vídeo' : 'PDF'}
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${m.status === 'aprovado' ? 'bg-green-100 text-green-700'
                                  : m.status === 'recusado' ? 'bg-red-100 text-red-700'
                                    : 'bg-yellow-100 text-yellow-700'
                                  }`}>
                                  {m.status === 'aprovado' ? '✓ Aprovado'
                                    : m.status === 'recusado' ? '✗ Recusado'
                                      : '⏳ Em análise'}
                                </span>
                              </div>

                              {m.tipo === 'link' ? (

                                <a href={m.conteudo} target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all mb-2 flex items-center gap-1"
                                >
                                  <Video size={12} className="shrink-0" />
                                  {m.conteudo}
                                </a>
                              ) : m.id ? (

                                <a href={`http://localhost:3000/api/files/download/projeto/${projeto?.id}/material/${m.id}`} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-800 hover:underline break-all mb-2 flex items-center gap-1">
                                  <FileText size={12} className="shrink-0" />
                                  Visualizar PDF
                                </a>
                              ) : (
                                <p className="text-xs text-slate-500 mb-2 italic">PDF enviado — link indisponível</p>
                              )}
                              {(m.status === 'aprovado' || m.status === 'recusado') && m.opiniao && (
                                <div className={`rounded-lg px-3 py-2 text-xs mt-2 ${m.status === 'aprovado' ? 'bg-green-100 text-green-800'
                                  : 'bg-red-100 text-red-800'
                                  }`}>
                                  <span className="font-semibold">
                                    {m.status === 'aprovado' ? '💬 Comentário do orientador:' : '❌ Motivo da recusa:'}
                                  </span>
                                  <p className="mt-1">{m.opiniao}</p>
                                </div>
                              )}

                              <p className="text-[10px] text-slate-400 mt-2">
                                Enviado em {new Date(m.criadoEm).toLocaleDateString('pt-BR')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="min-w-0 space-y-4">
            <FeiraTimeline faseAtual={faseAtual} fases={fasesFeira} />
          </div>
        </div>
      </div >

      {/* ── MODAL PROGRESSIVO ── */}
      {
        modalAberto && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
            <div className="flex max-h-[95dvh] w-full flex-col rounded-t-2xl bg-white shadow-2xl sm:max-h-[90vh] sm:max-w-2xl sm:rounded-2xl">

              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-200">
                <div>
                  <h2 className="text-sm font-semibold text-slate-900 sm:text-base">
                    {editandoProjeto ? "Editar Projeto Científico" : "Novo Projeto Científico"}
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5 hidden sm:block">
                    {etapa === 1 && "Preencha os dados do projeto"}
                    {etapa === 2 && "Escolha até 3 orientadores para solicitar"}
                    {etapa === 3 && "Monte a equipe do projeto"}
                  </p>
                </div>
                <button onClick={fecharModal} className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 active:bg-slate-200 transition-colors">
                  <X size={17} />
                </button>
              </div>

              {/* Stepper */}
              <div className="flex items-center px-4 sm:px-6 pt-4 pb-2">
                {STEP_LABELS.map((label, i) => {
                  const step = (i + 1) as Etapa;
                  const done = etapa > step;
                  const active = etapa === step;
                  return (
                    <div key={step} className="flex items-center flex-1 last:flex-none">
                      <div className="flex flex-col items-center gap-1">
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all
                          ${done ? "bg-sectec-600 border-sectec-600 text-white"
                            : active ? "bg-white border-sectec-600 text-sectec-700"
                              : "bg-white border-slate-200 text-slate-400"}`}>
                          {done ? (
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l2.5 2.5L10 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          ) : step}
                        </div>
                        <span className={`text-[10px] font-semibold ${active ? "text-sectec-700" : done ? "text-slate-500" : "text-slate-300"}`}>
                          {label}
                        </span>
                      </div>
                      {i < STEP_LABELS.length - 1 && (
                        <div className={`flex-1 h-0.5 mx-2 mb-4 rounded transition-all ${done ? "bg-sectec-600" : "bg-slate-200"}`} />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Body */}
              <div className="min-w-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">

                {/* ── Etapa 1: Dados do Projeto ── */}
                {etapa === 1 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Título *</label>
                      <input
                        value={titulo}
                        onChange={(e) => setTitulo(e.target.value)}
                        placeholder="Ex: Captação de energia solar em ambientes urbanos"
                        className="w-full min-w-0 rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Descrição / Resumo *
                        <span className={`ml-2 text-xs font-normal ${descricao.trim().length < 30 ? "text-amber-500" : "text-sectec-600"}`}>
                          ({descricao.trim().length} / mín. 30 caracteres)
                        </span>
                      </label>
                      <textarea
                        rows={4}
                        value={descricao}
                        onChange={(e) => setDescricao(e.target.value)}
                        placeholder="Descreva o objetivo e a metodologia do projeto..."
                        className="w-full min-w-0 resize-none rounded-lg border border-slate-200 px-3 py-2.5 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100"
                      />
                    </div>

                    <div className="relative">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Eixo Temático *</label>
                      <select
                        value={eixo}
                        onChange={(e) => handleEixoChange(e.target.value)}
                        className="w-full min-w-0 appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2.5 pr-9 text-sm transition focus:border-sectec-600 focus:outline-none focus:ring-2 focus:ring-sectec-100"
                      >
                        <option value="">Selecione um eixo</option>
                        {eixosDisponiveis.map((e) => <option key={String(e.id)} value={String(e.id)}>{e.nome}</option>)}
                      </select>
                      <ChevronDown size={13} className="absolute right-3 bottom-3 text-slate-400 pointer-events-none" />
                    </div>

                    {eixo && (
                      <div className="flex items-start gap-2 rounded-xl bg-sectec-50 border border-sectec-100 px-3 py-2.5 text-xs text-sectec-700">
                        <FlaskConical size={13} className="mt-0.5 shrink-0" />
                        <span>
                          Eixo selecionado: <strong>{eixoSelecionado?.nome ?? "não informado"}</strong>. No próximo passo você verá apenas orientadores disponíveis para este eixo.
                          {orientadoresFiltradosPorEixo.length === 0 && " Nenhum orientador escolheu este eixo ainda."}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── Etapa 2: Orientadores ── */}
                {etapa === 2 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">
                        Orientadores disponíveis para <strong className="text-sectec-700">{eixoSelecionado?.nome ?? "este eixo"}</strong>
                      </p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${solicitacoes.length === 0 ? "bg-slate-100 text-slate-500"
                          : solicitacoes.length < 3 ? "bg-sectec-100 text-sectec-700"
                            : "bg-yellow-100 text-yellow-700"}`}>
                        {solicitacoes.length}/3 solicitados
                      </span>
                    </div>

                    {carregandoDados ? (
                      <p className="text-center text-xs text-slate-400 py-8">Carregando orientadores...</p>
                    ) : orientadoresFiltradosPorEixo.length === 0 ? (
                      <div className="flex flex-col items-center py-10 text-center">
                        <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mb-3">
                          <Users size={20} className="text-slate-400" />
                        </div>
                        <p className="text-sm font-medium text-slate-600">Nenhum orientador disponível</p>
                        <p className="text-xs text-slate-400 mt-1">Não há orientadores vinculados a este eixo temático.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {orientadoresFiltradosPorEixo.map((o) => {
                          const selecionado = solicitacoes.includes(o.id);
                          const bloqueado = !selecionado && solicitacoes.length >= 3;
                          return (
                            <button
                              key={o.id}
                              type="button"
                              disabled={bloqueado}
                              onClick={() => toggleSolicitacao(o.id)}
                              className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-all
                                ${selecionado
                                  ? "border-sectec-400 bg-sectec-50 ring-1 ring-sectec-300"
                                  : bloqueado
                                    ? "border-slate-100 bg-slate-50 opacity-40 cursor-not-allowed"
                                    : "border-slate-200 bg-white hover:border-sectec-200 hover:bg-sectec-50"}`}
                            >
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0
                                ${selecionado ? "bg-sectec-600 text-white" : "bg-yellow-100 text-yellow-700"}`}>
                                {o.nome.split(" ").slice(-1)[0]?.[0] ?? "?"}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-slate-800 truncate">{o.nome}</p>
                              </div>
                              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all
                                ${selecionado ? "bg-sectec-600 border-sectec-600" : "border-slate-300"}`}>
                                {selecionado && (
                                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                                    <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}

                    {solicitacoes.length > 0 && (
                      <div className="rounded-xl bg-amber-50 border border-amber-200 px-3 py-2.5 text-xs text-amber-800">
                        <strong>Como funciona:</strong> Sua solicitação será enviada para os orientadores selecionados. O primeiro que aceitar será vinculado ao projeto.
                      </div>
                    )}
                  </div>
                )}

                {/* ── Etapa 3: Equipe ── */}
                {etapa === 3 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-slate-500">Monte sua equipe</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full
                        ${membros.length > MAX_MEMBROS ? "bg-red-100 text-red-600"
                          : membros.length < MIN_MEMBROS ? "bg-yellow-100 text-yellow-700"
                            : "bg-sectec-100 text-sectec-700"}`}>
                        {membros.length}/{MAX_MEMBROS} {membros.length < MIN_MEMBROS && `(mín. ${MIN_MEMBROS})`}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {membros.map((m) => (
                        <div key={m.id} className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
                          <div className="w-7 h-7 rounded-full bg-sectec-100 text-sectec-700 text-xs font-semibold flex items-center justify-center shrink-0">{m.nome[0]}</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-slate-700 truncate">{m.nome}</p>
                            <p className="text-[10px] text-slate-400">
                              {m.sala ? `Sala ${m.sala}` : ""}
                              {m.turma ? ` · Turma ${m.turma}` : ""}
                            </p>
                          </div>
                          {m.id === projeto?.autorId ? (
                            <span className="text-[10px] font-semibold bg-sectec-100 text-sectec-700 px-2 py-0.5 rounded-full shrink-0">Líder</span>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setMembros((prev) => prev.filter((x) => x.id !== m.id))}
                              className="text-slate-400 hover:text-red-500 active:text-red-600 transition-colors p-1.5 shrink-0"
                            >
                              <UserMinus size={14} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {membros.length < MAX_MEMBROS && (
                      <div className="border border-slate-200 rounded-xl overflow-hidden">
                        <div className="p-2 bg-slate-50 border-b border-slate-200">
                          <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-md px-2 py-1.5">
                            <Search size={11} className="text-slate-400 shrink-0" />
                            <input
                              value={buscaAluno}
                              onChange={(e) => setBuscaAluno(e.target.value)}
                              placeholder="Buscar aluno..."
                              className="flex-1 text-xs outline-none bg-transparent min-w-0"
                            />
                          </div>
                        </div>
                        <div className="max-h-44 overflow-y-auto">
                          {alunosFiltrados.length === 0 ? (
                            <p className="text-center text-xs text-slate-400 py-5">
                              {carregandoDados ? "Carregando alunos..." : "Nenhum aluno encontrado"}
                            </p>
                          ) : (
                            alunosFiltrados.map((aluno) => (
                              <button
                                key={aluno.id}
                                type="button"
                                onClick={() => adicionarMembro(aluno)}
                                className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 active:bg-slate-100 transition-colors border-b border-slate-100 last:border-0"
                              >
                                <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 text-[10px] font-semibold flex items-center justify-center shrink-0">{aluno.nome[0]}</div>
                                <div className="flex-1 min-w-0 text-left">
                                  <p className="text-xs font-medium text-slate-700 truncate">{aluno.nome}</p>
                                  <p className="text-[10px] text-slate-400">
                                    {aluno.sala ? `Sala ${aluno.sala}` : ""}
                                    {aluno.turma ? ` · Turma ${aluno.turma}` : ""}
                                  </p>
                                </div>
                                <UserPlus size={13} className="text-sectec-600 shrink-0" />
                              </button>
                            ))
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 rounded-xl bg-blue-50 border border-blue-100 px-3 py-2.5 text-xs text-blue-700">
                      <TriangleAlert size={12} className="mt-0.5 shrink-0" />
                      <span>Apenas alunos da <strong>mesma turma e ano</strong> são exibidos. Equipes com integrantes de turmas diferentes não são permitidas.</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex flex-col-reverse gap-2 rounded-b-2xl border-t border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:justify-between sm:px-6 sm:py-4">
                <button
                  type="button"
                  onClick={() => etapa > 1 ? setEtapa((e) => (e - 1) as Etapa) : fecharModal()}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 active:bg-slate-200 sm:w-auto"
                >
                  {etapa === 1 ? "Cancelar" : "← Voltar"}
                </button>

                {etapa < 3 ? (
                  <button
                    type="button"
                    disabled={etapa === 1 ? !podeAvancarEtapa1 : !podeAvancarEtapa2}
                    onClick={() => setEtapa((e) => (e + 1) as Etapa)}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-sectec-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sectec-800 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed sm:w-auto sm:px-5"
                  >
                    Continuar →
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={criando || membros.length < MIN_MEMBROS || membros.length > MAX_MEMBROS}
                    onClick={handleCriarProjeto}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-sectec-700 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-sectec-800 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto sm:px-5"
                  >
                    {criando && (
                      <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                    )}
                    {criando ? (editandoProjeto ? "Salvando..." : "Cadastrando...") : (editandoProjeto ? "Salvar alterações" : "Criar projeto")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )
      }
    </MainLayout >
  );
}

export default Dashboard;
