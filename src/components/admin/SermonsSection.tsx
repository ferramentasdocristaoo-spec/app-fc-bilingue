import { Lock, Share2, Smartphone } from "lucide-react";

/** Esboços ficam no aparelho de cada pregador: o painel só explica (nada a gerenciar aqui). */
const SermonsSection = () => (
  <div className="space-y-3">
    <div className="adm-card">
      <div className="adm-empty" style={{ paddingBottom: 12 }}>
        <span className="adm-tile"><Lock aria-hidden="true" /></span>
        <h3>Esboços são privados</h3>
        <p>Os esboços gerados ficam guardados <strong>no aparelho de cada pregador</strong>. O painel não vê o conteúdo de ninguém.</p>
      </div>
    </div>
    <div className="adm-list">
      <div className="adm-row">
        <span className="adm-tile"><Share2 aria-hidden="true" /></span>
        <div className="adm-row-main"><b>Quando o pregador quer mostrar</b><small>Ele publica por vontade própria no Púlpito Compartilhado, que é público.</small></div>
      </div>
      <div className="adm-row">
        <span className="adm-tile"><Smartphone aria-hidden="true" /></span>
        <div className="adm-row-main"><b>Por que assim</b><small>Sermão é trabalho pessoal e devocional. Guardar no aparelho respeita a privacidade e poupa o banco. O Início do painel ainda conta quantas vezes a Oficina foi aberta.</small></div>
      </div>
    </div>
  </div>
);

export default SermonsSection;
