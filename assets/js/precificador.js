// Cálculo de preço de uma impressão 3D. Funções puras, sem dependência do DOM,
// para poderem ser testadas isoladamente. Os nomes batem com as colunas de public.configuracoes.
const PADRAO = {
  tarifa_kwh: 0.95,
  potencia_impressora_w: 150,
  valor_impressora: 3000,
  vida_util_horas: 6000,
  manutencao_hora: 0.3,
  custo_mao_obra_hora: 0,
  custo_embalagem: 0,
  taxa_falha_pct: 10,
  margem_lucro_pct: 100,
  impostos_pct: 0,
  taxa_venda_pct: 0,
  preco_minimo: 0
};

function custoMaquinaHora(cfg) {
  return cfg.valor_impressora / Math.max(1, cfg.vida_util_horas) + cfg.manutencao_hora;
}

function calcularPreco(e, cfg = PADRAO) {
  const horas = e.tempo_min / 60;
  const qtd = Math.max(1, e.quantidade || 1);

  const material = (e.peso_g / 1000) * e.preco_kg;
  const energia = (cfg.potencia_impressora_w / 1000) * horas * cfg.tarifa_kwh;
  const maquina = horas * custoMaquinaHora(cfg);
  const maoObra = ((e.mao_obra_min || 0) / 60) * cfg.custo_mao_obra_hora;
  const extra = e.custo_extra || 0;
  const embalagem = cfg.custo_embalagem || 0;

  // A taxa de falha incide só sobre o que se perde quando uma impressão falha.
  const porPeca = (material + energia + maquina) * (1 + cfg.taxa_falha_pct / 100) + maoObra + extra + embalagem;
  const custoTotal = porPeca * qtd;
  const comMargem = custoTotal * (1 + cfg.margem_lucro_pct / 100);

  // Impostos e taxas de venda são cobrados sobre o preço final, por isso entram como divisor.
  const deducoes = Math.min(0.95, ((cfg.impostos_pct || 0) + (cfg.taxa_venda_pct || 0)) / 100);
  const precoFinal = Math.max(comMargem / (1 - deducoes), (cfg.preco_minimo || 0) * qtd);

  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    custo_material: r2(material * qtd),
    custo_energia: r2(energia * qtd),
    custo_maquina: r2(maquina * qtd),
    custo_mao_obra: r2(maoObra * qtd),
    custo_extra: r2(extra * qtd),
    custo_embalagem: r2(embalagem * qtd),
    custo_total: r2(custoTotal),
    valor_impostos_taxas: r2(precoFinal * deducoes),
    lucro: r2(precoFinal * (1 - deducoes) - custoTotal),
    preco_final: r2(precoFinal),
    preco_unitario: r2(precoFinal / qtd)
  };
}

if (typeof module !== 'undefined') module.exports = { calcularPreco, custoMaquinaHora, PADRAO };
