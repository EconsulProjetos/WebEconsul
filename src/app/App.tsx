import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  LayoutDashboard, FolderKanban, Briefcase, Calendar, Users, BarChart3,
  FileText, Settings, Search, Bell, Moon, Sun, Plus, CheckCircle2,
  Activity, Download, Eye, MoreHorizontal, ChevronLeft, ChevronRight,
  Paperclip, Target, LogOut, Building2, X, AlertTriangle, Zap, Clock,
  CalendarDays, BookOpen, GraduationCap, Video, Play, Pencil,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

// ─── Types ───────────────────────────────────────────────────────────────────
type Page = "dashboard" | "projects" | "services" | "calendar" | "team" | "kpis" | "reports" | "manuais" | "capacitacao" | "settings";
type ProjectStatus = "pending" | "active" | "review" | "completed" | "delayed";
type Priority = "low" | "medium" | "high" | "urgent";
type ServiceStatus = "open" | "in_progress" | "review" | "completed";
type DemandaStatus = "na_fila" | "em_curso" | "entregue";
type Urgencia = "alta" | "media" | "baixa";
type Importancia = "critica" | "alta" | "moderada" | "baixa";
type EventType = "meeting" | "deadline" | "milestone" | "review" | "workshop" | "training";

interface Project {
  id: string; name: string; client: string; status: ProjectStatus;
  progress: number; leader: string; startDate: string; endDate: string;
  budget: number; tags: string[];
}

interface Service {
  code: string; name: string; category: string; responsible: string;
  priority: Priority; status: ServiceStatus; startDate: string;
  endDate: string; attachments: number; project: string;
}

interface TeamMember {
  id: string; name: string; role: string; email: string;
  hoursAvailable: number; hoursUsed: number; projects: string[];
  skills: string[]; initials: string; color: string;
}

interface CalEvent {
  id: string; title: string; date: string; time: string;
  type: EventType; project?: string; attendees: string[];
  color?: string; description?: string;
}

interface Demanda {
  id: string; titulo: string; responsavel: string;
  urgencia: Urgencia; importancia: Importancia; prazo: string;
  status: DemandaStatus; pdfName?: string; pdfUrl?: string;
}

// ─── Empty data ───────────────────────────────────────────────────────────────
const statusCfg: Record<ProjectStatus, { label: string; textCls: string; bgCls: string }> = {
  pending:   { label: "Pendente",     textCls: "text-amber-700 dark:text-amber-400",    bgCls: "bg-amber-50 dark:bg-amber-900/20" },
  active:    { label: "Em Andamento", textCls: "text-blue-700 dark:text-blue-400",      bgCls: "bg-blue-50 dark:bg-blue-900/20" },
  review:    { label: "Em Revisão",   textCls: "text-purple-700 dark:text-purple-400",  bgCls: "bg-purple-50 dark:bg-purple-900/20" },
  completed: { label: "Concluído",    textCls: "text-emerald-700 dark:text-emerald-400", bgCls: "bg-emerald-50 dark:bg-emerald-900/20" },
  delayed:   { label: "Atrasado",     textCls: "text-red-700 dark:text-red-400",        bgCls: "bg-red-50 dark:bg-red-900/20" },
};

const priorityCfg: Record<Priority, { label: string; textCls: string; dot: string }> = {
  low:    { label: "Baixa",   textCls: "text-slate-500",                       dot: "bg-slate-400" },
  medium: { label: "Média",   textCls: "text-amber-700 dark:text-amber-400",   dot: "bg-amber-500" },
  high:   { label: "Alta",    textCls: "text-orange-700 dark:text-orange-400", dot: "bg-orange-500" },
  urgent: { label: "Urgente", textCls: "text-red-700 dark:text-red-400",       dot: "bg-red-500" },
};

const svcStatusCfg: Record<ServiceStatus, { label: string; textCls: string; bgCls: string }> = {
  open:        { label: "Aberto",      textCls: "text-slate-600 dark:text-slate-300",     bgCls: "bg-slate-100 dark:bg-slate-800" },
  in_progress: { label: "Em Execução", textCls: "text-blue-700 dark:text-blue-400",       bgCls: "bg-blue-50 dark:bg-blue-900/20" },
  review:      { label: "Em Revisão",  textCls: "text-purple-700 dark:text-purple-400",   bgCls: "bg-purple-50 dark:bg-purple-900/20" },
  completed:   { label: "Concluído",   textCls: "text-emerald-700 dark:text-emerald-400", bgCls: "bg-emerald-50 dark:bg-emerald-900/20" },
};

const urgCfg: Record<Urgencia, { label: string; textCls: string; bgCls: string; barColor: string }> = {
  alta:  { label: "Alta",  textCls: "text-red-700 dark:text-red-400",    bgCls: "bg-red-50 dark:bg-red-900/20",    barColor: "#DC2626" },
  media: { label: "Média", textCls: "text-amber-700 dark:text-amber-400", bgCls: "bg-amber-50 dark:bg-amber-900/20", barColor: "#D97706" },
  baixa: { label: "Baixa", textCls: "text-slate-500 dark:text-slate-400", bgCls: "bg-slate-50 dark:bg-slate-800",   barColor: "#94A3B8" },
};

const impCfg: Record<Importancia, { label: string; textCls: string; bgCls: string; barColor: string }> = {
  critica:  { label: "Crítica",  textCls: "text-red-700 dark:text-red-400",      bgCls: "bg-red-100 dark:bg-red-900/30",    barColor: "#DC2626" },
  alta:     { label: "Alta",     textCls: "text-orange-700 dark:text-orange-400", bgCls: "bg-orange-100 dark:bg-orange-900/30", barColor: "#EA580C" },
  moderada: { label: "Moderada", textCls: "text-amber-700 dark:text-amber-400",   bgCls: "bg-amber-100 dark:bg-amber-900/30", barColor: "#D97706" },
  baixa:    { label: "Baixa",    textCls: "text-slate-500 dark:text-slate-400",   bgCls: "bg-slate-100 dark:bg-slate-800",   barColor: "#94A3B8" },
};

const evtCfg: Record<EventType, { label: string; color: string; lightBg: string; textColor: string }> = {
  meeting:  { label: "Reunião",    color: "#6B1A2C", lightBg: "rgba(107,26,44,0.12)",  textColor: "#6B1A2C" },
  deadline: { label: "Prazo",      color: "#DC2626", lightBg: "rgba(220,38,38,0.12)",  textColor: "#DC2626" },
  milestone:{ label: "Marco",      color: "#7C3AED", lightBg: "rgba(124,58,237,0.12)", textColor: "#7C3AED" },
  review:   { label: "Revisão",    color: "#D97706", lightBg: "rgba(217,119,6,0.12)",  textColor: "#D97706" },
  workshop: { label: "Workshop",   color: "#0891B2", lightBg: "rgba(8,145,178,0.12)",  textColor: "#0891B2" },
  training: { label: "Capacitação",color: "#059669", lightBg: "rgba(5,150,105,0.12)",  textColor: "#059669" },
};

const DEMANDA_COLS: {
  status: DemandaStatus; title: string; subtitle: string;
  headerCls: string; dot: string; emptyMsg: string;
}[] = [
  { status: "na_fila",  title: "Na Fila",  subtitle: "Aguardando início",     headerCls: "bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700", dot: "bg-slate-400",   emptyMsg: "Nenhuma demanda aguardando." },
  { status: "em_curso", title: "Em Curso", subtitle: "Em execução agora",     headerCls: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",     dot: "bg-blue-500",    emptyMsg: "Nenhuma demanda em execução." },
  { status: "entregue", title: "Entregues",subtitle: "Finalizadas com sucesso",headerCls: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500", emptyMsg: "Nenhuma demanda entregue ainda." },
];

function calcPrazo(prazo: string) {
  const diff = Math.ceil((new Date(prazo).getTime() - Date.now()) / 86400000);
  if (diff < 0)  return { label: `${Math.abs(diff)}d vencido`,  cls: "text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20" };
  if (diff <= 3) return { label: `${diff}d restantes`,          cls: "text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20" };
  if (diff <= 7) return { label: `${diff}d restantes`,          cls: "text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20" };
  return          { label: prazo,                                cls: "text-muted-foreground bg-muted/50" };
}

// ─── Modal wrapper ─────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <h3 className="text-base font-bold text-foreground">{title}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-muted text-muted-foreground transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-bold text-muted-foreground mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const fmtDate = (d: string) => { if (!d) return "—"; const [y,m,day] = d.split("-"); return `${day}/${m}/${y}`; };
const inputCls ="w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 placeholder:text-muted-foreground/50";
const selectCls = "w-full text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30";

// ─── Shared UI ────────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: ProjectStatus }) {
  const c = statusCfg[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.textCls} ${c.bgCls}`}>{c.label}</span>;
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const c = priorityCfg[priority];
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${c.textCls}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
      {c.label}
    </span>
  );
}

function SvcBadge({ status }: { status: ServiceStatus }) {
  const c = svcStatusCfg[status];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.textCls} ${c.bgCls}`}>{c.label}</span>;
}

