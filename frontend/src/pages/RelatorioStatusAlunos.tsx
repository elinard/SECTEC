import { useMemo, useState } from "react";
import {
  PiBuildings,
  PiChalkboardTeacher,
  PiClockCounterClockwise,
  PiFilePdf,
  PiGitBranch,
  PiSealCheck,
  PiStudent,
  PiTrophy,
  PiUploadSimple,
  PiUsersThree,
  PiWarningCircle,
} from "react-icons/pi";
import { MainLayout } from "../componentes/SideBarUniversal";
import { API_BASE_URL } from "../lib/api";

type AlunoSemProjeto = {
  id: number;
  nome: string;
  turma: string;
  email: string;
  cadastradoEm: string;
};

type MembroComissao = {
  id: number;
  nome: string;
  turma: string;
  funcao: string;
  email: string;
};

type ProjetoEixo = {
  eixo: string;
  total: number;
  aprovados: number;
  emDesenvolvimento: number;
  pendentes: number;
};

type OrientadorProjetos = {
  orientador: string;
  total: number;
  projetos: { id: number; titulo: string; status: string; aluno: string }[];
};

type ProjetoTurma = {
  turma: string;
  total: number;
  aprovados: number;
  mediaNota: number;
};

type RankingProjeto = {
  posicao: number;
  titulo: string;
  eixo: string;
  nota: number;
  aluno: string;
  orientador: string;
};

type ProjetoPendente = {
  id: number;
  titulo: string;
  aluno: string;
  turma: string;
  orientador: string;
  status: string;
  diasSemAtualizacao: number;
};

type LogAuditoria = {
  id: number;
  quando: string;
  usuario: string;
  acao: string;
  projeto: string;
  valorAnterior: string;
  valorNovo: string;
  ip?: string;
};

type ReportData = {
  alunosSemProjeto: AlunoSemProjeto[];
  membrosComissao: MembroComissao[];
  projetosEixo: ProjetoEixo[];
  orientadoresProjetos: OrientadorProjetos[];
  projetosTurma: ProjetoTurma[];
  rankingProjetos: RankingProjeto[];
  projetosPendentes: ProjetoPendente[];
  logsAuditoria: LogAuditoria[];
};

