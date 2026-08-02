import { useState } from "react";
import {
  BookOpen, ChevronRight, Feather, Flame, Heart, Home, Library,
  Menu, Mic2, Moon, Search, Sparkles, Sun, Users, WandSparkles,
} from "lucide-react";
import "./DesignLabPage.css";

type Concept = "sanctuary" | "editorial" | "aurora";

const concepts: { id: Concept; number: string; name: string; idea: string }[] = [
  { id: "sanctuary", number: "01", name: "Santuário", idea: "Imersivo e contemplativo" },
  { id: "editorial", number: "02", name: "Editorial", idea: "Clássico e sofisticado" },
  { id: "aurora", number: "03", name: "Aurora", idea: "Moderno e acolhedor" },
];

const tools = [
  { icon: WandSparkles, title: "Oficina de Sermões", text: "Construa mensagens profundas com assistência inteligente." },
  { icon: Search, title: "Raio-X Bíblico", text: "Explore contexto, palavras e aplicações de cada versículo." },
  { icon: Heart, title: "Devocional Diário", text: "Uma pausa guiada para renovar sua comunhão com Deus." },
];

function Sanctuary() {
  return (
    <div className="concept sanctuary">
      <div className="sanctuary-glow" />
      <header className="concept-header">
        <div className="brand-mark"><Flame size={20} /><span>FC</span></div>
        <div className="brand-copy"><strong>Ferramentas</strong><span>do Cristão</span></div>
        <nav><a className="active">Início</a><a>Ferramentas</a><a>Biblioteca</a></nav>
        <button className="round-button"><Menu size={19} /></button>
      </header>
      <main className="sanctuary-main">
        <section className="sanctuary-hero">
          <div className="eyebrow"><span /> SUA JORNADA NA PALAVRA</div>
          <h1>Prepare a mensagem.<br /><em>Viva o chamado.</em></h1>
          <p>Um espaço de profundidade, inspiração e clareza para quem dedica a vida a compartilhar a Palavra.</p>
          <div className="hero-actions">
            <button className="primary-action">Começar agora <ChevronRight size={17} /></button>
            <button className="text-action"><span className="play">▶</span> Conhecer a plataforma</button>
          </div>
        </section>
        <aside className="daily-card">
          <div className="daily-top"><span>PALAVRA PARA HOJE</span><Sun size={18} /></div>
          <div className="verse-mark">“</div>
          <blockquote>Pregue a palavra, esteja preparado a tempo e fora de tempo.</blockquote>
          <cite>2 Timóteo 4:2</cite>
          <div className="daily-footer"><span>29 JUL</span><button><ChevronRight size={18} /></button></div>
        </aside>
      </main>
      <section className="sanctuary-tools">
        {tools.map(({ icon: Icon, title, text }, i) => (
          <article key={title}><span className="tool-num">0{i + 1}</span><Icon /><div><h3>{title}</h3><p>{text}</p></div><ChevronRight className="tool-arrow" /></article>
        ))}
      </section>
    </div>
  );
}

function Editorial() {
  return (
    <div className="concept editorial">
      <header className="editorial-header">
        <button className="editorial-menu"><Menu size={19} /> MENU</button>
        <div className="editorial-brand"><span>FERRAMENTAS DO</span><strong>CRISTÃO</strong><small>Fé · Estudo · Propósito</small></div>
        <div className="editorial-actions"><button><Search size={18} /></button><button><Moon size={17} /></button></div>
      </header>
      <div className="edition-line"><span>EDIÇÃO DIGITAL</span><span>QUARTA-FEIRA, 29 DE JULHO</span><span>MINISTÉRIO & PALAVRA</span></div>
      <main className="editorial-grid">
        <section className="editorial-lead">
          <span className="section-kicker">FORMAÇÃO PARA QUEM PREGA</span>
          <h1>A Palavra merece<br />o seu melhor preparo.</h1>
          <p className="dropcap">Transforme estudo em mensagens que alcançam pessoas. Ferramentas criadas para acompanhar cada etapa — da primeira inspiração ao púlpito.</p>
          <button className="ink-button">ABRIR A OFICINA <ChevronRight size={16} /></button>
        </section>
        <section className="editorial-art">
          <div className="arch">
            <div className="sun-disc" />
            <BookOpen className="open-book" strokeWidth={1} />
            <div className="rays" />
          </div>
          <span>“MANEJA BEM A PALAVRA DA VERDADE”</span>
        </section>
        <aside className="editorial-notes">
          <h2>Hoje na plataforma</h2>
          <article><span>01</span><div><strong>Seu devocional diário</strong><p>Uma reflexão sobre perseverança.</p></div></article>
          <article><span>02</span><div><strong>Continue seu esboço</strong><p>A graça que nos sustenta.</p></div></article>
          <article><span>03</span><div><strong>Biblioteca</strong><p>12 obras disponíveis para leitura.</p></div></article>
        </aside>
      </main>
      <footer className="editorial-footer">
        <div><strong>11</strong><span>FERRAMENTAS<br />MINISTERIAIS</span></div>
        <div><strong>6</strong><span>IDIOMAS<br />DISPONÍVEIS</span></div>
        <p>Estudo sólido.<br /><em>Mensagem viva.</em></p>
      </footer>
    </div>
  );
}