function StatCard({ title, value, sub, icon: Icon }: {
  title: string; value: string | number; sub?: string; icon: React.ElementType;
}) {
  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{title}</span>
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub }: { icon: React.ElementType; title: string; sub: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-center">
      <div className="w-11 h-11 rounded-2xl bg-muted flex items-center justify-center mb-3">
        <Icon className="w-5 h-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{sub}</p>
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function DashboardPage({ projects, events }: { projects: Project[]; events: CalEvent[] }) {
  const active = projects.filter(p => p.status === "active").length;
  const done   = projects.filter(p => p.status === "completed").length;
  const budget = projects.reduce((s, p) => s + p.budget, 0);
  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Visão geral da Econsul. Cadastre projetos, serviços e equipe para ativar os indicadores.
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total de Projetos"  value={projects.length}   sub={projects.length === 0 ? "Nenhum projeto ainda" : `${active} em andamento`} icon={FolderKanban} />
        <StatCard title="Em Andamento"       value={active}            sub="Projetos ativos"              icon={Activity} />
        <StatCard title="Concluídos"         value={done}              sub="Entregas realizadas"           icon={CheckCircle2} />
        <StatCard title="Receita Contratada" value={budget === 0 ? "R$ 0" : `R$ ${(budget/1000).toFixed(0)}k`} sub="Total do portfólio" icon={Target} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-2">Projetos Recentes</h3>
          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="Nenhum projeto" sub="Vá até Projetos e crie o primeiro." />
          ) : (
            <div className="space-y-2 mt-3">
              {projects.slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">{p.client}</p>
                  </div>
                  <div className="w-20">
                    <div className="w-full bg-muted rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5 text-right">{p.progress}%</p>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-2">Próximos Eventos</h3>
          {upcoming.length === 0 ? (
            <EmptyState icon={Calendar} title="Nenhum evento" sub="Acesse o Calendário para adicionar reuniões e marcos." />
          ) : (
            <div className="space-y-2 mt-3">
              {upcoming.map(ev => {
                const cfg = evtCfg[ev.type];
                return (
                  <div key={ev.id} className="flex items-start gap-2.5 p-2 rounded-lg hover:bg-muted/30 transition-colors">
                    <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">{ev.title}</p>
                      <p className="text-[11px] text-muted-foreground">{ev.date}{ev.time ? ` · ${ev.time}` : ""}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Projects ────────────────────────────────────────────────────────────────
const BLANK_PROJECT: Omit<Project, "id"> = {
  name: "", client: "", status: "pending", progress: 0,
  leader: "", startDate: "", endDate: "", budget: 0, tags: [],
};

function ProjectsPage({ projects, setProjects, pushUndo }: {
  pushUndo: () => void;
  projects: Project[]; setProjects: React.Dispatch<React.SetStateAction<Project[]>>;
}) {
  const [view, setView] = useState<"kanban" | "list">("kanban");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...BLANK_PROJECT, tagsRaw: "" });

  const save = () => {
    if (!form.name.trim()) return;
    const newP: Project = {
      ...form,
      id: `PRJ-${String(projects.length + 1).padStart(3, "0")}`,
      tags: form.tagsRaw.split(",").map(t => t.trim()).filter(Boolean),
    };
    setProjects(prev => [...prev, newP]);
    setForm({ ...BLANK_PROJECT, tagsRaw: "" });
    setShowModal(false);
  };

  const cols: { status: ProjectStatus; label: string; accent: string; dot: string }[] = [
    { status: "pending",   label: "Pendente",     accent: "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800",       dot: "bg-amber-400" },
    { status: "active",    label: "Em Andamento", accent: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",           dot: "bg-blue-500" },
    { status: "review",    label: "Em Revisão",   accent: "bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800",   dot: "bg-purple-500" },
    { status: "completed", label: "Concluído",    accent: "bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800", dot: "bg-emerald-500" },
    { status: "delayed",   label: "Atrasado",     accent: "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800",               dot: "bg-red-500" },
  ];

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Novo Projeto" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Nome do Projeto *">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Diagnóstico Econômico Regional" className={inputCls} />
                </Field>
              </div>
              <Field label="Cliente *">
                <input value={form.client} onChange={e => setForm(f => ({ ...f, client: e.target.value }))} placeholder="Nome do cliente" className={inputCls} />
              </Field>
              <Field label="Responsável">
                <input value={form.leader} onChange={e => setForm(f => ({ ...f, leader: e.target.value }))} placeholder="Nome do responsável" className={inputCls} />
              </Field>
              <Field label="Status">
                <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ProjectStatus }))} className={selectCls}>
                  {Object.entries(statusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Field>
              <Field label="Progresso (%)">
                <input type="number" min={0} max={100} value={form.progress} onChange={e => setForm(f => ({ ...f, progress: Number(e.target.value) }))} className={inputCls} />
              </Field>
              <Field label="Data de Início">
                <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Data de Entrega">
                <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Orçamento (R$)">
                <input type="number" min={0} value={form.budget} onChange={e => setForm(f => ({ ...f, budget: Number(e.target.value) }))} placeholder="0" className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Tags (separadas por vírgula)">
                  <input value={form.tagsRaw} onChange={e => setForm(f => ({ ...f, tagsRaw: e.target.value }))} placeholder="Ex.: Econometria, Pesquisa, UFRN" className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">Salvar Projeto</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Projetos</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{projects.length} projetos no portfólio</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-muted p-1 rounded-lg">
            {(["kanban", "list"] as const).map(v => (
              <button key={v} onClick={() => setView(v)}
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors ${view === v ? "bg-card shadow-sm text-foreground" : "text-muted-foreground"}`}>
                {v === "kanban" ? "Kanban" : "Lista"}
              </button>
            ))}
          </div>
          <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" />
            Novo Projeto
          </button>
        </div>
      </div>

      {view === "kanban" && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-[900px]">
            {cols.map(col => {
              const cards = projects.filter(p => p.status === col.status);
              const totalBudget = cards.reduce((s, p) => s + p.budget, 0);
              return (
                <div key={col.status} className="flex flex-col gap-2 flex-1 min-w-[200px]">
                  <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${col.accent}`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                      <span className="text-xs font-bold text-foreground">{col.label}</span>
                    </div>
                    <span className="w-5 h-5 rounded-full bg-white/60 dark:bg-black/20 text-foreground text-[10px] flex items-center justify-center font-bold shadow-sm">
                      {cards.length}
                    </span>
                  </div>
                  {cards.length > 0 && (
                    <p className="text-[10px] text-muted-foreground font-mono px-1">
                      Total: R$ {(totalBudget / 1000).toFixed(1)}k
                    </p>
                  )}
                  <div className="flex flex-col gap-2 flex-1">
                    {cards.map(p => {
                      const daysLeft = p.endDate ? Math.ceil((new Date(p.endDate).getTime() - Date.now()) / 86400000) : null;
                      const isOverdue = daysLeft !== null && daysLeft < 0;
                      const isUrgent  = daysLeft !== null && !isOverdue && daysLeft <= 7;
                      return (
                        <div key={p.id} className="bg-card border border-border rounded-xl p-3.5 hover:shadow-md transition-shadow cursor-pointer">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-mono text-muted-foreground">{p.id}</span>
                            {daysLeft !== null && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isOverdue ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400" : isUrgent ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" : "bg-muted text-muted-foreground"}`}>
                                {isOverdue ? `${Math.abs(daysLeft)}d atraso` : isUrgent ? `${daysLeft}d restantes` : p.endDate}
                              </span>
                            )}
                          </div>
                          <h4 className="text-xs font-bold text-foreground leading-snug mb-1">{p.name}</h4>
                          <p className="text-[11px] text-muted-foreground mb-2.5">{p.client}</p>
                          <div className="mb-3">
                            <div className="flex justify-between text-[10px] mb-1">
                              <span className="text-muted-foreground">Progresso</span>
                              <span className="font-bold text-foreground">{p.progress}%</span>
                            </div>
                            <div className="w-full bg-muted rounded-full h-1.5">
                              <div className="h-1.5 rounded-full transition-all" style={{ width: `${p.progress}%`, backgroundColor: isOverdue ? "#DC2626" : p.status === "completed" ? "#059669" : "var(--primary)" }} />
                            </div>
                          </div>
                          {p.leader && (
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">
                                  {p.leader.split(" ").map((n: string) => n[0]).join("").slice(0, 2)}
                                </div>
                                <span className="text-[11px] text-muted-foreground">{p.leader.split(" ")[0]}</span>
                              </div>
                              {p.budget > 0 && <span className="text-[10px] font-mono text-muted-foreground">R$ {(p.budget / 1000).toFixed(1)}k</span>}
                            </div>
                          )}
                          {p.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {p.tags.map((t: string) => (
                                <span key={t} className="px-1.5 py-0.5 bg-primary/10 text-primary text-[9px] font-bold rounded">{t}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {cards.length === 0 && (
                      <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                        <p className="text-[11px] text-muted-foreground">Nenhum projeto</p>
                      </div>
                    )}
                    <button onClick={() => setShowModal(true)} className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl border border-dashed border-border text-[11px] text-muted-foreground hover:bg-muted/40 hover:text-foreground transition-colors">
                      <Plus className="w-3 h-3" />
                      Adicionar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {view === "list" && (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {projects.length === 0 ? (
            <EmptyState icon={FolderKanban} title="Nenhum projeto cadastrado" sub="Clique em Novo Projeto para começar." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["ID", "Projeto", "Cliente", "Responsável", "Status", "Progresso", "Orçamento", "Prazo"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr key={p.id} className={`border-b border-border hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/5" : ""}`}>
                      <td className="px-4 py-3 text-[11px] font-mono text-muted-foreground">{p.id}</td>
                      <td className="px-4 py-3 text-xs font-semibold text-foreground max-w-52">{p.name}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.client}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.leader}</td>
                      <td className="px-4 py-3"><StatusBadge status={p.status} /></td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-muted rounded-full h-1.5">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${p.progress}%` }} />
                          </div>
                          <span className="text-[11px] text-muted-foreground font-mono">{p.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-mono text-foreground">R$ {p.budget.toLocaleString("pt-BR")}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{p.endDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Services ────────────────────────────────────────────────────────────────
const BLANK_SERVICE: Service = {
  code: "", name: "", category: "", responsible: "",
  priority: "medium", status: "open", startDate: "", endDate: "",
  attachments: 0, project: "",
};

type EtapaStatus = "nao_iniciada" | "em_andamento" | "concluida";

interface Entregavel {
  id: string; nome: string; fileName: string; fileUrl: string; data: string;
}

interface Etapa {
  id: string; titulo: string; descricao: string;
  responsavel: string; status: EtapaStatus;
  entregaveis: Entregavel[];
}

const etapaStatusCfg: Record<EtapaStatus, { label: string; color: string; dot: string; border: string; bg: string; hex: string }> = {
  nao_iniciada: { label: "Não iniciada", color: "text-slate-500",                        dot: "bg-slate-300",   border: "border-slate-200 dark:border-slate-700", bg: "bg-slate-50 dark:bg-slate-900/30",    hex: "#94A3B8" },
  em_andamento: { label: "Em andamento", color: "text-blue-600 dark:text-blue-400",      dot: "bg-blue-500",    border: "border-blue-300 dark:border-blue-700",   bg: "bg-blue-50 dark:bg-blue-900/20",      hex: "#3B82F6" },
  concluida:    { label: "Concluída",    color: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500", border: "border-emerald-300 dark:border-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-900/20", hex: "#10B981" },
};

const BLANK_ETAPA: Omit<Etapa, "id"> = { titulo: "", descricao: "", responsavel: "", status: "nao_iniciada", entregaveis: [] };

// ─── Infographic View ────────────────────────────────────────────────────────
const INFOGRAPHIC_THEMES = [
  { name: "Econsul",  primary: "#6B1A2C", accent: "#C45A78" },
  { name: "Oceano",   primary: "#1D4ED8", accent: "#60A5FA" },
  { name: "Floresta", primary: "#065F46", accent: "#34D399" },
  { name: "Âmbar",    primary: "#92400E", accent: "#FBBF24" },
  { name: "Grafite",  primary: "#1F2937", accent: "#6B7280" },
];

function InfographicView({ service, etapas, onClose, onBackToFluxograma }: {
  service: Service; etapas: Etapa[]; onClose: () => void; onBackToFluxograma?: () => void;
}) {
  const [themeIdx, setThemeIdx] = useState(0);
  const [layout, setLayout] = useState<"timeline" | "grid">("timeline");
  const [showDesc, setShowDesc] = useState(true);
  const t = INFOGRAPHIC_THEMES[themeIdx];

  const concluidas = etapas.filter(e => e.status === "concluida").length;
  const emAndamento = etapas.filter(e => e.status === "em_andamento").length;
  const naoIniciadas = etapas.filter(e => e.status === "nao_iniciada").length;
  const pct = etapas.length ? Math.round((concluidas / etapas.length) * 100) : 0;
  const totalEntregaveis = etapas.reduce((sum, e) => sum + (e.entregaveis ?? []).length, 0);

  return (
    <div className="fixed inset-0 z-[60] bg-background overflow-y-auto">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      {/* Top bar */}
      <div className="no-print sticky top-0 z-10 bg-card border-b border-border flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
          {onBackToFluxograma && (
            <button onClick={onBackToFluxograma} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs font-semibold text-foreground transition-colors">
              <ChevronLeft className="w-3.5 h-3.5" />Voltar ao Fluxograma
            </button>
          )}
          <span className="text-sm font-bold text-foreground">Infográfico — {service.name}</span>
        </div>
        <button onClick={() => window.print()} className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90">
          <Download className="w-3.5 h-3.5" />Exportar PDF
        </button>
      </div>

      {/* Customization bar */}
      <div className="no-print bg-muted/40 border-b border-border px-6 py-3 flex items-center gap-6 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Tema:</span>
          {INFOGRAPHIC_THEMES.map((th, i) => (
            <button key={th.name} onClick={() => setThemeIdx(i)} title={th.name}
              className={`w-5 h-5 rounded-full border-2 transition-all ${themeIdx === i ? "scale-110 border-foreground" : "border-transparent"}`}
              style={{ backgroundColor: th.primary }} />
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Layout:</span>
          {([["timeline","Timeline"],["grid","Grade"]] as const).map(([l, label]) => (
            <button key={l} onClick={() => setLayout(l)}
              className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${layout === l ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-accent"}`}>
              {label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-muted-foreground">Descrição:</span>
          <button onClick={() => setShowDesc(v => !v)}
            className={`text-xs px-2.5 py-1 rounded-lg font-semibold ${showDesc ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
            {showDesc ? "Visível" : "Oculta"}
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Hero header */}
        <div className="rounded-2xl overflow-hidden shadow-xl" style={{ background: `linear-gradient(135deg, ${t.primary} 0%, ${t.accent} 100%)` }}>
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-start justify-between gap-6">
              <div className="flex-1">
                <p className="text-[10px] font-bold text-white/50 uppercase tracking-[0.2em] mb-2">Infográfico do Serviço · Econsul</p>
                <h1 className="text-3xl font-bold text-white leading-tight mb-1">{service.name}</h1>
                {service.category && <p className="text-sm text-white/70 font-medium">{service.category}</p>}
              </div>
              <div className="flex-shrink-0 text-right">
                <div className="text-5xl font-black text-white">{pct}%</div>
                <div className="text-[11px] text-white/60 font-semibold mt-0.5">concluído</div>
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-5">
              <div className="w-full bg-white/20 rounded-full h-3 overflow-hidden">
                <div className="h-3 rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
              </div>
              <div className="flex justify-between text-[10px] text-white/60 mt-1.5 font-medium">
                <span>Início</span>
                <span>Conclusão</span>
              </div>
            </div>
          </div>

          {/* Stats bar */}
          <div className="grid grid-cols-5 divide-x divide-white/10 bg-black/20">
            {[
              ["Total de Etapas", etapas.length],
              ["Concluídas", concluidas],
              ["Em Andamento", emAndamento],
              ["Não Iniciadas", naoIniciadas],
              ["Entregáveis", totalEntregaveis],
            ].map(([label, val]) => (
              <div key={label as string} className="px-4 py-3 text-center">
                <p className="text-xl font-black text-white">{val}</p>
                <p className="text-[9px] text-white/55 font-semibold uppercase tracking-wide mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Responsible */}
          {service.responsible && (
            <div className="px-8 py-3 bg-black/10 flex items-center gap-3 border-t border-white/10">
              <div className="w-7 h-7 rounded-full bg-white/25 flex items-center justify-center text-white text-[10px] font-black">
                {service.responsible.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
              </div>
              <div>
                <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wide">Responsável</p>
                <p className="text-xs text-white/90 font-semibold">{service.responsible}</p>
              </div>
              {service.startDate && (
                <div className="ml-auto text-right">
                  <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wide">Período</p>
                  <p className="text-xs text-white/80 font-mono">{fmtDate(service.startDate)}{service.endDate ? ` → ${fmtDate(service.endDate)}` : ""}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Charts section */}
        {etapas.length > 0 && (
          <div className="grid grid-cols-2 gap-5">
            {/* Bar chart — etapas por status */}
            <div className="bg-card border border-border rounded-xl p-5">
              <p className="text-xs font-bold text-foreground mb-4">Etapas por Status</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={[
                  { name: "Não iniciada", qtd: naoIniciadas, fill: etapaStatusCfg.nao_iniciada.hex },
                  { name: "Em andamento", qtd: emAndamento,  fill: etapaStatusCfg.em_andamento.hex },
                  { name: "Concluída",    qtd: concluidas,   fill: etapaStatusCfg.concluida.hex },
                ]} barSize={36} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ fontSize: 11, borderRadius: 8, border: "1px solid var(--border)", background: "var(--card)" }}
                    formatter={(v: number) => [`${v} etapa${v !== 1 ? "s" : ""}`, ""]}
                    labelStyle={{ fontWeight: 700, color: "var(--foreground)" }}
                  />
                  <Bar dataKey="qtd" radius={[6,6,0,0]} fill="#6B1A2C"
                    label={false}
                    isAnimationActive={false}
                  >
                    {[
                      { name: "Não iniciada", qtd: naoIniciadas, fill: etapaStatusCfg.nao_iniciada.hex },
                      { name: "Em andamento", qtd: emAndamento,  fill: etapaStatusCfg.em_andamento.hex },
                      { name: "Concluída",    qtd: concluidas,   fill: etapaStatusCfg.concluida.hex },
                    ].map((entry, index) => (
                      <Cell key={`bar-cell-${index}`} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Donut-style progress + entregáveis */}
            <div className="bg-card border border-border rounded-xl p-5 flex flex-col gap-4">
              <p className="text-xs font-bold text-foreground">Progresso Geral</p>

              {/* Radial visual */}
              <div className="flex items-center gap-5">
                <div className="relative w-24 h-24 flex-shrink-0">
                  <svg viewBox="0 0 80 80" className="w-24 h-24 -rotate-90">
                    <circle cx="40" cy="40" r="32" fill="none" stroke="var(--muted)" strokeWidth="10" />
                    <circle cx="40" cy="40" r="32" fill="none" stroke={t.primary} strokeWidth="10"
                      strokeDasharray={`${2 * Math.PI * 32 * pct / 100} ${2 * Math.PI * 32 * (1 - pct / 100)}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-black text-foreground">{pct}%</span>
                  </div>
                </div>
                <div className="space-y-2 flex-1">
                  {[
                    { label: "Concluídas",    val: concluidas,   hex: etapaStatusCfg.concluida.hex },
                    { label: "Em andamento",  val: emAndamento,  hex: etapaStatusCfg.em_andamento.hex },
                    { label: "Não iniciadas", val: naoIniciadas, hex: etapaStatusCfg.nao_iniciada.hex },
                  ].map(row => (
                    <div key={row.label} className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: row.hex }} />
                      <span className="text-[11px] text-muted-foreground flex-1">{row.label}</span>
                      <span className="text-[11px] font-bold text-foreground">{row.val}</span>
                    </div>
                  ))}
                </div>
              </div>

              {totalEntregaveis > 0 && (
                <div className="pt-3 border-t border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Entregáveis por Etapa</span>
                    <span className="text-[10px] font-bold text-primary">{totalEntregaveis} total</span>
                  </div>
                  <div className="space-y-1.5">
                    {etapas.filter(e => (e.entregaveis ?? []).length > 0).map(e => (
                      <div key={e.id} className="flex items-center gap-2">
                        <span className="text-[10px] text-muted-foreground flex-1 truncate">{e.titulo}</span>
                        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-1.5 rounded-full" style={{ width: `${((e.entregaveis ?? []).length / totalEntregaveis) * 100}%`, backgroundColor: t.primary }} />
                        </div>
                        <span className="text-[10px] font-bold text-foreground w-4 text-right">{(e.entregaveis ?? []).length}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Steps */}
        {etapas.length === 0 ? (
          <EmptyState icon={Activity} title="Nenhuma etapa" sub="Volte ao fluxograma e adicione etapas para gerar o infográfico." />
        ) : layout === "timeline" ? (
          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-[22px] top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {etapas.map((e, idx) => {
                const cfg = etapaStatusCfg[e.status];
                const evs = e.entregaveis ?? [];
                return (
                  <div key={e.id} className="relative flex gap-5">
                    {/* Timeline dot */}
                    <div className="flex-shrink-0 w-11 flex flex-col items-center z-10">
                      <div className="w-11 h-11 rounded-full flex items-center justify-center text-white font-black text-sm shadow-md" style={{ backgroundColor: t.primary }}>
                        {idx + 1}
                      </div>
                    </div>

                    {/* Card */}
                    <div className={`flex-1 rounded-xl border-2 overflow-hidden ${cfg.border} shadow-sm`}>
                      {/* Card header */}
                      <div className={`px-5 py-3 flex items-center justify-between ${cfg.bg}`}>
                        <h4 className="text-sm font-bold text-foreground">{e.titulo}</h4>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.color} ${cfg.border} bg-card/80`}>{cfg.label}</span>
                      </div>

                      <div className="bg-card px-5 py-4 space-y-3">
                        {showDesc && e.descricao && (
                          <p className="text-xs text-muted-foreground leading-relaxed">{e.descricao}</p>
                        )}

                        {e.responsavel && (
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-black text-white" style={{ backgroundColor: t.primary }}>
                              {e.responsavel.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
                            </div>
                            <div>
                              <p className="text-[9px] text-muted-foreground uppercase tracking-wide font-semibold">Responsável</p>
                              <p className="text-xs font-semibold text-foreground">{e.responsavel}</p>
                            </div>
                          </div>
                        )}

                        {/* Progress mini-bar for this step */}
                        <div className="flex items-center gap-3">
                          <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all" style={{
                              width: e.status === "concluida" ? "100%" : e.status === "em_andamento" ? "50%" : "0%",
                              backgroundColor: cfg.hex,
                            }} />
                          </div>
                          <span className="text-[10px] font-bold text-muted-foreground w-8 text-right">
                            {e.status === "concluida" ? "100%" : e.status === "em_andamento" ? "50%" : "0%"}
                          </span>
                        </div>

                        {/* Entregáveis */}
                        {evs.length > 0 && (
                          <div className="pt-2 border-t border-border/50">
                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mb-2">
                              Entregáveis ({evs.length})
                            </p>
                            <div className="space-y-1.5">
                              {evs.map(ev => (
                                <div key={ev.id} className="flex items-center gap-2 bg-muted/40 rounded-lg px-3 py-1.5">
                                  <FileText className="w-3 h-3 text-primary flex-shrink-0" />
                                  <span className="text-[11px] font-semibold text-foreground flex-1 truncate">{ev.nome}</span>
                                  {ev.data && <span className="text-[10px] text-muted-foreground font-mono">{ev.data}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* Grid layout */
          <div className="grid grid-cols-2 md:grid-cols-3 gap-5">
            {etapas.map((e, idx) => {
              const cfg = etapaStatusCfg[e.status];
              const evs = e.entregaveis ?? [];
              return (
                <div key={e.id} className={`rounded-xl border-2 overflow-hidden ${cfg.border} shadow-sm flex flex-col`}>
                  <div className="px-4 py-3 flex items-center gap-3" style={{ background: `linear-gradient(135deg, ${t.primary}22 0%, ${t.accent}22 100%)` }}>
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-black flex-shrink-0" style={{ backgroundColor: t.primary }}>{idx + 1}</div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-foreground leading-snug truncate">{e.titulo}</h4>
                      <span className={`text-[9px] font-bold ${cfg.color}`}>{cfg.label}</span>
                    </div>
                  </div>
                  <div className="flex-1 bg-card px-4 py-3 space-y-2.5">
                    {/* Mini progress */}
                    <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-1.5 rounded-full" style={{
                        width: e.status === "concluida" ? "100%" : e.status === "em_andamento" ? "50%" : "4%",
                        backgroundColor: cfg.hex,
                      }} />
                    </div>
                    {showDesc && e.descricao && <p className="text-[11px] text-muted-foreground leading-relaxed">{e.descricao}</p>}
                    {e.responsavel && (
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center text-[8px] font-black text-white flex-shrink-0" style={{ backgroundColor: t.primary }}>
                          {e.responsavel.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase()}
                        </div>
                        <span className="text-[10px] text-muted-foreground truncate">{e.responsavel}</span>
                      </div>
                    )}
                    {evs.length > 0 && (
                      <div className="pt-2 border-t border-border/50">
                        <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Entregáveis</p>
                        {evs.map(ev => (
                          <div key={ev.id} className="flex items-center gap-1.5 mb-1">
                            <FileText className="w-2.5 h-2.5 text-primary flex-shrink-0" />
                            <span className="text-[10px] text-foreground truncate">{ev.nome}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Flowchart View ───────────────────────────────────────────────────────────
function FluxogramaView({ service, etapas, setEtapas, onClose, onOpenInfographic, pushUndo }: {
  service: Service;
  etapas: Etapa[];
  setEtapas: (etapas: Etapa[]) => void;
  onClose: () => void;
  onOpenInfographic: () => void;
  pushUndo: () => void;
}) {
  const [showEtapaForm, setShowEtapaForm] = useState(false);
  const [etapaForm, setEtapaForm] = useState({ ...BLANK_ETAPA });
  const [entregavelForms, setEntregavelForms] = useState<Record<string, { nome: string; fileName: string; fileUrl: string; data: string }>>({});
  const [openEntregaveis, setOpenEntregaveis] = useState<Record<string, boolean>>({});

  const addEtapa = () => {
    if (!etapaForm.titulo.trim()) return;
    setEtapas([...etapas, { ...etapaForm, id: `E-${Date.now()}`, entregaveis: [] }]);
    setEtapaForm({ ...BLANK_ETAPA });
    setShowEtapaForm(false);
  };

  const updateStatus = (id: string, status: EtapaStatus) =>
    setEtapas(etapas.map(e => e.id === id ? { ...e, status } : e));

  const removeEtapa = (id: string) => { pushUndo(); setEtapas(etapas.filter(e => e.id !== id)); };

  const addEntregavel = (etapaId: string) => {
    const f = entregavelForms[etapaId];
    const nome = f?.nome.trim() || f?.fileName || "";
    if (!nome) return;
    setEtapas(etapas.map(e => e.id === etapaId
      ? { ...e, entregaveis: [...(e.entregaveis ?? []), { id: `EV-${Date.now()}`, nome, fileName: f.fileName, fileUrl: f.fileUrl, data: f.data }] }
      : e
    ));
    setEntregavelForms(prev => ({ ...prev, [etapaId]: { nome: "", fileName: "", fileUrl: "", data: "" } }));
  };

  const removeEntregavel = (etapaId: string, evId: string) => {
    pushUndo();
    setEtapas(etapas.map(e => e.id === etapaId
      ? { ...e, entregaveis: (e.entregaveis ?? []).filter(ev => ev.id !== evId) }
      : e
    ));
  };

  const handleEntregavelFile = (etapaId: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      setEntregavelForms(prev => ({
        ...prev,
        [etapaId]: { ...(prev[etapaId] ?? { nome: "", data: "" }), fileName: file.name, fileUrl: reader.result as string },
      }));
    };
    reader.readAsDataURL(file);
  };

  const concluidas = etapas.filter(e => e.status === "concluida").length;
  const pct = etapas.length ? Math.round((concluidas / etapas.length) * 100) : 0;
  const emAndamento = etapas.filter(e => e.status === "em_andamento").length;

  return (
    <div className="fixed inset-0 z-50 bg-background overflow-y-auto">
      <style>{`@media print { .no-print { display: none !important; } body { background: white; } }`}</style>

      {/* Top bar */}
      <div className="no-print sticky top-0 z-10 bg-card border-b border-border flex items-center justify-between px-6 py-3">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground"><X className="w-4 h-4" /></button>
          <span className="text-sm font-bold text-foreground">Fluxograma do Serviço</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onOpenInfographic}
            className="flex items-center gap-2 border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted">
            <BarChart3 className="w-3.5 h-3.5" />Infográfico
          </button>
          <button onClick={() => window.print()}
            className="flex items-center gap-2 border border-border text-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-muted">
            <Download className="w-3.5 h-3.5" />Exportar PDF
          </button>
          <button onClick={() => setShowEtapaForm(v => !v)}
            className="flex items-center gap-2 bg-primary text-primary-foreground px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90">
            <Plus className="w-3.5 h-3.5" />Nova Etapa
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        {/* Add etapa form */}
        {showEtapaForm && (
          <div className="no-print bg-card border border-border rounded-xl p-5 space-y-3">
            <h3 className="text-sm font-bold text-foreground">Nova Etapa</h3>
            <Field label="Título da Etapa *">
              <input value={etapaForm.titulo} onChange={e => setEtapaForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Ex.: Reunião de Briefing" className={inputCls} />
            </Field>
            <Field label="Descrição">
              <textarea value={etapaForm.descricao} onChange={e => setEtapaForm(f => ({ ...f, descricao: e.target.value }))} placeholder="Descreva o que será feito nesta etapa..." rows={2} className={inputCls + " resize-none"} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Responsável">
                <input value={etapaForm.responsavel} onChange={e => setEtapaForm(f => ({ ...f, responsavel: e.target.value }))} placeholder="Nome" className={inputCls} />
              </Field>
              <Field label="Status inicial">
                <select value={etapaForm.status} onChange={e => setEtapaForm(f => ({ ...f, status: e.target.value as EtapaStatus }))} className={selectCls}>
                  {Object.entries(etapaStatusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </Field>
            </div>
            <div className="flex gap-2">
              <button onClick={addEtapa} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">Adicionar Etapa</button>
              <button onClick={() => setShowEtapaForm(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        )}

        {/* Scope card */}
        <div className="rounded-2xl overflow-hidden border border-border shadow-sm">
          <div className="px-6 py-5 flex items-start justify-between" style={{ background: "linear-gradient(135deg, #6B1A2C 0%, #8B2040 100%)" }}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-4 h-4 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">Escopo do Serviço</p>
                <h2 className="text-lg font-bold text-white leading-tight">{service.name}</h2>
              </div>
            </div>
          </div>
          <div className="bg-card px-6 py-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Responsável</p>
              <p className="text-sm font-semibold text-foreground">{service.responsible || "—"}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Categoria</p>
              <p className="text-sm font-semibold text-foreground">{service.category || "—"}</p>
            </div>
            {etapas.length > 0 && (
              <div className="col-span-2">
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-muted-foreground">{concluidas} de {etapas.length} etapas concluídas</span>
                  <span className="font-bold text-foreground">{pct}%</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2">
                  <div className="h-2 rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: "#6B1A2C" }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Legend */}
        {etapas.length > 0 && (
          <div className="flex items-center gap-4 flex-wrap text-xs">
            {Object.entries(etapaStatusCfg).map(([k, v]) => (
              <div key={k} className="flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${v.dot}`} />
                <span className="text-muted-foreground">{v.label}</span>
              </div>
            ))}
            {emAndamento > 0 && (
              <div className="flex items-center gap-1.5 ml-auto">
                <Clock className="w-3 h-3 text-blue-500" />
                <span className="text-blue-600 font-semibold">{emAndamento} em andamento</span>
              </div>
            )}
          </div>
        )}

        {/* Flowchart */}
        {etapas.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-10">
            <EmptyState icon={Activity} title="Nenhuma etapa cadastrada" sub="Clique em + Nova Etapa para começar a montar o fluxograma." />
          </div>
        ) : (
          <div className="flex flex-col items-center">
            {/* INÍCIO */}
            <div className="px-6 py-2 rounded-full text-white text-xs font-bold shadow-md" style={{ backgroundColor: "#6B1A2C" }}>INÍCIO</div>

            {etapas.map((etapa, idx) => {
              const cfg = etapaStatusCfg[etapa.status];
              const initials = etapa.responsavel ? etapa.responsavel.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() : "?";
              const evForm = entregavelForms[etapa.id] ?? { nome: "", fileName: "", fileUrl: "", data: "" };
              const evOpen = openEntregaveis[etapa.id] ?? false;
              return (
                <div key={etapa.id} className="flex flex-col items-center w-full">
                  <div className="flex flex-col items-center my-1">
                    <div className="w-px h-6 bg-border" />
                    <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
                  </div>
                  <div className={`w-full bg-card border-2 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow group/etapa ${cfg.border}`}>
                    <div className="flex items-start gap-4">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0" style={{ backgroundColor: "#6B1A2C" }}>{idx + 1}</div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-foreground">{etapa.titulo}</h4>
                        {etapa.descricao && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{etapa.descricao}</p>}
                        <div className="flex items-center justify-between mt-3 gap-3 flex-wrap">
                          {etapa.responsavel && (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center text-[9px] font-bold text-primary">{initials}</div>
                              <span className="text-xs text-muted-foreground">{etapa.responsavel}</span>
                            </div>
                          )}
                          <div className="flex items-center gap-2 ml-auto">
                            <select value={etapa.status} onChange={e => updateStatus(etapa.id, e.target.value as EtapaStatus)}
                              className={`text-[11px] font-bold px-2.5 py-1 rounded-full border cursor-pointer focus:outline-none ${cfg.color} ${cfg.border} bg-transparent`}>
                              {Object.entries(etapaStatusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                            </select>
                            <button onClick={() => removeEtapa(etapa.id)} className="no-print opacity-0 group-hover/etapa:opacity-100 transition-opacity p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 text-red-400 hover:text-red-600">
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Entregáveis */}
                        <div className="mt-3 pt-3 border-t border-border/60">
                          <button onClick={() => setOpenEntregaveis(prev => ({ ...prev, [etapa.id]: !evOpen }))}
                            className="no-print flex items-center gap-1.5 text-[11px] font-bold text-primary hover:text-primary/80">
                            <Paperclip className="w-3 h-3" />
                            Entregáveis{(etapa.entregaveis ?? []).length > 0 ? ` (${(etapa.entregaveis ?? []).length})` : ""}
                            <ChevronRight className={`w-3 h-3 transition-transform ${evOpen ? "rotate-90" : ""}`} />
                          </button>
                          {(etapa.entregaveis ?? []).map(ev => (
                            <div key={ev.id} className="flex items-center gap-2 mt-1.5 pl-1">
                              <FileText className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                              <span className="text-[11px] text-foreground flex-1 truncate">{ev.nome}</span>
                              {ev.data && <span className="text-[10px] text-muted-foreground">{ev.data}</span>}
                              {ev.fileUrl && <a href={ev.fileUrl} download={ev.fileName} className="text-[10px] text-primary font-bold hover:underline">↓</a>}
                              <button onClick={() => removeEntregavel(etapa.id, ev.id)} className="no-print text-red-400 hover:text-red-600"><X className="w-3 h-3" /></button>
                            </div>
                          ))}
                          {evOpen && (
                            <div className="no-print mt-2 space-y-2 pl-1">
                              <div className="grid grid-cols-2 gap-2">
                                <input value={evForm.nome} onChange={e => setEntregavelForms(prev => ({ ...prev, [etapa.id]: { ...evForm, nome: e.target.value } }))}
                                  placeholder="Nome do documento" className={inputCls + " text-[11px] py-1.5"} />
                                <input type="date" value={evForm.data} onChange={e => setEntregavelForms(prev => ({ ...prev, [etapa.id]: { ...evForm, data: e.target.value } }))}
                                  className={inputCls + " text-[11px] py-1.5"} />
                              </div>
                              <div className="flex items-center gap-2">
                                <label className="flex items-center gap-1.5 flex-1 cursor-pointer border border-dashed border-border rounded-lg px-3 py-1.5 hover:border-primary/50 hover:bg-primary/5">
                                  <Paperclip className="w-3 h-3 text-muted-foreground" />
                                  <span className="text-[11px] text-muted-foreground truncate">{evForm.fileName || "Anexar arquivo"}</span>
                                  <input type="file" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleEntregavelFile(etapa.id, f); }} />
                                </label>
                                <button
                                  onClick={() => addEntregavel(etapa.id)}
                                  disabled={!evForm.nome.trim() && !evForm.fileUrl}
                                  className="flex items-center gap-1.5 bg-primary text-primary-foreground text-[11px] font-bold px-3 py-1.5 rounded-lg hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap transition-opacity"
                                >
                                  <CheckCircle2 className="w-3 h-3" />Salvar
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* FIM */}
            <div className="flex flex-col items-center my-1">
              <div className="w-px h-6 bg-border" />
              <div className="w-0 h-0 border-l-[5px] border-r-[5px] border-t-[6px] border-l-transparent border-r-transparent border-t-border" />
            </div>
            <div className="px-6 py-2 rounded-full border-2 border-primary text-primary text-xs font-bold">FIM</div>
          </div>
        )}
      </div>
    </div>
  );
}

function ServicesPage({ services, setServices, fluxogramas, setFluxogramas, pushUndo }: {
  services: Service[]; setServices: React.Dispatch<React.SetStateAction<Service[]>>;
  fluxogramas: Record<string, Etapa[]>; setFluxogramas: React.Dispatch<React.SetStateAction<Record<string, Etapa[]>>>;
  pushUndo: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK_SERVICE });
  const [viewingFlux, setViewingFlux] = useState<Service | null>(null);
  const [viewingInfog, setViewingInfog] = useState<Service | null>(null);
  const [editingEv, setEditingEv] = useState<{ svcCode: string; etapaId: string; evId: string; nome: string; data: string } | null>(null);

  const deleteEv = (svcCode: string, etapaId: string, evId: string) =>
    setFluxogramas(prev => ({
      ...prev,
      [svcCode]: (prev[svcCode] ?? []).map(e =>
        e.id === etapaId ? { ...e, entregaveis: (e.entregaveis ?? []).filter(ev => ev.id !== evId) } : e
      ),
    }));

  const saveEditEv = () => {
    if (!editingEv) return;
    setFluxogramas(prev => ({
      ...prev,
      [editingEv.svcCode]: (prev[editingEv.svcCode] ?? []).map(e =>
        e.id === editingEv.etapaId
          ? { ...e, entregaveis: (e.entregaveis ?? []).map(ev => ev.id === editingEv.evId ? { ...ev, nome: editingEv.nome, data: editingEv.data } : ev) }
          : e
      ),
    }));
    setEditingEv(null);
  };

  const openEdit = (s: Service) => {
    setEditingCode(s.code);
    setForm({ ...s });
    setShowModal(true);
  };

  const openNew = () => {
    setEditingCode(null);
    setForm({ ...BLANK_SERVICE });
    setShowModal(true);
  };

  const save = () => {
    if (!form.name.trim()) return;
    if (editingCode) {
      setServices(prev => prev.map(s => s.code === editingCode ? { ...form, code: editingCode } : s));
    } else {
      const newS: Service = { ...form, code: `SVC-${String(services.length + 1).padStart(3, "0")}` };
      setServices(prev => [...prev, newS]);
      setFluxogramas(prev => ({ ...prev, [newS.code]: [] }));
    }
    setForm({ ...BLANK_SERVICE });
    setEditingCode(null);
    setShowModal(false);
  };

  const deleteService = (code: string) => {
    pushUndo();
    setServices(prev => prev.filter(s => s.code !== code));
    setFluxogramas(prev => { const n = { ...prev }; delete n[code]; return n; });
  };

  const setEtapasFor = (code: string, etapas: Etapa[]) =>
    setFluxogramas(prev => ({ ...prev, [code]: etapas }));

  return (
    <>
      {viewingInfog && (
        <InfographicView
          service={viewingInfog}
          etapas={fluxogramas[viewingInfog.code] ?? []}
          onClose={() => setViewingInfog(null)}
          onBackToFluxograma={() => { setViewingFlux(viewingInfog); setViewingInfog(null); }}
        />
      )}
      {viewingFlux && (
        <FluxogramaView
          service={viewingFlux}
          etapas={fluxogramas[viewingFlux.code] ?? []}
          setEtapas={e => setEtapasFor(viewingFlux.code, e)}
          onClose={() => setViewingFlux(null)}
          onOpenInfographic={() => { setViewingInfog(viewingFlux); setViewingFlux(null); }}
          pushUndo={pushUndo}
        />
      )}

      <div className="space-y-6">
        {showModal && (
          <Modal title={editingCode ? "Editar Serviço" : "Novo Serviço"} onClose={() => setShowModal(false)}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <Field label="Nome do Serviço *">
                    <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Capacitação em Econometria" className={inputCls} />
                  </Field>
                </div>
                <Field label="Categoria">
                  <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="Ex.: Consultoria" className={inputCls} />
                </Field>
                <Field label="Responsável">
                  <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Nome do responsável" className={inputCls} />
                </Field>
                <Field label="Prioridade">
                  <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))} className={selectCls}>
                    {Object.entries(priorityCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                <Field label="Status">
                  <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as ServiceStatus }))} className={selectCls}>
                    {Object.entries(svcStatusCfg).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </Field>
                <Field label="Data de Início">
                  <input type="date" value={form.startDate} onChange={e => setForm(f => ({ ...f, startDate: e.target.value }))} className={inputCls} />
                </Field>
                <Field label="Data de Entrega">
                  <input type="date" value={form.endDate} onChange={e => setForm(f => ({ ...f, endDate: e.target.value }))} className={inputCls} />
                </Field>
                <div className="col-span-2">
                  <Field label="Projeto relacionado">
                    <input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Nome ou código do projeto" className={inputCls} />
                  </Field>
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">{editingCode ? "Salvar Alterações" : "Salvar Serviço"}</button>
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
              </div>
            </div>
          </Modal>
        )}

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Serviços</h1>
            <p className="text-sm text-muted-foreground mt-0.5">{services.length} serviços cadastrados</p>
          </div>
          <button onClick={openNew} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
            <Plus className="w-4 h-4" />Novo Serviço
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Total de serviços:</span>
          <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-xs font-bold">{services.length}</span>
        </div>

        <div className="bg-card border border-border rounded-xl overflow-hidden">
          {services.length === 0 ? (
            <EmptyState icon={Briefcase} title="Nenhum serviço cadastrado" sub="Clique em Novo Serviço para começar." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    {["Código","Serviço","Categoria","Responsável","Prioridade","Status","Início","Fim","Fluxograma","Infográfico","Ações"].map(h => (
                      <th key={h} className="text-left px-4 py-3 text-[11px] font-bold text-muted-foreground uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {services.map((s, i) => {
                    const etapas = fluxogramas[s.code] ?? [];
                    const concluidas = etapas.filter(e => e.status === "concluida").length;
                    const pct = etapas.length ? Math.round((concluidas / etapas.length) * 100) : null;
                    const etapasComEntregaveis = etapas.filter(e => (e.entregaveis ?? []).length > 0);
                    const totalEvs = etapasComEntregaveis.reduce((sum, e) => sum + (e.entregaveis ?? []).length, 0);
                    return (
                      <React.Fragment key={s.code}>
                        <tr className={`border-b border-border hover:bg-muted/20 ${i % 2 === 1 ? "bg-muted/5" : ""}`}>
                          <td className="px-4 py-3 text-xs font-mono font-bold text-primary">{s.code}</td>
                          <td className="px-4 py-3 text-xs font-semibold text-foreground max-w-48 truncate">{s.name}</td>
                          <td className="px-4 py-3"><span className="px-2 py-0.5 bg-accent text-accent-foreground text-[11px] rounded-md font-semibold">{s.category || "—"}</span></td>
                          <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">{s.responsible || "—"}</td>
                          <td className="px-4 py-3"><PriorityBadge priority={s.priority} /></td>
                          <td className="px-4 py-3"><SvcBadge status={s.status} /></td>
                          <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono whitespace-nowrap">{fmtDate(s.startDate)}</td>
                          <td className="px-4 py-3 text-[11px] text-muted-foreground font-mono whitespace-nowrap">{fmtDate(s.endDate)}</td>
                          <td className="px-4 py-3">
                            <button onClick={() => setViewingFlux(s)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-primary border border-primary/30 bg-primary/5 hover:bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                              <Activity className="w-3 h-3" />
                              {pct !== null ? `${pct}%` : "Ver"}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <button onClick={() => setViewingInfog(s)}
                              className="flex items-center gap-1.5 text-[11px] font-bold text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 hover:bg-violet-100 dark:hover:bg-violet-900/40 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap">
                              <BarChart3 className="w-3 h-3" />Ver
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <button onClick={() => openEdit(s)}
                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors whitespace-nowrap">
                                Editar
                              </button>
                              <button onClick={() => deleteService(s.code)}
                                className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-100/40 text-red-600 dark:text-red-400 transition-colors whitespace-nowrap">
                                Excluir
                              </button>
                            </div>
                          </td>
                        </tr>
                        {etapasComEntregaveis.length > 0 && (
                          <tr key={`${s.code}-evs`} className="border-b border-border bg-primary/[0.02]">
                            <td colSpan={11} className="px-6 py-0">
                              <table className="w-full text-[11px]">
                                <thead>
                                  <tr className="border-b border-border/50">
                                    <th className="text-left py-2 pr-4 font-bold text-muted-foreground uppercase tracking-wide text-[10px]">Etapa</th>
                                    <th className="text-left py-2 pr-4 font-bold text-muted-foreground uppercase tracking-wide text-[10px]">Entregável</th>
                                    <th className="text-left py-2 pr-4 font-bold text-muted-foreground uppercase tracking-wide text-[10px]">Data</th>
                                    <th className="text-right py-2 font-bold text-muted-foreground uppercase tracking-wide text-[10px]">Ações</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {etapasComEntregaveis.flatMap((etapa, etIdx) =>
                                    (etapa.entregaveis ?? []).map(ev => {
                                      const isEditing = editingEv?.evId === ev.id;
                                      return (
                                        <tr key={`${etapa.id}-${ev.id}`} className="border-b border-border/30 hover:bg-muted/10">
                                          <td className="py-2 pr-4">
                                            <span className="inline-flex items-center gap-1.5">
                                              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary font-black text-[9px]">{etIdx + 1}</span>
                                              <span className="text-muted-foreground truncate max-w-32">{etapa.titulo || `Etapa ${etIdx + 1}`}</span>
                                            </span>
                                          </td>
                                          <td className="py-2 pr-4">
                                            {isEditing ? (
                                              <input
                                                value={editingEv.nome}
                                                onChange={e => setEditingEv(prev => prev ? { ...prev, nome: e.target.value } : prev)}
                                                className="h-7 rounded-lg border border-primary bg-background text-xs px-2 w-full focus:outline-none"
                                                autoFocus
                                              />
                                            ) : (
                                              <span className="flex items-center gap-1.5 font-semibold text-foreground">
                                                <FileText className="w-3 h-3 text-primary flex-shrink-0" />{ev.nome}
                                              </span>
                                            )}
                                          </td>
                                          <td className="py-2 pr-4">
                                            {isEditing ? (
                                              <input
                                                type="date"
                                                value={editingEv.data}
                                                onChange={e => setEditingEv(prev => prev ? { ...prev, data: e.target.value } : prev)}
                                                className="h-7 rounded-lg border border-primary bg-background text-xs px-2 focus:outline-none"
                                              />
                                            ) : (
                                              <span className="text-muted-foreground">{ev.data ? fmtDate(ev.data) : "—"}</span>
                                            )}
                                          </td>
                                          <td className="py-2">
                                            <div className="flex items-center gap-1.5 justify-end">
                                              {isEditing ? (
                                                <>
                                                  <button onClick={saveEditEv}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-primary text-primary-foreground font-bold transition-colors whitespace-nowrap">
                                                    <CheckCircle2 className="w-3 h-3" />Salvar
                                                  </button>
                                                  <button onClick={() => setEditingEv(null)}
                                                    className="px-2.5 py-1 rounded-lg border border-border text-muted-foreground hover:bg-muted font-bold transition-colors whitespace-nowrap">
                                                    Cancelar
                                                  </button>
                                                </>
                                              ) : (
                                                <>
                                                  {ev.fileUrl && (
                                                    <a href={ev.fileUrl} download={ev.fileName}
                                                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-foreground font-bold transition-colors whitespace-nowrap">
                                                      <Download className="w-3 h-3" />Baixar
                                                    </a>
                                                  )}
                                                  <button
                                                    onClick={() => setEditingEv({ svcCode: s.code, etapaId: etapa.id, evId: ev.id, nome: ev.nome, data: ev.data })}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-muted text-foreground font-bold transition-colors whitespace-nowrap">
                                                    <Pencil className="w-3 h-3" />Editar
                                                  </button>
                                                  <button
                                                    onClick={() => deleteEv(s.code, etapa.id, ev.id)}
                                                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 font-bold transition-colors whitespace-nowrap">
                                                    <X className="w-3 h-3" />Excluir
                                                  </button>
                                                </>
                                              )}
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </>
  );
}

// ─── Calendar ────────────────────────────────────────────────────────────────
const BLANK_EVENT: Omit<CalEvent, "id"> = {
  title: "", date: "", time: "", type: "meeting",
  project: "", attendees: [], description: "",
};

function CalendarPage({ events, setEvents, pushUndo }: {
  events: CalEvent[]; setEvents: React.Dispatch<React.SetStateAction<CalEvent[]>>;
  pushUndo: () => void;
}) {
  const [month, setMonth] = useState(new Date().getMonth());
  const [year,  setYear]  = useState(new Date().getFullYear());
  const [showModal, setShowModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [form, setForm] = useState({ ...BLANK_EVENT, attendeesRaw: "" });

  const monthNames = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay    = new Date(year, month, 1).getDay();

  const prev = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const next = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const eventsForDay = (day: number) => {
    const ds = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
    return events.filter(e => e.date === ds);
  };

  const openNew = (day?: number) => {
    const ds = day ? `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}` : "";
    setForm({ ...BLANK_EVENT, date: ds, attendeesRaw: "" });
    setShowModal(true);
  };

  const save = () => {
    if (!form.title.trim() || !form.date) return;
    const newEv: CalEvent = {
      ...form,
      id: `EVT-${Date.now()}`,
      attendees: form.attendeesRaw.split(",").map(a => a.trim()).filter(Boolean),
      color: evtCfg[form.type].color,
    };
    setEvents(prev => [...prev, newEv]);
    setForm({ ...BLANK_EVENT, attendeesRaw: "" });
    setShowModal(false);
  };

  const upcoming = [...events].sort((a, b) => a.date.localeCompare(b.date));

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Novo Evento" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Field label="Título do Evento *">
              <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex.: Reunião de Kickoff" className={inputCls} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Data *">
                <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Horário">
                <input type="time" value={form.time} onChange={e => setForm(f => ({ ...f, time: e.target.value }))} className={inputCls} />
              </Field>
              <Field label="Projeto relacionado">
                <input value={form.project} onChange={e => setForm(f => ({ ...f, project: e.target.value }))} placeholder="Nome do projeto" className={inputCls} />
              </Field>
            </div>
            <Field label="Participantes (separados por vírgula)">
              <input value={form.attendeesRaw} onChange={e => setForm(f => ({ ...f, attendeesRaw: e.target.value }))} placeholder="Ex.: Ana Lima, João Souza" className={inputCls} />
            </Field>
            <Field label="Descrição">
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes adicionais..." rows={3} className={inputCls + " resize-none"} />
            </Field>
            {/* Color preview */}
            <div className="flex items-center gap-2 pt-1">
              <div className="w-4 h-4 rounded-full" style={{ backgroundColor: evtCfg[form.type].color }} />
              <span className="text-xs text-muted-foreground">Cor do tipo: {evtCfg[form.type].label}</span>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">Salvar Evento</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Calendário</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Agenda colaborativa de projetos e eventos</p>
        </div>
        <button onClick={() => openNew()} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />
          Novo Evento
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Calendar grid */}
        <div className="lg:col-span-2 bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ background: "linear-gradient(135deg, var(--primary) 0%, #8B2040 100%)" }}>
            <button onClick={prev} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-white">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="text-center">
              <h3 className="text-base font-bold text-white">{monthNames[month]}</h3>
              <p className="text-xs text-white/70">{year}</p>
            </div>
            <button onClick={next} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/20 transition-colors text-white">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Day names */}
          <div className="grid grid-cols-7 border-b border-border bg-muted/30">
            {["D","S","T","Q","Q","S","S"].map((d, i) => (
              <div key={i} className="py-2 text-center text-[10px] font-bold text-muted-foreground">{d}</div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-cols-7">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`e${i}`} className="h-[72px] border-b border-r border-border/40 bg-muted/5" />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const today = new Date();
              const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
              const dayEvts = eventsForDay(day);
              const col = (i + firstDay) % 7;
              const isWeekend = col === 0 || col === 6;
              return (
                <div
                  key={day}
                  onClick={() => openNew(day)}
                  className={`h-[72px] border-b border-r border-border/40 p-1.5 cursor-pointer transition-colors group
                    ${isToday ? "bg-primary/5" : isWeekend ? "bg-muted/20" : "hover:bg-muted/20"}`}
                >
                  <span className={`text-[11px] font-bold inline-flex items-center justify-center w-5 h-5 rounded-full transition-colors
                    ${isToday ? "bg-primary text-white" : "text-foreground group-hover:bg-primary/10"}`}>
                    {day}
                  </span>
                  <div className="mt-0.5 space-y-0.5">
                    {dayEvts.slice(0, 2).map(ev => {
                      const cfg = evtCfg[ev.type];
                      return (
                        <div key={ev.id} className="text-[9px] px-1 py-0.5 rounded font-semibold truncate text-white"
                          style={{ backgroundColor: cfg.color }}>
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvts.length > 2 && (
                      <div className="text-[9px] text-muted-foreground pl-0.5 font-semibold">+{dayEvts.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Type legend */}

          {/* Upcoming events */}
          <div className="bg-card border border-border rounded-xl p-4 flex-1">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3">Próximos Eventos</h4>
            {upcoming.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Sem eventos" sub="Clique em qualquer dia do calendário para criar um evento." />
            ) : (
              <div className="space-y-2">
                {upcoming.map(ev => {
                  const cfg = evtCfg[ev.type];
                  const handleEdit = () => {
                    setEvents(prev => prev.filter(e => e.id !== ev.id));
                    setForm({ title: ev.title, date: ev.date, time: ev.time, type: ev.type, project: ev.project ?? "", attendees: ev.attendees, description: ev.description ?? "", attendeesRaw: ev.attendees.join(", ") });
                    setShowModal(true);
                  };
                  const handleDelete = () => { pushUndo(); setEvents(prev => prev.filter(e => e.id !== ev.id)); };
                  return (
                    <div key={ev.id} className="flex items-start gap-3 p-2.5 rounded-lg border transition-colors hover:shadow-sm group/ev"
                      style={{ borderColor: `${cfg.color}30`, backgroundColor: cfg.lightBg }}>
                      <div className="w-2.5 h-2.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: cfg.color }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{ev.title}</p>
                        <p className="text-[10px] mt-0.5" style={{ color: cfg.textColor }}>
                          {ev.date}{ev.time ? ` · ${ev.time}` : ""}
                        </p>
                        {ev.project && <p className="text-[10px] text-muted-foreground truncate">{ev.project}</p>}
                        <span className="inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded text-white" style={{ backgroundColor: cfg.color }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 opacity-0 group-hover/ev:opacity-100 transition-opacity flex-shrink-0">
                        <button onClick={handleEdit}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/70 dark:bg-black/30 text-foreground hover:bg-white dark:hover:bg-black/50 transition-colors">
                          Editar
                        </button>
                        <button onClick={handleDelete}
                          className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-600 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Team ────────────────────────────────────────────────────────────────────
const MEMBER_COLORS = ["#6B1A2C","#2563EB","#059669","#7C3AED","#D97706","#0891B2","#DC2626","#0D9488"];

const BLANK_MEMBER: Omit<TeamMember, "id" | "initials" | "color"> = {
  name: "", role: "", email: "", hoursAvailable: 40, hoursUsed: 0,
  projects: [], skills: [],
};

function TeamPage({ team, setTeam, projects, pushUndo }: {
  team: TeamMember[]; setTeam: React.Dispatch<React.SetStateAction<TeamMember[]>>; projects: Project[];
  pushUndo: () => void;
}) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ ...BLANK_MEMBER, skillsRaw: "" });

  const save = () => {
    if (!form.name.trim()) return;
    const words = form.name.trim().split(" ");
    const initials = (words[0][0] + (words[1]?.[0] ?? "")).toUpperCase();
    const color = MEMBER_COLORS[team.length % MEMBER_COLORS.length];
    const newM: TeamMember = {
      ...form,
      id: `TM-${String(team.length + 1).padStart(2, "0")}`,
      initials,
      color,
      skills: form.skillsRaw.split(",").map(s => s.trim()).filter(Boolean),
      hoursAvailable: Number(form.hoursAvailable),
      hoursUsed: Number(form.hoursUsed),
    };
    setTeam(prev => [...prev, newM]);
    setForm({ ...BLANK_MEMBER, skillsRaw: "" });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Adicionar Membro" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Field label="Nome Completo *">
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Ana Lima" className={inputCls} />
                </Field>
              </div>
              <Field label="Cargo">
                <input value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))} placeholder="Ex.: Consultora Sênior" className={inputCls} />
              </Field>
              <Field label="E-mail">
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="nome@ufrn.br" className={inputCls} />
              </Field>
              <Field label="Horas disponíveis/mês">
                <input type="number" min={0} value={form.hoursAvailable} onChange={e => setForm(f => ({ ...f, hoursAvailable: Number(e.target.value) }))} className={inputCls} />
              </Field>
              <Field label="Horas em uso">
                <input type="number" min={0} value={form.hoursUsed} onChange={e => setForm(f => ({ ...f, hoursUsed: Number(e.target.value) }))} className={inputCls} />
              </Field>
              <div className="col-span-2">
                <Field label="Competências (separadas por vírgula)">
                  <input value={form.skillsRaw} onChange={e => setForm(f => ({ ...f, skillsRaw: e.target.value }))} placeholder="Ex.: Econometria, Python, SPSS" className={inputCls} />
                </Field>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">Salvar Membro</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Equipe</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {team.length === 0 ? "Nenhum membro cadastrado" : `${team.length} membros ativos na Econsul`}
          </p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />
          Adicionar Membro
        </button>
      </div>

      {team.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10">
          <EmptyState icon={Users} title="Nenhum membro cadastrado" sub="Adicione os integrantes da equipe Econsul para visualizar alocação e projetos." />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {team.map(m => {
              const pct = Math.round((m.hoursUsed / (m.hoursAvailable || 1)) * 100);
              const memberProjects = projects.filter(p => m.projects.includes(p.id));
              return (
                <div key={m.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0" style={{ backgroundColor: m.color }}>
                      {m.initials}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground">{m.name}</h3>
                      <p className="text-xs text-muted-foreground">{m.role}</p>
                      {m.email && <p className="text-[11px] text-muted-foreground mt-0.5">{m.email}</p>}
                    </div>
                    <button className="p-1 rounded hover:bg-muted"><MoreHorizontal className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="mb-3">
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-muted-foreground">Carga horária</span>
                      <span className="font-bold text-foreground">{m.hoursUsed}/{m.hoursAvailable}h</span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div className="h-2 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, backgroundColor: pct > 85 ? "#DC2626" : pct > 65 ? "#D97706" : m.color }} />
                    </div>
                  </div>
                  {m.skills.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {m.skills.map(sk => (
                        <span key={sk} className="px-2 py-0.5 text-[10px] font-semibold rounded-full" style={{ backgroundColor: `${m.color}18`, color: m.color }}>{sk}</span>
                      ))}
                    </div>
                  )}
                  {memberProjects.length > 0 && (
                    <div className="pt-3 border-t border-border">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Projetos</p>
                      {memberProjects.map(p => (
                        <div key={p.id} className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[11px] text-foreground truncate">{p.name}</span>
                          <StatusBadge status={p.status} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {team.length > 0 && (
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="text-sm font-bold text-foreground mb-4">Carga Horária da Equipe</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={team.map(m => ({ name: m.name.split(" ")[0], horas: m.hoursUsed, disponivel: m.hoursAvailable }))} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(107,26,44,0.07)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid var(--border)", fontSize: 12, background: "var(--card)", color: "var(--card-foreground)" }} />
                  <Bar key="horas" dataKey="horas" name="Em uso" fill="var(--primary)" radius={[4,4,0,0]} />
                  <Bar key="disponivel" dataKey="disponivel" name="Disponível" fill="var(--muted)" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── KPIs ────────────────────────────────────────────────────────────────────
const BLANK_DEMANDA: Omit<Demanda, "id"> = {
  titulo: "", responsavel: "", urgencia: "media",
  importancia: "moderada", prazo: "", status: "na_fila", pdfName: "", pdfUrl: "",
};

function KPIsPage({ demandas, setDemandas, pushUndo }: { demandas: Demanda[]; setDemandas: React.Dispatch<React.SetStateAction<Demanda[]>>; pushUndo: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...BLANK_DEMANDA });

  const add = () => {
    if (!form.titulo.trim() || !form.prazo) return;
    setDemandas(prev => [...prev, { ...form, id: `D${Date.now()}` }]);
    setForm({ ...BLANK_DEMANDA });
    setShowForm(false);
  };

  const move   = (id: string, status: DemandaStatus) => setDemandas(prev => prev.map(d => d.id === id ? { ...d, status } : d));
  const remove = (id: string) => { pushUndo(); setDemandas(prev => prev.filter(d => d.id !== id)); };

  const urg: Record<Urgencia, number>    = { alta: 0, media: 0, baixa: 0 };
  const imp: Record<Importancia, number> = { critica: 0, alta: 0, moderada: 0, baixa: 0 };
  let prazoVencido = 0, prazoUrgente = 0, prazoOk = 0;
  demandas.forEach(d => {
    urg[d.urgencia]++;
    imp[d.importancia]++;
    const diff = Math.ceil((new Date(d.prazo).getTime() - Date.now()) / 86400000);
    if (diff < 0) prazoVencido++;
    else if (diff <= 7) prazoUrgente++;
    else prazoOk++;
  });
  const total = demandas.length || 1;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">KPIs</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Demandas, urgência, importância e prazos da Econsul</p>
        </div>
        <button onClick={() => setShowForm(v => !v)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />
          Nova Demanda
        </button>
      </div>

      {showForm && (
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="text-sm font-bold text-foreground mb-4">Cadastrar Nova Demanda</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="lg:col-span-2">
              <Field label="Título *">
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Descreva a demanda..." className={inputCls} />
              </Field>
            </div>
            <Field label="Responsável">
              <input value={form.responsavel} onChange={e => setForm(f => ({ ...f, responsavel: e.target.value }))} placeholder="Nome" className={inputCls} />
            </Field>
            <Field label="Urgência">
              <select value={form.urgencia} onChange={e => setForm(f => ({ ...f, urgencia: e.target.value as Urgencia }))} className={selectCls}>
                <option value="baixa">Baixa</option>
                <option value="media">Média</option>
                <option value="alta">Alta</option>
              </select>
            </Field>
            <Field label="Importância">
              <select value={form.importancia} onChange={e => setForm(f => ({ ...f, importancia: e.target.value as Importancia }))} className={selectCls}>
                <option value="baixa">Baixa</option>
                <option value="moderada">Moderada</option>
                <option value="alta">Alta</option>
                <option value="critica">Crítica</option>
              </select>
            </Field>
            <Field label="Prazo *">
              <input type="date" value={form.prazo} onChange={e => setForm(f => ({ ...f, prazo: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Etapa">
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as DemandaStatus }))} className={selectCls}>
                <option value="na_fila">Na Fila</option>
                <option value="em_curso">Em Curso</option>
                <option value="entregue">Entregue</option>
              </select>
            </Field>
          </div>
          <div className="mt-3">
            <Field label="Anexar PDF">
              <label className="flex items-center gap-2 h-9 cursor-pointer border border-dashed border-border rounded-lg px-3 hover:border-primary/50 hover:bg-primary/5 transition-colors w-full">
                <Paperclip className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{form.pdfName || "Selecionar arquivo PDF…"}</span>
                {form.pdfName && <span className="ml-auto text-[10px] font-bold text-green-600 flex-shrink-0">✓ Anexado</span>}
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  className="hidden"
                  onChange={e => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    const reader = new FileReader();
                    reader.onload = () => setForm(prev => ({ ...prev, pdfName: f.name, pdfUrl: reader.result as string }));
                    reader.readAsDataURL(f);
                  }}
                />
              </label>
            </Field>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={add} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">Adicionar</button>
            <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
          </div>
        </div>
      )}

      {/* Board */}
      <section>
        <h2 className="text-base font-bold text-foreground mb-0.5">Demandas</h2>
        <p className="text-xs text-muted-foreground mb-4">Acompanhe o fluxo de todas as demandas da Econsul.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {DEMANDA_COLS.map(col => {
            const cards = demandas.filter(d => d.status === col.status);
            const others = DEMANDA_COLS.filter(c => c.status !== col.status);
            return (
              <div key={col.status} className="flex flex-col gap-2">
                <div className={`flex items-center justify-between px-3 py-2.5 rounded-xl border ${col.headerCls}`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${col.dot}`} />
                    <div>
                      <p className="text-xs font-bold text-foreground">{col.title}</p>
                      <p className="text-[10px] text-muted-foreground">{col.subtitle}</p>
                    </div>
                  </div>
                  <span className="w-5 h-5 rounded-full bg-white/60 dark:bg-black/20 text-foreground text-[10px] flex items-center justify-center font-bold">{cards.length}</span>
                </div>
                <div className="flex flex-col gap-2">
                  {cards.length === 0 && (
                    <div className="border-2 border-dashed border-border rounded-xl p-6 text-center">
                      <p className="text-[11px] text-muted-foreground">{col.emptyMsg}</p>
                    </div>
                  )}
                  {cards.map(d => {
                    const uc = urgCfg[d.urgencia];
                    const ic = impCfg[d.importancia];
                    const pz = d.prazo ? calcPrazo(d.prazo) : null;
                    return (
                      <div key={d.id} className="bg-card border border-border rounded-xl p-3.5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-xs font-bold text-foreground leading-snug flex-1">{d.titulo}</p>
                          <div className="relative group/menu flex-shrink-0">
                            <button className="p-0.5 rounded hover:bg-muted"><MoreHorizontal className="w-3.5 h-3.5 text-muted-foreground" /></button>
                            <div className="absolute right-0 top-5 hidden group-hover/menu:flex flex-col bg-card border border-border rounded-lg shadow-lg z-10 w-36 overflow-hidden">
                              {others.map(o => (
                                <button key={o.status} onClick={() => move(d.id, o.status)}
                                  className="text-left px-3 py-2 text-xs hover:bg-muted text-foreground">Mover para {o.title}</button>
                              ))}
                              <button onClick={() => remove(d.id)}
                                className="text-left px-3 py-2 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 border-t border-border">Remover</button>
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold ${uc.textCls} ${uc.bgCls}`}>
                            <AlertTriangle className="w-2.5 h-2.5" />{uc.label}
                          </span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${ic.textCls} ${ic.bgCls}`}>{ic.label}</span>
                        </div>
                        {pz && (
                          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold ${pz.cls}`}>
                            <Clock className="w-2.5 h-2.5" />{pz.label}
                          </div>
                        )}
                        {d.responsavel && <p className="text-[11px] text-muted-foreground mt-2">{d.responsavel}</p>}
                        {d.pdfUrl && (
                          <a href={d.pdfUrl} download={d.pdfName}
                            className="mt-2 flex items-center gap-1.5 text-[10px] font-bold text-primary hover:underline">
                            <Download className="w-3 h-3" />{d.pdfName}
                          </a>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Indicator panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-4 h-4 text-red-500" />
            <h3 className="text-sm font-bold text-foreground">Urgência</h3>
          </div>
          {demandas.length === 0
            ? <p className="text-xs text-muted-foreground text-center py-4">Sem demandas cadastradas</p>
            : <div className="space-y-3">
                {(["alta","media","baixa"] as Urgencia[]).map(u => (
                  <div key={u}>
                    <div className="flex justify-between mb-1"><span className={`text-xs font-semibold ${urgCfg[u].textCls}`}>{urgCfg[u].label}</span><span className="text-xs font-bold text-foreground">{urg[u]}</span></div>
                    <div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${Math.round(urg[u]/total*100)}%`, backgroundColor: urgCfg[u].barColor }} /></div>
                  </div>
                ))}
              </div>
          }
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="w-4 h-4 text-amber-500" />
            <h3 className="text-sm font-bold text-foreground">Nível de Importância</h3>
          </div>
          {demandas.length === 0
            ? <p className="text-xs text-muted-foreground text-center py-4">Sem demandas cadastradas</p>
            : <div className="space-y-3">
                {(["critica","alta","moderada","baixa"] as Importancia[]).map(i => (
                  <div key={i}>
                    <div className="flex justify-between mb-1"><span className={`text-xs font-semibold ${impCfg[i].textCls}`}>{impCfg[i].label}</span><span className="text-xs font-bold text-foreground">{imp[i]}</span></div>
                    <div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${Math.round(imp[i]/total*100)}%`, backgroundColor: impCfg[i].barColor }} /></div>
                  </div>
                ))}
              </div>
          }
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-blue-500" />
            <h3 className="text-sm font-bold text-foreground">Situação dos Prazos</h3>
          </div>
          {demandas.length === 0
            ? <p className="text-xs text-muted-foreground text-center py-4">Sem demandas cadastradas</p>
            : <>
                <div className="space-y-3">
                  {[
                    { label: "Vencido",       count: prazoVencido, color: "#DC2626", cls: "text-red-700 dark:text-red-400" },
                    { label: "Crítico (≤7d)", count: prazoUrgente, color: "#D97706", cls: "text-amber-700 dark:text-amber-400" },
                    { label: "No prazo",      count: prazoOk,      color: "#059669", cls: "text-emerald-700 dark:text-emerald-400" },
                  ].map(row => (
                    <div key={row.label}>
                      <div className="flex justify-between mb-1"><span className={`text-xs font-semibold ${row.cls}`}>{row.label}</span><span className="text-xs font-bold text-foreground">{row.count}</span></div>
                      <div className="w-full bg-muted rounded-full h-2"><div className="h-2 rounded-full" style={{ width: `${Math.round(row.count/total*100)}%`, backgroundColor: row.color }} /></div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-2 text-center">
                  <div><p className="text-lg font-bold text-red-600">{prazoVencido}</p><p className="text-[10px] text-muted-foreground">Vencido</p></div>
                  <div><p className="text-lg font-bold text-amber-600">{prazoUrgente}</p><p className="text-[10px] text-muted-foreground">Crítico</p></div>
                  <div><p className="text-lg font-bold text-emerald-600">{prazoOk}</p><p className="text-[10px] text-muted-foreground">No prazo</p></div>
                </div>
              </>
          }
        </div>
      </div>
    </div>
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────
interface Report {
  id: string; name: string; responsible: string;
  date: string; fileName: string; fileUrl: string;
}

function ReportsPage({ reports, setReports, pushUndo }: { reports: Report[]; setReports: React.Dispatch<React.SetStateAction<Report[]>>; pushUndo: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", responsible: "", date: "", fileName: "", fileUrl: "" });
  const fileInputRef = { current: null as HTMLInputElement | null };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setForm(f => ({ ...f, fileName: file.name, fileUrl: url }));
  };

  const save = () => {
    if (!form.name.trim()) return;
    setReports(prev => [...prev, { ...form, id: `RPT-${Date.now()}` }]);
    setForm({ name: "", responsible: "", date: "", fileName: "", fileUrl: "" });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Novo Relatório" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Field label="Nome do Relatório *">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Relatório Mensal de Projetos" className={inputCls} />
            </Field>
            <Field label="Realizado por">
              <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Nome do responsável" className={inputCls} />
            </Field>
            <Field label="Data de Cadastro">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Arquivo PDF">
              <label className="flex items-center gap-3 w-full cursor-pointer group">
                <div className="flex-1 flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  <span className={`text-sm truncate ${form.fileName ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {form.fileName || "Clique para selecionar um PDF"}
                  </span>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  ref={el => { fileInputRef.current = el; }}
                  onChange={handleFile}
                />
              </label>
              {form.fileName && (
                <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Arquivo selecionado
                </p>
              )}
            </Field>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">Salvar Relatório</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Relatórios</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{reports.length} relatório{reports.length !== 1 ? "s" : ""} cadastrado{reports.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />Novo Relatório
        </button>
      </div>

      {reports.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10">
          <EmptyState icon={FileText} title="Nenhum relatório cadastrado" sub="Clique em Novo Relatório para anexar um PDF e registrar." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {reports.map(r => (
            <div key={r.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center flex-shrink-0">
                  <FileText className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="text-sm font-bold text-foreground">{r.name}</h3>
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold flex-shrink-0 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">PDF</span>
                  </div>
                  {r.responsible && <p className="text-xs text-muted-foreground mt-0.5">Por: {r.responsible}</p>}
                  {r.fileName && <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{r.fileName}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground">{r.date ? `Cadastrado em ${r.date}` : "Sem data"}</span>
                <div className="flex items-center gap-2">
                  {r.fileUrl && (
                    <>
                      <a href={r.fileUrl} target="_blank" rel="noreferrer"
                        className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted font-semibold">
                        <Eye className="w-3.5 h-3.5" />Ver
                      </a>
                      <a href={r.fileUrl} download={r.fileName}
                        className="flex items-center gap-1.5 text-xs text-primary-foreground bg-primary rounded-lg px-2.5 py-1.5 hover:opacity-90 font-semibold">
                        <Download className="w-3.5 h-3.5" />Baixar
                      </a>
                    </>
                  )}
                  <button onClick={() => { pushUndo(); setReports(prev => prev.filter(x => x.id !== r.id)); }}
                    className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg px-2.5 py-1.5 hover:bg-red-100 font-semibold">
                    <X className="w-3.5 h-3.5" />Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Settings ────────────────────────────────────────────────────────────────
interface AppUser {
  id: string; nome: string; email: string; cargo: string; senha: string; photo?: string;
}

const BLANK_USER: Omit<AppUser, "id"> = { nome: "", email: "", cargo: "", senha: "", photo: "" };

function SettingsPage({ theme, setTheme }: { theme: "light" | "dark"; setTheme: (t: "light" | "dark") => void }) {
  const [tab, setTab] = useState<"profile" | "appearance" | "notifications" | "users">("profile");
  const [users, setUsers] = useLS<AppUser[]>("ec_users", []);
  const [showUserModal, setShowUserModal] = useState(false);
  const [userForm, setUserForm] = useState({ ...BLANK_USER });
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [showSenha, setShowSenha] = useState(false);

  const saveUser = () => {
    if (!userForm.nome.trim() || !userForm.email.trim()) return;
    if (editingUserId) {
      setUsers(prev => prev.map(u => u.id === editingUserId ? { ...userForm, id: editingUserId } : u));
    } else {
      setUsers(prev => [...prev, { ...userForm, id: `USR-${Date.now()}` }]);
    }
    setUserForm({ ...BLANK_USER });
    setEditingUserId(null);
    setShowUserModal(false);
  };

  const deleteUser = (id: string) => setUsers(prev => prev.filter(u => u.id !== id));

  const handleUserPhoto = (id: string, file: File) => {
    const reader = new FileReader();
    reader.onload = () => setUsers(prev => prev.map(u => u.id === id ? { ...u, photo: reader.result as string } : u));
    reader.readAsDataURL(file);
  };

  const openEditUser = (u: AppUser) => {
    setUserForm({ nome: u.nome, email: u.email, cargo: u.cargo, senha: u.senha });
    setEditingUserId(u.id);
    setShowUserModal(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Preferências, acesso e personalização</p>
      </div>
      <div className="flex gap-5">
        <nav className="w-44 flex-shrink-0 space-y-0.5">
          {([
            { id: "profile",       label: "Perfil" },
            { id: "users",         label: "Usuários" },
            { id: "appearance",    label: "Aparência" },
            { id: "notifications", label: "Notificações" },
          ] as const).map(t => (
            <button key={t.id} onClick={() => setTab(t.id)}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${tab === t.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}>
              {t.label}
            </button>
          ))}
        </nav>
        <div className="flex-1 bg-card border border-border rounded-xl p-6">
          {tab === "profile" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-base font-bold text-foreground">Informações do Perfil</h2>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold text-xl">EC</div>
                <div>
                  <p className="text-sm font-bold text-foreground">Administrador</p>
                  <p className="text-xs text-muted-foreground">Econsul · UFRN</p>
                  <label className="text-xs text-primary mt-1 hover:underline font-semibold cursor-pointer">
                    Alterar foto
                    <input type="file" accept="image/*" className="hidden" />
                  </label>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {["Nome Completo", "E-mail da Econsul", "Cargo"].map(f => (
                  <div key={f}><label className="block text-xs font-bold text-muted-foreground mb-1">{f}</label><input placeholder={`Informe ${f.toLowerCase()}`} className={inputCls} /></div>
                ))}
              </div>
              <button className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90">Salvar Alterações</button>
            </div>
          )}
          {tab === "appearance" && (
            <div className="space-y-5">
              <h2 className="text-base font-bold text-foreground">Aparência</h2>
              <div>
                <p className="text-sm font-semibold text-foreground mb-3">Tema da Interface</p>
                <div className="flex gap-3">
                  {(["light", "dark"] as const).map(t => (
                    <button key={t} onClick={() => setTheme(t)}
                      className={`flex items-center gap-2.5 px-5 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${theme === t ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground"}`}>
                      {t === "light" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      {t === "light" ? "Claro" : "Escuro"}
                    </button>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-border">
                <p className="text-sm font-semibold text-foreground mb-1">Cor Institucional</p>
                <div className="flex items-center gap-2 mt-2"><div className="w-8 h-8 rounded-full bg-primary border-2 border-primary/30" /><span className="text-sm font-mono text-foreground">#6B1A2C</span></div>
              </div>
            </div>
          )}
          {tab === "notifications" && (
            <div className="space-y-5 max-w-lg">
              <h2 className="text-base font-bold text-foreground">Notificações</h2>
              <div className="space-y-1">
                {["Prazo de demanda se aproximando", "Nova demanda atribuída", "Demanda urgente criada", "Relatório disponível", "Reunião em 15 minutos", "Projeto atrasado"].map((n, i) => (
                  <div key={n} className="flex items-center justify-between py-3 border-b border-border">
                    <span className="text-sm text-foreground">{n}</span>
                    <div className={`w-10 h-5 rounded-full relative cursor-pointer transition-colors ${i < 4 ? "bg-primary" : "bg-muted"}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${i < 4 ? "right-0.5" : "left-0.5"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "users" && (
            <div className="space-y-5">
              {/* Modal */}
              {showUserModal && (
                <Modal title={editingUserId ? "Editar Usuário" : "Cadastrar Usuário"} onClose={() => { setShowUserModal(false); setEditingUserId(null); setUserForm({ ...BLANK_USER }); }}>
                  <div className="space-y-4">
                    <Field label="Nome Completo *">
                      <input value={userForm.nome} onChange={e => setUserForm(f => ({ ...f, nome: e.target.value }))} placeholder="Ex.: Ana Carolina Souza" className={inputCls} />
                    </Field>
                    <Field label="E-mail da Econsul *">
                      <input type="email" value={userForm.email} onChange={e => setUserForm(f => ({ ...f, email: e.target.value }))} placeholder="ana.souza@econsul.com.br" className={inputCls} />
                    </Field>
                    <Field label="Cargo">
                      <input value={userForm.cargo} onChange={e => setUserForm(f => ({ ...f, cargo: e.target.value }))} placeholder="Ex.: Diretora de Projetos" className={inputCls} />
                    </Field>
                    <Field label="Senha">
                      <div className="relative">
                        <input
                          type={showSenha ? "text" : "password"}
                          value={userForm.senha}
                          onChange={e => setUserForm(f => ({ ...f, senha: e.target.value }))}
                          placeholder="••••••••"
                          className={inputCls + " pr-10"}
                        />
                        <button type="button" onClick={() => setShowSenha(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs font-semibold">
                          {showSenha ? "Ocultar" : "Ver"}
                        </button>
                      </div>
                    </Field>
                    <div className="flex gap-2 pt-2">
                      <button onClick={saveUser} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">
                        {editingUserId ? "Salvar Alterações" : "Cadastrar Usuário"}
                      </button>
                      <button onClick={() => { setShowUserModal(false); setEditingUserId(null); setUserForm({ ...BLANK_USER }); }}
                        className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
                    </div>
                  </div>
                </Modal>
              )}

              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-foreground">Usuários Cadastrados</h2>
                  <p className="text-xs text-muted-foreground mt-0.5">{users.length} usuário{users.length !== 1 ? "s" : ""} no sistema</p>
                </div>
                <button onClick={() => { setUserForm({ ...BLANK_USER }); setEditingUserId(null); setShowUserModal(true); }}
                  className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
                  <Plus className="w-4 h-4" />Novo Usuário
                </button>
              </div>

              {users.length === 0 ? (
                <div className="border border-border rounded-xl p-10">
                  <EmptyState icon={Users} title="Nenhum usuário cadastrado" sub="Clique em Novo Usuário para adicionar o primeiro acesso." />
                </div>
              ) : (
                <div className="space-y-2">
                  {users.map(u => (
                    <div key={u.id} className="flex items-center gap-4 bg-background border border-border rounded-xl px-4 py-3 hover:shadow-sm transition-shadow">
                      <label className="relative w-10 h-10 rounded-full flex-shrink-0 cursor-pointer group" title="Mudar foto">
                        {u.photo
                          ? <img src={u.photo} alt={u.nome} className="w-10 h-10 rounded-full object-cover" />
                          : <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white text-sm font-black">{u.nome.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}</div>
                        }
                        <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Pencil className="w-3.5 h-3.5 text-white" />
                        </div>
                        <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleUserPhoto(u.id, f); }} />
                      </label>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-foreground truncate">{u.nome}</p>
                        <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                      </div>
                      {u.cargo && (
                        <span className="px-2.5 py-1 rounded-lg bg-primary/10 text-primary text-[11px] font-bold flex-shrink-0">{u.cargo}</span>
                      )}
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button onClick={() => openEditUser(u)}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground transition-colors">
                          Editar
                        </button>
                        <button onClick={() => deleteUser(u.id)}
                          className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 text-red-600 dark:text-red-400 transition-colors">
                          Excluir
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Manuais ─────────────────────────────────────────────────────────────────
interface Manual {
  id: string; name: string; responsible: string; date: string;
  fileName: string; fileUrl: string;
}

function ManuaisPage({ manuais, setManuais, pushUndo }: { manuais: Manual[]; setManuais: React.Dispatch<React.SetStateAction<Manual[]>>; pushUndo: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: "", responsible: "", date: "", fileName: "", fileUrl: "" });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, fileName: file.name, fileUrl: URL.createObjectURL(file) }));
  };

  const save = () => {
    if (!form.name.trim()) return;
    setManuais(prev => [...prev, { ...form, id: `MAN-${Date.now()}` }]);
    setForm({ name: "", responsible: "", date: "", fileName: "", fileUrl: "" });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Cadastrar Manual" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Field label="Nome do Manual *">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Manual de Atendimento ao Cliente" className={inputCls} />
            </Field>
            <Field label="Cadastrado por">
              <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Nome do responsável" className={inputCls} />
            </Field>
            <Field label="Data de Cadastro">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Arquivo PDF">
              <label className="flex items-center gap-3 w-full cursor-pointer group">
                <div className="flex-1 flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                  <span className={`text-sm truncate ${form.fileName ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {form.fileName || "Clique para selecionar um PDF"}
                  </span>
                </div>
                <input type="file" accept=".pdf" className="hidden" onChange={handleFile} />
              </label>
              {form.fileName && <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Arquivo selecionado</p>}
            </Field>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">Salvar Manual</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Manuais</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{manuais.length} manual{manuais.length !== 1 ? "is" : ""} cadastrado{manuais.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />Novo Manual
        </button>
      </div>

      {manuais.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10">
          <EmptyState icon={BookOpen} title="Nenhum manual cadastrado" sub="Clique em Novo Manual para adicionar manuais de serviço em PDF." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {manuais.map(m => (
            <div key={m.id} className="bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-foreground leading-snug">{m.name}</h3>
                  {m.responsible && <p className="text-xs text-muted-foreground mt-0.5">Por: {m.responsible}</p>}
                  {m.fileName && <p className="text-[11px] text-muted-foreground truncate mt-0.5">{m.fileName}</p>}
                </div>
              </div>
              <div className="flex items-center justify-between pt-3 border-t border-border">
                <span className="text-[11px] text-muted-foreground">{m.date || "Sem data"}</span>
                <div className="flex items-center gap-2">
                  {m.fileUrl && (
                    <>
                      <a href={m.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-muted-foreground border border-border rounded-lg px-2.5 py-1.5 hover:bg-muted font-semibold">
                        <Eye className="w-3.5 h-3.5" />Ver
                      </a>
                      <a href={m.fileUrl} download={m.fileName} className="flex items-center gap-1.5 text-xs text-primary-foreground bg-primary rounded-lg px-2.5 py-1.5 hover:opacity-90 font-semibold">
                        <Download className="w-3.5 h-3.5" />Baixar
                      </a>
                    </>
                  )}
                  <button onClick={() => { pushUndo(); setManuais(prev => prev.filter(x => x.id !== m.id)); }}
                    className="flex items-center gap-1.5 text-xs text-red-600 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg px-2.5 py-1.5 hover:bg-red-100 font-semibold">
                    <X className="w-3.5 h-3.5" />Excluir
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Capacitação ──────────────────────────────────────────────────────────────
type CapMidiaType = "pdf" | "video";

interface CapItem {
  id: string; name: string; responsible: string; date: string;
  midiaType: CapMidiaType; fileName: string; fileUrl: string;
}

function CapacitacaoPage({ items, setItems, pushUndo }: { items: CapItem[]; setItems: React.Dispatch<React.SetStateAction<CapItem[]>>; pushUndo: () => void }) {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<{ name: string; responsible: string; date: string; midiaType: CapMidiaType; fileName: string; fileUrl: string }>({
    name: "", responsible: "", date: "", midiaType: "pdf", fileName: "", fileUrl: "",
  });

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setForm(f => ({ ...f, fileName: file.name, fileUrl: URL.createObjectURL(file) }));
  };

  const save = () => {
    if (!form.name.trim()) return;
    setItems(prev => [...prev, { ...form, id: `CAP-${Date.now()}` }]);
    setForm({ name: "", responsible: "", date: "", midiaType: "pdf", fileName: "", fileUrl: "" });
    setShowModal(false);
  };

  return (
    <div className="space-y-6">
      {showModal && (
        <Modal title="Cadastrar Capacitação" onClose={() => setShowModal(false)}>
          <div className="space-y-4">
            <Field label="Nome da Capacitação *">
              <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex.: Treinamento em Excel Avançado" className={inputCls} />
            </Field>
            <Field label="Cadastrado por">
              <input value={form.responsible} onChange={e => setForm(f => ({ ...f, responsible: e.target.value }))} placeholder="Nome do responsável" className={inputCls} />
            </Field>
            <Field label="Data de Cadastro">
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} className={inputCls} />
            </Field>
            <Field label="Tipo de Mídia">
              <div className="flex gap-2">
                {([["pdf", "PDF", FileText], ["video", "Vídeo", Video]] as const).map(([val, label, Icon]) => (
                  <button key={val} type="button" onClick={() => setForm(f => ({ ...f, midiaType: val, fileName: "", fileUrl: "" }))}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${form.midiaType === val ? "border-primary text-primary bg-primary/5" : "border-border text-muted-foreground"}`}>
                    <Icon className="w-4 h-4" />{label}
                  </button>
                ))}
              </div>
            </Field>
            <Field label={form.midiaType === "pdf" ? "Arquivo PDF" : "Arquivo de Vídeo"}>
              <label className="flex items-center gap-3 w-full cursor-pointer group">
                <div className="flex-1 flex items-center gap-3 border border-dashed border-border rounded-lg px-4 py-3 hover:border-primary/50 hover:bg-primary/5 transition-colors">
                  {form.midiaType === "pdf"
                    ? <Paperclip className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />
                    : <Video className="w-4 h-4 text-muted-foreground group-hover:text-primary flex-shrink-0" />}
                  <span className={`text-sm truncate ${form.fileName ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {form.fileName || (form.midiaType === "pdf" ? "Clique para selecionar um PDF" : "Clique para selecionar um vídeo (MP4, MOV…)")}
                  </span>
                </div>
                <input type="file" accept={form.midiaType === "pdf" ? ".pdf" : "video/*"} className="hidden" onChange={handleFile} />
              </label>
              {form.fileName && <p className="text-[11px] text-emerald-600 mt-1 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Arquivo selecionado</p>}
            </Field>
            <div className="flex gap-2 pt-2">
              <button onClick={save} className="flex-1 bg-primary text-primary-foreground py-2 rounded-lg text-sm font-bold hover:opacity-90">Salvar Capacitação</button>
              <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded-lg text-sm font-semibold text-muted-foreground hover:bg-muted">Cancelar</button>
            </div>
          </div>
        </Modal>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Capacitação</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{items.length} item{items.length !== 1 ? "s" : ""} cadastrado{items.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90">
          <Plus className="w-4 h-4" />Nova Capacitação
        </button>
      </div>

      {items.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-10">
          <EmptyState icon={GraduationCap} title="Nenhuma capacitação cadastrada" sub="Clique em Nova Capacitação para adicionar PDFs ou vídeos de treinamento." />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map(item => {
            const isVideo = item.midiaType === "video";
            return (
              <div key={item.id} className="bg-card border border-border rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                {isVideo && item.fileUrl ? (
                  <div className="relative w-full bg-black aspect-video flex items-center justify-center">
                    <video src={item.fileUrl} className="w-full h-full object-contain" controls={false} />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                        <Play className="w-4 h-4 text-primary ml-0.5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-24 bg-primary/5 flex items-center justify-center">
                    <FileText className="w-8 h-8 text-primary/40" />
                  </div>
                )}
                <div className="p-4">
                  <div className="flex items-start gap-2 mb-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${isVideo ? "bg-blue-50 dark:bg-blue-900/20" : "bg-red-50 dark:bg-red-900/20"}`}>
                      {isVideo ? <Video className="w-3.5 h-3.5 text-blue-600" /> : <FileText className="w-3.5 h-3.5 text-red-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-foreground leading-snug">{item.name}</h3>
                      {item.responsible && <p className="text-xs text-muted-foreground mt-0.5">Por: {item.responsible}</p>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <span className="text-[11px] text-muted-foreground">{item.date || "Sem data"}</span>
                    <div className="flex items-center gap-1.5">
                      {item.fileUrl && isVideo && (
                        <a href={item.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-lg px-2 py-1.5 hover:bg-muted font-semibold">
                          <Play className="w-3 h-3" />Assistir
                        </a>
                      )}
                      {item.fileUrl && !isVideo && (
                        <>
                          <a href={item.fileUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs text-muted-foreground border border-border rounded-lg px-2 py-1.5 hover:bg-muted font-semibold">
                            <Eye className="w-3 h-3" />Ver
                          </a>
                          <a href={item.fileUrl} download={item.fileName} className="flex items-center gap-1 text-xs text-primary-foreground bg-primary rounded-lg px-2 py-1.5 hover:opacity-90 font-semibold">
                            <Download className="w-3 h-3" />Baixar
                          </a>
                        </>
                      )}
                      <button onClick={() => { pushUndo(); setItems(prev => prev.filter(x => x.id !== item.id)); }}
                        className="flex items-center gap-1 text-xs text-red-600 border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 rounded-lg px-2 py-1.5 hover:bg-red-100 font-semibold">
                        <X className="w-3 h-3" />Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────
const NAV: { id: Page; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard",     icon: LayoutDashboard },
  { id: "projects",  label: "Projetos",      icon: FolderKanban },
  { id: "services",  label: "Serviços",      icon: Briefcase },
  { id: "calendar",  label: "Calendário",    icon: Calendar },
  { id: "team",      label: "Equipe",        icon: Users },
  { id: "kpis",      label: "KPIs",          icon: BarChart3 },
  { id: "reports",      label: "Relatórios",   icon: FileText },
  { id: "manuais",      label: "Manuais",      icon: BookOpen },
  { id: "capacitacao",  label: "Capacitação",  icon: GraduationCap },
  { id: "settings",     label: "Configurações",icon: Settings },
];

function Sidebar({ page, setPage, collapsed, setCollapsed }: {
  page: Page; setPage: (p: Page) => void; collapsed: boolean; setCollapsed: (v: boolean) => void;
}) {
  return (
    <aside className={`fixed left-0 top-0 h-full bg-sidebar text-sidebar-foreground flex flex-col z-30 transition-all duration-300 ${collapsed ? "w-16" : "w-60"}`}>
      <div className={`flex items-center gap-3 px-3 py-4 border-b border-sidebar-border ${collapsed ? "justify-center" : ""}`}>
        <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center flex-shrink-0">
          <Building2 className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">Econsul</p>
            <p className="text-[10px] text-white/55">Empresa Júnior</p>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 rounded-lg hover:bg-white/10 flex-shrink-0">
          {collapsed ? <ChevronRight className="w-3.5 h-3.5 text-white/60" /> : <ChevronLeft className="w-3.5 h-3.5 text-white/60" />}
        </button>
      </div>
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto">
        {NAV.map(item => {
          const active = page === item.id;
          return (
            <button key={item.id} onClick={() => setPage(item.id)} title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-all ${collapsed ? "justify-center" : ""} ${active ? "bg-white/20 text-white shadow-sm" : "text-white/65 hover:bg-white/10 hover:text-white"}`}>
              <item.icon className="w-4 h-4 flex-shrink-0" />
              {!collapsed && <span className="flex-1 text-left">{item.label}</span>}
              {!collapsed && active && <ChevronRight className="w-3 h-3 opacity-60" />}
            </button>
          );
        })}
      </nav>
      <div className={`p-3 border-t border-sidebar-border ${collapsed ? "flex justify-center" : ""}`}>
        {collapsed
          ? <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">EC</div>
          : <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">EC</div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">Administrador</p>
                <p className="text-[10px] text-white/55">Econsul</p>
              </div>
              <button className="p-1 rounded hover:bg-white/10"><LogOut className="w-3.5 h-3.5 text-white/50" /></button>
            </div>
        }
      </div>
    </aside>
  );
}

// ─── Header ──────────────────────────────────────────────────────────────────
function Header({ theme, setTheme, collapsed, setPage, canUndo, onUndo, authUser, onLogout }: {
  theme: "light" | "dark"; setTheme: (t: "light" | "dark") => void;
  collapsed: boolean; setPage: (p: Page) => void;
  canUndo: boolean; onUndo: () => void;
  authUser: { nome: string; cargo: string } | null; onLogout: () => void;
}) {
  const [notifOpen, setNotifOpen] = useState(false);
  return (
    <header className={`fixed top-0 right-0 h-14 bg-card border-b border-border flex items-center px-4 gap-3 z-20 transition-all duration-300 ${collapsed ? "left-16" : "left-60"}`}>
      <div className="flex-1 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Buscar projetos, serviços, membros..."
            className="w-full pl-9 pr-4 py-2 text-xs bg-muted rounded-lg border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground" />
        </div>
      </div>
      <div className="flex items-center gap-1.5 ml-auto">
        {/* Undo button */}
        <button
          onClick={onUndo}
          title={canUndo ? "Desfazer última exclusão" : "Nada para desfazer"}
          className={`flex items-center gap-1.5 px-3 h-8 rounded-lg text-xs font-bold transition-all ${canUndo ? "bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30" : "text-muted-foreground/30 cursor-default pointer-events-none"}`}
        >
          <ChevronLeft className="w-3.5 h-3.5" />
          Desfazer
        </button>
        <button onClick={() => setTheme(theme === "light" ? "dark" : "light")}
          className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
          {theme === "light" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
        </button>
        <div className="relative">
          <button onClick={() => setNotifOpen(v => !v)}
            className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-muted transition-colors text-muted-foreground">
            <Bell className="w-4 h-4" />
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-11 w-72 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                <span className="text-sm font-bold text-foreground">Notificações</span>
                <button onClick={() => setNotifOpen(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
              </div>
              <div className="p-4">
                <EmptyState icon={Bell} title="Nenhuma notificação" sub="Você está em dia com tudo." />
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 pl-2 border-l border-border">
          <div onClick={() => setPage("settings")} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity" title="Configurações">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-xs font-black">
              {authUser ? authUser.nome.split(" ").map(n => n[0]).slice(0,2).join("").toUpperCase() : "EC"}
            </div>
            {authUser && (
              <div className="hidden md:block text-left">
                <p className="text-xs font-bold text-foreground leading-none">{authUser.nome.split(" ")[0]}</p>
                <p className="text-[10px] text-muted-foreground leading-none mt-0.5">{authUser.cargo}</p>
              </div>
            )}
          </div>
          <button onClick={onLogout} title="Sair"
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-red-50 dark:hover:bg-red-900/20 text-muted-foreground hover:text-red-500 transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

// ─── Persistence hook ────────────────────────────────────────────────────────
function useLS<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const stored = localStorage.getItem(key);
      return stored ? (JSON.parse(stored) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal];
}

// ─── App ─────────────────────────────────────────────────────────────────────
type UndoSnapshot = {
  projects: Project[]; services: Service[]; team: TeamMember[]; events: CalEvent[];
  fluxogramas: Record<string, Etapa[]>; demandas: Demanda[]; reports: Report[];
  manuais: Manual[]; capItems: CapItem[];
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
interface AuthUser { nome: string; email: string; cargo: string; senha: string }

function AuthScreen({ onEnter }: { onEnter: (user: AuthUser) => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<AuthUser>({ nome: "", email: "", cargo: "", senha: "" });
  const [users, setUsers] = useLS<AppUser[]>("ec_users", []);

  const patch = (k: keyof AuthUser, v: string) => { setForm(f => ({ ...f, [k]: v })); setError(""); setSuccess(""); };

  const handleSubmit = () => {
    if (mode === "register") {
      if (!form.nome.trim() || !form.email.trim() || !form.cargo.trim() || !form.senha.trim()) {
        setError("Preencha todos os campos."); return;
      }
      if (users.some(u => u.email.toLowerCase() === form.email.toLowerCase())) {
        setError("E-mail já cadastrado."); return;
      }
      setUsers([...users, { id: `USR-${Date.now()}`, ...form }]);
      setSuccess("Cadastro realizado com sucesso! Faça login para entrar.");
      setMode("login");
      setForm({ nome: "", email: "", cargo: "", senha: "" });
    } else {
      const found = users.find(u => u.email.toLowerCase() === form.email.toLowerCase() && u.senha === form.senha);
      if (!found) { setError("E-mail ou senha incorretos."); return; }
      onEnter(found);
    }
  };

  const inputCls = "w-full h-11 rounded-xl border border-border bg-background/60 px-4 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all";

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 30% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 80%, white 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
        <div className="relative z-10 text-center">
          <div className="w-20 h-20 rounded-3xl bg-white/15 flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <Building2 className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Econsul</h1>
          <p className="text-white/70 text-lg font-medium mb-2">Consultoria Econômica</p>
          <p className="text-white/50 text-sm max-w-xs leading-relaxed">Gerencie projetos, equipes e entregas com excelência e precisão.</p>
          <div className="mt-10 flex flex-col gap-3 text-left">
            {["Gestão de projetos e serviços", "Fluxogramas e infográficos", "Controle de entregáveis", "Dashboard em tempo real"].map(f => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
                <span className="text-white/80 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Logo mobile */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <Building2 className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-black text-foreground">Econsul</span>
          </div>

          <h2 className="text-2xl font-black text-foreground mb-1">
            {mode === "login" ? "Bem-vindo de volta" : "Criar conta"}
          </h2>
          <p className="text-sm text-muted-foreground mb-8">
            {mode === "login" ? "Faça login para acessar o sistema." : "Preencha seus dados para se cadastrar."}
          </p>

          <div className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Nome completo</label>
                <input value={form.nome} onChange={e => patch("nome", e.target.value)} placeholder="Ex: Maria Silva" className={inputCls} />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">E-mail da Econsul</label>
              <input type="email" value={form.email} onChange={e => patch("email", e.target.value)} placeholder="seunome@econsul.com" className={inputCls} />
            </div>
            {mode === "register" && (
              <div>
                <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Cargo</label>
                <input value={form.cargo} onChange={e => patch("cargo", e.target.value)} placeholder="Ex: Consultor Júnior" className={inputCls} />
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-foreground mb-1.5 uppercase tracking-wide">Senha</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.senha}
                  onChange={e => patch("senha", e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSubmit()}
                  placeholder="••••••••"
                  className={inputCls + " pr-11"}
                />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            </div>

            {success && (
              <div className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                <p className="text-xs text-green-700 dark:text-green-400 font-medium">{success}</p>
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-600 dark:text-red-400 font-medium">{error}</p>
              </div>
            )}

            <button
              onClick={handleSubmit}
              className="w-full h-11 bg-primary text-primary-foreground rounded-xl font-bold text-sm hover:opacity-90 active:scale-[0.98] transition-all shadow-lg shadow-primary/20"
            >
              {mode === "login" ? "Entrar no sistema" : "Cadastrar e entrar"}
            </button>
          </div>

          <div className="mt-6 text-center">
            <span className="text-sm text-muted-foreground">
              {mode === "login" ? "Ainda não tem conta? " : "Já possui conta? "}
            </span>
            <button onClick={() => { setMode(m => m === "login" ? "register" : "login"); setError(""); setForm({ nome: "", email: "", cargo: "", senha: "" }); }}
              className="text-sm font-bold text-primary hover:underline">
              {mode === "login" ? "Cadastre-se" : "Fazer login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [authUser, setAuthUser] = useLS<AuthUser | null>("ec_session", null);
  const [page,      setPage]      = useLS<Page>("ec_page", "dashboard");
  const [collapsed, setCollapsed] = useLS<boolean>("ec_sidebar_collapsed", false);

  const [theme,       setThemeRaw]    = useLS<"light"|"dark">("ec_theme", "light");
  const [projects,    setProjects]    = useLS<Project[]>("ec_projects", []);
  const [services,    setServices]    = useLS<Service[]>("ec_services", []);
  const [team,        setTeam]        = useLS<TeamMember[]>("ec_team", []);
  const [events,      setEvents]      = useLS<CalEvent[]>("ec_events", []);
  const [fluxogramas, setFluxogramas] = useLS<Record<string, Etapa[]>>("ec_fluxogramas", {});
  const [demandas,    setDemandas]    = useLS<Demanda[]>("ec_demandas", []);
  const [reports,     setReports]     = useLS<Report[]>("ec_reports", []);
  const [manuais,     setManuais]     = useLS<Manual[]>("ec_manuais", []);
  const [capItems,    setCapItems]    = useLS<CapItem[]>("ec_capacitacao", []);

  const [undoStack, setUndoStack] = useState<UndoSnapshot[]>([]);

  // Ref always holds the latest state — safe to read from stable callbacks
  const stateRef = useRef<UndoSnapshot>({ projects, services, team, events, fluxogramas, demandas, reports, manuais, capItems });
  useEffect(() => {
    stateRef.current = { projects, services, team, events, fluxogramas, demandas, reports, manuais, capItems };
  });

  // Stable reference — child components won't get stale closures
  const pushUndo = useCallback(() => {
    setUndoStack(prev => [...prev.slice(-19), { ...stateRef.current }]);
  }, []);

  const handleUndo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev;
      const snap = prev[prev.length - 1];
      setProjects(snap.projects);
      setServices(snap.services);
      setTeam(snap.team);
      setEvents(snap.events);
      setFluxogramas(snap.fluxogramas);
      setDemandas(snap.demandas);
      setReports(snap.reports);
      setManuais(snap.manuais);
      setCapItems(snap.capItems);
      return prev.slice(0, -1);
    });
  }, [setProjects, setServices, setTeam, setEvents, setFluxogramas, setDemandas, setReports, setManuais, setCapItems]);

  const handleTheme = (t: "light" | "dark") => {
    setThemeRaw(t);
    document.documentElement.classList.toggle("dark", t === "dark");
  };

  // Apply saved theme on mount
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, []);

  if (!authUser) return <AuthScreen onEnter={u => setAuthUser(u)} />;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar page={page} setPage={setPage} collapsed={collapsed} setCollapsed={setCollapsed} />
      <Header theme={theme} setTheme={handleTheme} collapsed={collapsed} setPage={setPage} canUndo={undoStack.length > 0} onUndo={handleUndo} authUser={authUser} onLogout={() => setAuthUser(null)} />
      <main className={`pt-14 min-h-screen transition-all duration-300 ${collapsed ? "pl-16" : "pl-60"}`}>
        <div className="p-6 max-w-[1400px]">
          {page === "dashboard"   && <DashboardPage projects={projects} events={events} />}
          {page === "projects"    && <ProjectsPage projects={projects} setProjects={setProjects} pushUndo={pushUndo} />}
          {page === "services"    && <ServicesPage services={services} setServices={setServices} fluxogramas={fluxogramas} setFluxogramas={setFluxogramas} pushUndo={pushUndo} />}
          {page === "calendar"    && <CalendarPage events={events} setEvents={setEvents} pushUndo={pushUndo} />}
          {page === "team"        && <TeamPage team={team} setTeam={setTeam} projects={projects} pushUndo={pushUndo} />}
          {page === "kpis"        && <KPIsPage demandas={demandas} setDemandas={setDemandas} pushUndo={pushUndo} />}
          {page === "reports"     && <ReportsPage reports={reports} setReports={setReports} pushUndo={pushUndo} />}
          {page === "manuais"     && <ManuaisPage manuais={manuais} setManuais={setManuais} pushUndo={pushUndo} />}
          {page === "capacitacao" && <CapacitacaoPage items={capItems} setItems={setCapItems} pushUndo={pushUndo} />}
          {page === "settings"    && <SettingsPage theme={theme} setTheme={handleTheme} />}
        </div>
      </main>

      {/* Floating undo button — visible on all tabs */}
      {undoStack.length > 0 && (
        <button
          onClick={handleUndo}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-foreground text-background px-4 py-2.5 rounded-full shadow-xl hover:opacity-90 active:scale-95 transition-all text-sm font-bold"
          title="Desfazer última exclusão"
        >
          <ChevronLeft className="w-4 h-4" />
          Desfazer
          {undoStack.length > 1 && (
            <span className="ml-1 px-1.5 py-0.5 rounded-full bg-background/20 text-[10px] font-black">
              {undoStack.length}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