const dadosMock: ReportData = {
  alunosSemProjeto: [
    { id: 1, nome: "Lívia Andrade", turma: "1º Informática", email: "livia.andrade@aluno.sectec.edu.br", cadastradoEm: "04/03/2026" },
    { id: 2, nome: "Mateus Oliveira", turma: "1º Informática", email: "mateus.oliveira@aluno.sectec.edu.br", cadastradoEm: "05/03/2026" },
    { id: 3, nome: "Rafaela Sousa", turma: "2º Contabilidade", email: "rafaela.sousa@aluno.sectec.edu.br", cadastradoEm: "07/03/2026" },
    { id: 4, nome: "Caio Mendes", turma: "2º Enfermagem", email: "caio.mendes@aluno.sectec.edu.br", cadastradoEm: "09/03/2026" },
    { id: 5, nome: "Beatriz Rocha", turma: "3º Contabilidade", email: "beatriz.rocha@aluno.sectec.edu.br", cadastradoEm: "12/03/2026" },
    { id: 6, nome: "Igor Nascimento", turma: "3º Contabilidade", email: "igor.nascimento@aluno.sectec.edu.br", cadastradoEm: "13/03/2026" },
  ],
  membrosComissao: [
    { id: 1, nome: "Ana Clara Martins", turma: "3º Informática", funcao: "Credenciamento", email: "ana.martins@aluno.sectec.edu.br" },
    { id: 2, nome: "João Pedro Costa", turma: "2º Contabilidade", funcao: "Logística de salas", email: "joao.costa@aluno.sectec.edu.br" },
    { id: 3, nome: "Mariana Freitas", turma: "3º Enfermagem", funcao: "Recepção de avaliadores", email: "mariana.freitas@aluno.sectec.edu.br" },
    { id: 4, nome: "Thiago Barros", turma: "2º Informática", funcao: "Suporte de mídia", email: "thiago.barros@aluno.sectec.edu.br" },
    { id: 5, nome: "Ester Lima", turma: "1º Informática", funcao: "Organização de materiais", email: "ester.lima@aluno.sectec.edu.br" },
  ],
  projetosEixo: [
    { eixo: "Tecnologia e Sustentabilidade", total: 18, aprovados: 9, emDesenvolvimento: 6, pendentes: 3 },
    { eixo: "Saúde e Qualidade de Vida", total: 12, aprovados: 5, emDesenvolvimento: 4, pendentes: 3 },
    { eixo: "Gestão e Empreendedorismo", total: 10, aprovados: 6, emDesenvolvimento: 3, pendentes: 1 },
    { eixo: "Robótica e Automação", total: 8, aprovados: 4, emDesenvolvimento: 3, pendentes: 1 },
    { eixo: "Cultura Digital", total: 7, aprovados: 2, emDesenvolvimento: 4, pendentes: 1 },
  ],
  orientadoresProjetos: [
    {
      orientador: "Prof. Marcos Lima",
      total: 3,
      projetos: [
        { id: 1, titulo: "Monitoramento Ambiental com IoT", status: "Aprovado", aluno: "João Felipe" },
        { id: 2, titulo: "Horta Automatizada Escolar", status: "Em desenvolvimento", aluno: "Camila Duarte" },
        { id: 3, titulo: "Sensor de Ruído para Salas", status: "Pendente", aluno: "Pedro Henrique" },
      ],
    },
    {
      orientador: "Profª. Carla Nunes",
      total: 2,
      projetos: [
        { id: 4, titulo: "Biblioteca Digital Escolar", status: "Aprovado", aluno: "Ana Beatriz" },
        { id: 5, titulo: "Mapa de Talentos da Turma", status: "Em desenvolvimento", aluno: "Wesley Araújo" },
      ],
    },
    {
      orientador: "Prof. Renato Alves",
      total: 2,
      projetos: [
        { id: 6, titulo: "Registro de Frequência por QR Code", status: "Aprovado", aluno: "Maria Eduarda" },
        { id: 7, titulo: "Robô Separador de Resíduos", status: "Em desenvolvimento", aluno: "Samuel Brito" },
      ],
    },
    {
      orientador: "Profª. Helena Moura",
      total: 2,
      projetos: [
        { id: 8, titulo: "Filtro Inteligente de Água", status: "Pendente", aluno: "Lucas Pereira" },
        { id: 9, titulo: "Painel de Primeiros Socorros", status: "Aprovado", aluno: "Sofia Almeida" },
      ],
    },
  ],
  projetosTurma: [
    { turma: "1º Informática", total: 9, aprovados: 4, mediaNota: 8.1 },
    { turma: "2º Informática", total: 11, aprovados: 6, mediaNota: 8.6 },
    { turma: "2º Contabilidade", total: 8, aprovados: 5, mediaNota: 8.4 },
    { turma: "3º Enfermagem", total: 7, aprovados: 3, mediaNota: 7.9 },
    { turma: "3º Contabilidade", total: 10, aprovados: 6, mediaNota: 8.8 },
  ],
  rankingProjetos: [
    { posicao: 1, titulo: "Monitoramento Ambiental com IoT", eixo: "Tecnologia e Sustentabilidade", nota: 9.8, aluno: "João Felipe", orientador: "Prof. Marcos Lima" },
    { posicao: 2, titulo: "Registro de Frequência por QR Code", eixo: "Robótica e Automação", nota: 9.6, aluno: "Maria Eduarda", orientador: "Prof. Renato Alves" },
    { posicao: 3, titulo: "Biblioteca Digital Escolar", eixo: "Cultura Digital", nota: 9.4, aluno: "Ana Beatriz", orientador: "Profª. Carla Nunes" },
    { posicao: 4, titulo: "Painel de Primeiros Socorros", eixo: "Saúde e Qualidade de Vida", nota: 9.1, aluno: "Sofia Almeida", orientador: "Profª. Helena Moura" },
    { posicao: 5, titulo: "Robô Separador de Resíduos", eixo: "Tecnologia e Sustentabilidade", nota: 8.9, aluno: "Samuel Brito", orientador: "Prof. Renato Alves" },
  ],
  projetosPendentes: [
    { id: 1, titulo: "Filtro Inteligente de Água", aluno: "Lucas Pereira", turma: "3º Enfermagem", orientador: "Profª. Helena Moura", status: "Aguardando avaliação", diasSemAtualizacao: 12 },
    { id: 2, titulo: "Sensor de Ruído para Salas", aluno: "Pedro Henrique", turma: "1º Informática", orientador: "Prof. Marcos Lima", status: "Correção solicitada", diasSemAtualizacao: 9 },
    { id: 3, titulo: "Mapa de Custos da Cantina Escolar", aluno: "Wesley Araújo", turma: "2º Contabilidade", orientador: "Profª. Carla Nunes", status: "Sem segunda nota", diasSemAtualizacao: 7 },
    { id: 4, titulo: "Aplicativo de Rotina de Estudos", aluno: "Júlia Barros", turma: "2º Informática", orientador: "Prof. Diego Matos", status: "Aguardando orientador", diasSemAtualizacao: 6 },
  ],
  logsAuditoria: [
    { id: 1, quando: "13/05/2026 09:18", usuario: "coord.maria@sectec.edu.br", acao: "Alterou status", projeto: "Filtro Inteligente de Água", valorAnterior: "Em desenvolvimento", valorNovo: "Aguardando avaliação", ip: "192.168.0.42" },
    { id: 2, quando: "13/05/2026 08:51", usuario: "prof.renato@sectec.edu.br", acao: "Registrou nota", projeto: "Registro de Frequência por QR Code", valorAnterior: "-", valorNovo: "9.6", ip: "192.168.0.18" },
    { id: 3, quando: "12/05/2026 16:34", usuario: "comissao.ana@sectec.edu.br", acao: "Reabriu avaliação", projeto: "Mapa de Talentos da Turma", valorAnterior: "Avaliado", valorNovo: "Sem segunda nota" },
    { id: 4, quando: "12/05/2026 14:02", usuario: "coord.maria@sectec.edu.br", acao: "Aprovou projeto", projeto: "Biblioteca Digital Escolar", valorAnterior: "Sob revisão", valorNovo: "Aprovado", ip: "192.168.0.42" },
  ],
};

