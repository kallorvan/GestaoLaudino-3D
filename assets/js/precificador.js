// Cálculo de preço de uma impressão 3D. Funções puras, sem dependência do DOM,
// para poderem ser testadas isoladamente.
const PADRAO = {
  tarifa_kwh: 0.95,
  potencia_impressora_w: 150,
  custo_maquina_hora: 1.5,
  custo_mao_obra_hora: 0,
  taxa_falha_pct: 10,
  margem_lucro_pct: 100
};

function calcularPreco(e, cfg = PADRAO) {
  const horas = e.tempo_min / 60;
  const qtd = Math.max(1, e.quantidade || 1);

  const material = (e.peso_g / 1000) * e.preco_kg;
  const energia = (cfg.potencia_impressora_w / 1000) * horas * cfg.tarifa_kwh;
  const maquina = horas * cfg.custo_maquina_hora;
  const maoObra = ((e.mao_obra_min || 0) / 60) * cfg.custo_mao_obra_hora;
  const extra = e.custo_extra || 0;

  const porPeca = (material + energia + maquina) * (1 + cfg.taxa_falha_pct / 100) + maoObra + extra;
  const custoTotal = porPeca * qtd;
  const precoFinal = custoTotal * (1 + cfg.margem_lucro_pct / 100);

  const r2 = (v) => Math.round(v * 100) / 100;
  return {
    custo_material: r2(material * qtd),
    custo_energia: r2(energia * qtd),
    custo_maquina: r2(maquina * qtd),
    custo_mao_obra: r2(maoObra * qtd),
    custo_extra: r2(extra * qtd),
    custo_total: r2(custoTotal),
    preco_final: r2(precoFinal),
    preco_unitario: r2(precoFinal / qtd)
  };
}

if (typeof module !== 'undefined') module.exports = { calcularPreco, PADRAO };
