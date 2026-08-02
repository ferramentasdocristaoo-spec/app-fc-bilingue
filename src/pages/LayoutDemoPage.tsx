import { useState } from "react";
import {
  BookOpen, CalendarDays, ChevronRight, CircleUserRound, Clock3, Feather,
  FileText, Flame, FolderOpen, Heart, Home, Library, Menu, MessageCircle,
  Mic2, MoreHorizontal, Search, Sparkles, Users, WandSparkles,
} from "lucide-react";
import "./LayoutDemoPage.css";

type Model = "desk" | "journey" | "studio";

const models: { id: Model; number: string; title: string; subtitle: string }[] = [
  { id: "desk", number: "01", title: "Mesa de Preparação", subtitle: "Trabalho organizado por projetos" },
  { id: "journey", number: "02", title: "Jornada Guiada", subtitle: "Experiência orientada por objetivos" },
  { id: "studio", number: "03", title: "Estúdio de Pregação", subtitle: "Editor e IA no mesmo ambiente" },
];

const Logo = () => <div className="demo-logo"><Flame /><div><strong>Ferramentas</strong><span>do Cristão</span></div></div>;

function DeskModel() {
  return <div className="product desk-model">
    <aside className="desk-nav">
      <Logo />
      <nav>
        <button className="active"><Home />Hoje</button>
        <button><FolderOpen />Mensagens</button>
        <button><BookOpen />Bíblia e pesquisa</button>
        <button><Library />Biblioteca</button>
        <button><Users />Comunidade</button>
      </nav>
      <div className="nav-profile"><span>KC</span><div><strong>Kiyo</strong><small>Meu ministério</small></div><MoreHorizontal /></div>
    </aside>
    <main className="desk-main">
      <header><div><span>DOMINGO, 02 DE AGOSTO</span><h1>Bom dia, Kiyo.</h1><p>Continue preparando aquilo que Deus colocou em seu coração.</p></div><div className="top-actions"><button><Search /></button><button><CircleUserRound /></button></div></header>
      <section className="workbench">
        <div className="workbench-copy"><span className="eyebrow"><Sparkles />EM PREPARAÇÃO</span><h2>A graça que<br />nos sustenta</h2><p>2 Coríntios 12:9 · Culto de domingo</p><div className="completion"><span><b>68%</b> da mensagem concluída</span><div><i /></div></div><button className="gold-button">Continuar preparando <ChevronRight /></button></div>
        <div className="sermon-map"><div className="map-line" /><div className="map-item done"><span>✓</span><div><strong>Texto e propósito</strong><small>Concluído</small></div></div><div className="map-item current"><span>2</span><div><strong>Desenvolvimento</strong><small>Você está aqui</small></div></div><div className="map-item"><span>3</span><div><strong>Conclusão e revisão</strong><small>Próxima etapa</small></div></div></div>
      </section>
      <div className="section-head"><div><h3>Sua mesa</h3><p>Atalhos baseados no que você está preparando.</p></div><button>Personalizar</button></div>
      <section className="desk-widgets">
        <article><div className="widget-icon"><BookOpen /></div><div><span>PESQUISA RELACIONADA</span><h4>Contexto de 2 Coríntios</h4><p>História, autoria e palavras-chave.</p></div><ChevronRight /></article>
        <article><div className="widget-icon"><CalendarDays /></div><div><span>PRÓXIMA PREGAÇÃO</span><h4>Domingo · 19h30</h4><p>Faltam 4 dias para revisar.</p></div><ChevronRight /></article>
        <article><div className="widget-icon"><Heart /></div><div><span>MOMENTO COM DEUS</span><h4>Devocional de hoje</h4><p>5 minutos de leitura e oração.</p></div><ChevronRight /></article>
      </section>
    </main>
  </div>;
}