const relatorios = [
  { id: "alunos-sem-projeto", label: "Sem Projeto", titulo: "Alunos sem Projeto por Turma", endpoint: "/relatorios/alunos/sem-projeto", icon: <PiStudent size={18} /> },
  { id: "comissao-organizadora", label: "Comissão", titulo: "Alunos na Comissão Organizadora", endpoint: "/relatorios/alunos/comissao-organizadora", icon: <PiUsersThree size={18} /> },
  { id: "projetos-por-eixo", label: "Por Eixo", titulo: "Projetos por Eixo Temático", endpoint: "/relatorios/projetos/por-eixo", icon: <PiGitBranch size={18} /> },
  { id: "orientadores-projetos", label: "Orientadores", titulo: "Orientadores e seus Projetos", endpoint: "/relatorios/orientadores/projetos", icon: <PiChalkboardTeacher size={18} /> },
  { id: "projetos-por-turma", label: "Por Turma", titulo: "Projetos por Turma", endpoint: "/relatorios/projetos/por-turma", icon: <PiBuildings size={18} /> },
  { id: "ranking-geral-eixo", label: "Ranking", titulo: "Ranking Geral por Eixo", endpoint: "/relatorios/projetos/ranking-eixo", icon: <PiTrophy size={18} /> },
  { id: "avaliacoes-pendentes", label: "Pendentes", titulo: "Projetos com Avaliações Pendentes", endpoint: "/relatorios/projetos/avaliacoes-pendentes", icon: <PiWarningCircle size={18} /> },
  { id: "auditoria-notas-status", label: "Auditoria", titulo: "Log de Auditoria de Notas e Status", endpoint: "/relatorios/auditoria/notas-status", icon: <PiSealCheck size={18} /> },
] as const;