function Aurora() {
  const nav = [
    { icon: Home, label: "Início" }, { icon: WandSparkles, label: "Criar" },
    { icon: BookOpen, label: "Bíblia" }, { icon: Library, label: "Livraria" },
  ];
  return (
    <div className="concept aurora">
      <aside className="aurora-sidebar">
        <div className="aurora-logo"><Flame /><span>FC</span></div>
        <nav>{nav.map(({ icon: Icon, label }, i) => <button className={i === 0 ? "active" : ""} key={label}><Icon /><span>{label}</span></button>)}</nav>
        <button className="profile"><span>KC</span><div><strong>Kiyo</strong><small>Meu perfil</small></div></button>
      </aside>
      <main className="aurora-main">
        <header><div><span>QUARTA-FEIRA, 29 DE JULHO</span><h1>Graça e paz, Kiyo.</h1><p>O que vamos construir juntos hoje?</p></div><div className="aurora-head-actions"><button><Search /></button><button><Moon /></button></div></header>
        <section className="aurora-feature">
          <div className="feature-copy"><span className="soft-label"><Sparkles size={14} /> ASSISTENTE DE PREGAÇÃO</span><h2>Da inspiração ao<br />púlpito, com propósito.</h2><p>Comece com um tema, texto bíblico ou ideia. Nós ajudamos a organizar o caminho.</p><button>Nova mensagem <ChevronRight /></button></div>
          <div className="feature-orbit"><div className="orbit one" /><div className="orbit two" /><Feather /></div>
        </section>
        <div className="aurora-section-title"><h2>Seu espaço ministerial</h2><button>Ver tudo <ChevronRight /></button></div>
        <section className="aurora-cards">
          {[
            { icon: WandSparkles, title: "Oficina", text: "Crie um novo sermão", tone: "violet" },
            { icon: Mic2, title: "Púlpito", text: "Pratique sua mensagem", tone: "coral" },
            { icon: Users, title: "Mural", text: "Ore com a comunidade", tone: "blue" },
          ].map(({ icon: Icon, title, text, tone }) => <article key={title}><div className={`aurora-icon ${tone}`}><Icon /></div><div><h3>{title}</h3><p>{text}</p></div><ChevronRight /></article>)}
        </section>
        <section className="aurora-bottom">
          <article><span>CONTINUE DE ONDE PAROU</span><h3>A graça que nos sustenta</h3><p>Esboço · 68% concluído</p><div className="progress"><i /></div></article>
          <article className="aurora-verse"><span>VERSÍCULO DO DIA</span><p>“A tua palavra é lâmpada que ilumina os meus passos.”</p><small>Salmos 119:105</small></article>
        </section>
      </main>
    </div>
  );
}

export default function DesignLabPage() {
  const [active, setActive] = useState<Concept>("sanctuary");
  return (
    <div className="design-lab">
      <div className="lab-bar">
        <div><span>DESIGN LAB</span><strong>Ferramentas do Cristão</strong></div>
        <div className="concept-tabs">
          {concepts.map(c => <button key={c.id} onClick={() => setActive(c.id)} className={active === c.id ? "active" : ""}><small>{c.number}</small><span><strong>{c.name}</strong><em>{c.idea}</em></span></button>)}
        </div>
        <div className="lab-note">Propostas de direção visual</div>
      </div>
      <div className="concept-stage">
        {active === "sanctuary" && <Sanctuary />}
        {active === "editorial" && <Editorial />}
        {active === "aurora" && <Aurora />}
      </div>
    </div>
  );
}