function JourneyModel() {
  const steps = ["Ponto de partida", "Texto e contexto", "Estrutura", "Desenvolvimento", "Revisão e púlpito"];
  return <div className="product journey-model">
    <header className="journey-header"><Logo /><div className="journey-progress">{steps.map((s, i) => <div className={i === 0 ? "active" : ""} key={s}><span>{i + 1}</span><small>{s}</small></div>)}</div><button className="exit-button">Salvar e sair</button></header>
    <main className="journey-main">
      <div className="journey-kicker"><span>1</span> PONTO DE PARTIDA</div>
      <h1>O que você precisa<br />preparar hoje?</h1>
      <p className="journey-intro">Escolha um caminho. A plataforma organiza as ferramentas certas e acompanha você até a mensagem final.</p>
      <section className="journey-options">
        <button className="featured"><span className="option-icon"><Mic2 /></span><div><small>CAMINHO COMPLETO</small><h2>Uma nova pregação</h2><p>Do tema ou texto bíblico até o modo púlpito.</p></div><ChevronRight /></button>
        <button><span className="option-icon"><BookOpen /></span><div><h2>Estudar um texto</h2><p>Contexto, significado e aplicação.</p></div><ChevronRight /></button>
        <button><span className="option-icon"><Heart /></span><div><h2>Momento devocional</h2><p>Leitura, reflexão e oração guiada.</p></div><ChevronRight /></button>
        <button><span className="option-icon"><MessageCircle /></span><div><h2>Preparar uma ministração</h2><p>Conselho, visita, célula ou evento.</p></div><ChevronRight /></button>
      </section>
      <aside className="journey-help"><Flame /><div><strong>Não sabe por onde começar?</strong><span>Conte em uma frase o que está no seu coração e nós indicamos um caminho.</span></div><button>Conversar com o assistente</button></aside>
    </main>
  </div>;
}

function StudioModel() {
  return <div className="product studio-model">
    <header className="studio-header"><Logo /><div className="document-title"><FileText /><div><strong>A graça que nos sustenta</strong><span>Salvo agora</span></div></div><div className="studio-actions"><button>Visualizar</button><button className="gold-button">Modo púlpito <Mic2 /></button></div></header>
    <div className="studio-body">
      <aside className="project-panel"><div className="panel-title"><strong>Mensagem</strong><button><Menu /></button></div><nav><button className="active"><span>01</span>Visão geral</button><button><span>02</span>Introdução</button><button><span>03</span>Desenvolvimento</button><button><span>04</span>Conclusão</button></nav><div className="sources"><span>FONTES E MATERIAIS</span><button><BookOpen />2 Coríntios 12:9</button><button><Library />Graça no sofrimento</button><button>+ Adicionar material</button></div></aside>
      <main className="editor-canvas"><div className="paper"><span className="paper-label">SERMÃO EXPOSITIVO · 32 MIN</span><h1>A graça que nos sustenta</h1><p className="passage">“A minha graça te basta, porque o meu poder se aperfeiçoa na fraqueza.”</p><div className="paper-divider" /><h2>1. Quando a fraqueza revela nossa necessidade</h2><p>Paulo nos apresenta uma verdade que contraria a lógica humana: o poder de Deus não depende da nossa força. É justamente no lugar em que reconhecemos nossos limites que a graça encontra espaço para agir.</p><div className="editor-block"><span>IDEIA CENTRAL</span><p>A graça não elimina toda fraqueza; ela transforma a fraqueza em lugar de encontro com o poder de Deus.</p></div><h2>2. A suficiência da graça</h2><p className="ghost-text">Comece a desenvolver este ponto ou peça uma sugestão ao assistente...</p></div></main>
      <aside className="assistant-panel"><div className="assistant-head"><span><Sparkles />Assistente</span><button><MoreHorizontal /></button></div><div className="assistant-context"><small>TRABALHANDO COM VOCÊ</small><strong>Desenvolvimento · Ponto 2</strong></div><div className="assistant-message"><Flame /><p>Posso ajudar a desenvolver a ideia sobre a suficiência da graça. O que você deseja fazer?</p></div><div className="assistant-actions"><button><WandSparkles />Sugerir desenvolvimento</button><button><Search />Encontrar textos de apoio</button><button><Feather />Criar uma ilustração</button><button><Clock3 />Adaptar para 25 minutos</button></div><div className="assistant-input"><span>Peça algo sobre sua mensagem...</span><button>↑</button></div></aside>
    </div>
  </div>;
}

export default function LayoutDemoPage() {
  const [model, setModel] = useState<Model>("desk");
  return <div className="layout-demo">
    <header className="demo-switcher"><div><small>ESTUDO DE LAYOUT</small><strong>Mesmas cores. Três experiências.</strong></div><nav>{models.map(item => <button key={item.id} className={model === item.id ? "active" : ""} onClick={() => setModel(item.id)}><span>{item.number}</span><div><strong>{item.title}</strong><small>{item.subtitle}</small></div></button>)}</nav><div className="demo-tip">Clique para comparar</div></header>
    <div className="demo-stage">{model === "desk" && <DeskModel />}{model === "journey" && <JourneyModel />}{model === "studio" && <StudioModel />}</div>
  </div>;
}