type ReportKey = (typeof relatorios)[number]["id"];

const dataKeyByReport: Record<ReportKey, keyof ReportData> = {
  "alunos-sem-projeto": "alunosSemProjeto",
  "comissao-organizadora": "membrosComissao",
  "projetos-por-eixo": "projetosEixo",
  "orientadores-projetos": "orientadoresProjetos",
  "projetos-por-turma": "projetosTurma",
  "ranking-geral-eixo": "rankingProjetos",
  "avaliacoes-pendentes": "projetosPendentes",
  "auditoria-notas-status": "logsAuditoria",
};

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function csvCell(value: string | number | undefined) {
  return `"${String(value ?? "-").replace(/"/g, '""')}"`;
}

function makeCsv(headers: string[], rows: (string | number | undefined)[][]) {
  return [headers, ...rows].map((row) => row.map(csvCell).join(";")).join("\n");
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">{children}</div>
    </div>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return <th className="px-4 py-3 text-left text-xs font-black uppercase tracking-wider text-slate-500">{children}</th>;
}

function Td({ children, strong = false }: { children: React.ReactNode; strong?: boolean }) {
  return <td className={`px-4 py-3 text-sm ${strong ? "font-bold text-slate-900" : "font-medium text-slate-600"}`}>{children}</td>;
}

function StatusBadge({ value }: { value: string }) {
  const aprovado = value.toLowerCase().includes("aprov");
  const pendente = value.toLowerCase().includes("pend") || value.toLowerCase().includes("aguard");
  const classes = aprovado
    ? "bg-sectec-100 text-sectec-700"
    : pendente
    ? "bg-amber-100 text-amber-700"
    : "bg-slate-100 text-slate-600";

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${classes}`}>{value}</span>;
}

function RelatorioStatusAlunos() {
  const [abaAtiva, setAbaAtiva] = useState<ReportKey>("alunos-sem-projeto");
  const [dados, setDados] = useState<ReportData>(dadosMock);
  const [carregando, setCarregando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const relatorioAtivo = useMemo(() => relatorios.find((item) => item.id === abaAtiva) ?? relatorios[0], [abaAtiva]);
  const rankingOrdenado = useMemo(
    () => [...dados.rankingProjetos].sort((a, b) => b.nota - a.nota).map((item, index) => ({ ...item, posicao: index + 1 })),
    [dados.rankingProjetos],
  );

  const alunosPorTurma = useMemo(() => {
    return dados.alunosSemProjeto.reduce<Record<string, AlunoSemProjeto[]>>((acc, aluno) => {
      acc[aluno.turma] = [...(acc[aluno.turma] ?? []), aluno];
      return acc;
    }, {});
  }, [dados.alunosSemProjeto]);

  function csvAtual() {
    if (abaAtiva === "alunos-sem-projeto") {
      return makeCsv(
        ["Nome", "Turma", "E-mail", "Data de cadastro"],
        dados.alunosSemProjeto.map((aluno) => [aluno.nome, aluno.turma, aluno.email, aluno.cadastradoEm]),
      );
    }

    if (abaAtiva === "comissao-organizadora") {
      return makeCsv(
        ["Nome", "Turma", "Função na comissão", "E-mail"],
        dados.membrosComissao.map((membro) => [membro.nome, membro.turma, membro.funcao, membro.email]),
      );
    }

    if (abaAtiva === "projetos-por-eixo") {
      return makeCsv(
        ["Eixo", "Total de projetos", "Aprovados", "Em desenvolvimento", "Pendentes"],
        dados.projetosEixo.map((projeto) => [projeto.eixo, projeto.total, projeto.aprovados, projeto.emDesenvolvimento, projeto.pendentes]),
      );
    }

    if (abaAtiva === "orientadores-projetos") {
      return makeCsv(
        ["Nome do orientador", "Total de projetos", "Lista de projetos"],
        dados.orientadoresProjetos.map((orientador) => [
          orientador.orientador,
          orientador.total,
          orientador.projetos.map((projeto) => `${projeto.titulo} (${projeto.status}) - ${projeto.aluno}`).join(" | "),
        ]),
      );
    }

    if (abaAtiva === "projetos-por-turma") {
      return makeCsv(
        ["Turma", "Total de projetos", "Projetos aprovados", "Média de notas"],
        dados.projetosTurma.map((projeto) => [projeto.turma, projeto.total, projeto.aprovados, projeto.mediaNota.toFixed(1)]),
      );
    }

    if (abaAtiva === "ranking-geral-eixo") {
      return makeCsv(
        ["Posição", "Título do projeto", "Eixo", "Nota", "Aluno", "Orientador"],
        rankingOrdenado.map((projeto) => [projeto.posicao, projeto.titulo, projeto.eixo, projeto.nota.toFixed(1), projeto.aluno, projeto.orientador]),
      );
    }

    if (abaAtiva === "avaliacoes-pendentes") {
      return makeCsv(
        ["Título", "Aluno", "Turma", "Orientador", "Status atual", "Dias sem atualização"],
        dados.projetosPendentes.map((projeto) => [projeto.titulo, projeto.aluno, projeto.turma, projeto.orientador, projeto.status, projeto.diasSemAtualizacao]),
      );
    }

    return makeCsv(
      ["Data/hora", "Usuário que alterou", "Ação realizada", "Projeto afetado", "Valor anterior", "Valor novo", "IP"],
      dados.logsAuditoria.map((log) => [log.quando, log.usuario, log.acao, log.projeto, log.valorAnterior, log.valorNovo, log.ip]),
    );
  }

  function handleExportCsv() {
    const csv = csvAtual();
    downloadBlob(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }), `${abaAtiva}.csv`);
  }

  async function handleExportPdf() {
    setAviso(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}/pdf/relatorios/projetos`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ tipo: abaAtiva }),
      });

      if (!response.ok) throw new Error(`PDF indisponível: ${response.status}`);

      const blob = await response.blob();
      downloadBlob(blob, `${abaAtiva}.pdf`);
    } catch {
      setAviso("Não foi possível exportar o PDF agora. Os dados continuam disponíveis na tabela.");
    }
  }

  async function handleAtualizarDados() {
    setCarregando(true);
    setAviso(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE_URL}${relatorioAtivo.endpoint}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });

      if (!response.ok) throw new Error("Endpoint indisponível");

      const payload: unknown = await response.json();
      const lista = Array.isArray(payload)
        ? payload
        : typeof payload === "object" && payload !== null && "data" in payload && Array.isArray(payload.data)
        ? payload.data
        : null;

      if (!lista) throw new Error("Formato inválido");

      setDados((atual) => ({
        ...atual,
        [dataKeyByReport[abaAtiva]]: lista,
      }));
    } catch {
      setAviso("Backend ainda não retornou este relatório. Mantive os dados mockados para acompanhamento.");
    } finally {
      setCarregando(false);
    }
  }

  function renderTabela() {
    if (abaAtiva === "alunos-sem-projeto") {
      return (
        <div className="grid gap-4">
          {Object.entries(alunosPorTurma).map(([turma, alunos]) => (
            <section key={turma} className="grid gap-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-black text-slate-800">{turma}</h3>
                <span className="rounded-full bg-sectec-50 px-3 py-1 text-xs font-bold text-sectec-700">{alunos.length} alunos</span>
              </div>
              <TableShell>
                <table className="min-w-full divide-y divide-slate-100">
                  <thead className="bg-slate-50">
                    <tr>
                      <Th>Nome</Th>
                      <Th>Turma</Th>
                      <Th>E-mail</Th>
                      <Th>Data de cadastro</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {alunos.map((aluno, index) => (
                      <tr key={aluno.id} className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-sectec-50/40`}>
                        <Td strong>{aluno.nome}</Td>
                        <Td>{aluno.turma}</Td>
                        <Td>{aluno.email}</Td>
                        <Td>{aluno.cadastradoEm}</Td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </TableShell>
            </section>
          ))}
        </div>
      );
    }

    if (abaAtiva === "comissao-organizadora") {
      return (
        <TableShell>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <Th>Nome</Th>
                <Th>Turma</Th>
                <Th>Função na comissão</Th>
                <Th>E-mail</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dados.membrosComissao.map((membro, index) => (
                <tr key={membro.id} className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-sectec-50/40`}>
                  <Td strong>{membro.nome}</Td>
                  <Td>{membro.turma}</Td>
                  <Td>{membro.funcao}</Td>
                  <Td>{membro.email}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      );
    }

    if (abaAtiva === "projetos-por-eixo") {
      return (
        <TableShell>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <Th>Eixo</Th>
                <Th>Total de projetos</Th>
                <Th>Aprovados</Th>
                <Th>Em desenvolvimento</Th>
                <Th>Pendentes</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dados.projetosEixo.map((projeto, index) => (
                <tr key={projeto.eixo} className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-sectec-50/40`}>
                  <Td strong>{projeto.eixo}</Td>
                  <Td>{projeto.total}</Td>
                  <Td>{projeto.aprovados}</Td>
                  <Td>{projeto.emDesenvolvimento}</Td>
                  <Td>{projeto.pendentes}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      );
    }

    if (abaAtiva === "orientadores-projetos") {
      return (
        <TableShell>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <Th>Nome do orientador</Th>
                <Th>Total de projetos</Th>
                <Th>Lista de projetos</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dados.orientadoresProjetos.map((orientador, index) => (
                <tr key={orientador.orientador} className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-sectec-50/40`}>
                  <Td strong>{orientador.orientador}</Td>
                  <Td>{orientador.total}</Td>
                  <Td>
                    <div className="flex min-w-[340px] flex-wrap gap-2">
                      {orientador.projetos.map((projeto) => (
                        <span key={projeto.id} className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
                          <strong className="text-slate-900">{projeto.titulo}</strong> · {projeto.aluno} · {projeto.status}
                        </span>
                      ))}
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      );
    }

    if (abaAtiva === "projetos-por-turma") {
      return (
        <TableShell>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <Th>Turma</Th>
                <Th>Total de projetos</Th>
                <Th>Projetos aprovados</Th>
                <Th>Média de notas</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dados.projetosTurma.map((projeto, index) => (
                <tr key={projeto.turma} className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-sectec-50/40`}>
                  <Td strong>{projeto.turma}</Td>
                  <Td>{projeto.total}</Td>
                  <Td>{projeto.aprovados}</Td>
                  <Td>{projeto.mediaNota.toFixed(1)}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      );
    }

    if (abaAtiva === "ranking-geral-eixo") {
      return (
        <TableShell>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <Th>Posição</Th>
                <Th>Título do projeto</Th>
                <Th>Eixo</Th>
                <Th>Nota</Th>
                <Th>Aluno</Th>
                <Th>Orientador</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rankingOrdenado.map((projeto, index) => (
                <tr key={projeto.titulo} className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-sectec-50/40`}>
                  <Td strong>{projeto.posicao}º</Td>
                  <Td strong>{projeto.titulo}</Td>
                  <Td>{projeto.eixo}</Td>
                  <Td>{projeto.nota.toFixed(1)}</Td>
                  <Td>{projeto.aluno}</Td>
                  <Td>{projeto.orientador}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      );
    }

    if (abaAtiva === "avaliacoes-pendentes") {
      return (
        <TableShell>
          <table className="min-w-full divide-y divide-slate-100">
            <thead className="bg-slate-50">
              <tr>
                <Th>Título</Th>
                <Th>Aluno</Th>
                <Th>Turma</Th>
                <Th>Orientador</Th>
                <Th>Status atual</Th>
                <Th>Dias sem atualização</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {dados.projetosPendentes.map((projeto, index) => (
                <tr key={projeto.id} className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-sectec-50/40`}>
                  <Td strong>{projeto.titulo}</Td>
                  <Td>{projeto.aluno}</Td>
                  <Td>{projeto.turma}</Td>
                  <Td>{projeto.orientador}</Td>
                  <Td><StatusBadge value={projeto.status} /></Td>
                  <Td>{projeto.diasSemAtualizacao} dias</Td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableShell>
      );
    }

    return (
      <TableShell>
        <table className="min-w-full divide-y divide-slate-100">
          <thead className="bg-slate-50">
            <tr>
              <Th>Data/hora</Th>
              <Th>Usuário que alterou</Th>
              <Th>Ação realizada</Th>
              <Th>Projeto afetado</Th>
              <Th>Valor anterior</Th>
              <Th>Valor novo</Th>
              <Th>IP</Th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dados.logsAuditoria.map((log, index) => (
              <tr key={log.id} className={`${index % 2 ? "bg-slate-50/50" : "bg-white"} transition hover:bg-sectec-50/40`}>
                <Td strong>{log.quando}</Td>
                <Td>{log.usuario}</Td>
                <Td>{log.acao}</Td>
                <Td>{log.projeto}</Td>
                <Td>{log.valorAnterior}</Td>
                <Td>{log.valorNovo}</Td>
                <Td>{log.ip ?? "-"}</Td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableShell>
    );
  }

  return (
    <MainLayout userRole="coordenador">
      <main className="min-h-screen bg-[#f4f9f6] px-4 py-5 font-sans sm:px-7 sm:py-7">
        <div className="mx-auto grid max-w-[1500px] gap-5">
          <header className="overflow-hidden rounded-2xl border border-[#0b4d2c]/10 bg-[#0b4d2c] shadow-sm">
            <div className="flex flex-col gap-5 p-6 text-white sm:p-8 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="mb-3 text-xs font-black uppercase tracking-[0.18em] text-white/60">Coordenação SECTEC</p>
                <h1 className="text-3xl font-black leading-tight sm:text-4xl">Status dos Alunos</h1>
                <p className="mt-3 max-w-3xl text-sm leading-6 text-white/75">
                  Relatórios consolidados para acompanhamento e auditoria da feira.
                </p>
              </div>

              <button
                type="button"
                onClick={handleAtualizarDados}
                disabled={carregando}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-black text-[#0b4d2c] shadow-sm transition hover:bg-sectec-50 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                <PiClockCounterClockwise size={18} className={carregando ? "animate-spin" : ""} />
                Atualizar dados
              </button>
            </div>
          </header>

          {aviso && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800 shadow-sm">
              <PiWarningCircle className="mt-0.5 shrink-0" size={18} />
              <span>{aviso}</span>
            </div>
          )}

          <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto border-b border-slate-200">
              <div className="flex min-w-max gap-1 px-3 pt-3">
                {relatorios.map((relatorio) => {
                  const ativo = relatorio.id === abaAtiva;
                  return (
                    <button
                      key={relatorio.id}
                      type="button"
                      onClick={() => setAbaAtiva(relatorio.id)}
                      className={`inline-flex items-center gap-2 rounded-t-xl border-b-2 px-4 py-3 text-sm font-black transition ${
                        ativo
                          ? "border-[#0b4d2c] bg-white text-[#0b4d2c]"
                          : "border-transparent bg-slate-50 text-slate-500 hover:bg-sectec-50 hover:text-sectec-700"
                      }`}
                    >
                      {relatorio.icon}
                      {relatorio.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-5 p-4 sm:p-6">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-xl font-black text-slate-950">{relatorioAtivo.titulo}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">Dados operacionais da aba selecionada, com exportação imediata.</p>
                </div>

                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={handleExportPdf}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-sectec-700 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sectec-800"
                  >
                    <PiFilePdf size={18} />
                    Exportar PDF
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sectec-200 hover:bg-sectec-50 hover:text-sectec-700"
                  >
                    <PiUploadSimple size={18} />
                    Exportar CSV
                  </button>
                </div>
              </div>

              {renderTabela()}
            </div>
          </section>
        </div>
      </main>
    </MainLayout>
  );
}

export default RelatorioStatusAlunos;
