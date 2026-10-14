// Área administrativa: CRUD simples das tabelas, guiado pela definição em TABELAS.
const $ = (id) => document.getElementById(id);

const STATUS_ORC = ['aberto', 'enviado', 'aprovado', 'recusado'];
const STATUS_PED = ['novo', 'imprimindo', 'pronto', 'entregue', 'cancelado'];
const CATEGORIAS_FORN = ['filamento', 'pecas', 'embalagem', 'servico', 'outros'];
const UFS = ['', 'AC', 'AL', 'AM', 'AP', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MG', 'MS', 'MT', 'PA', 'PB', 'PE',
  'PI', 'PR', 'RJ', 'RN', 'RO', 'RR', 'RS', 'SC', 'SE', 'SP', 'TO'];

// Listas usadas nos campos de relacionamento (tipo 'fk'), recarregadas quando a tabela muda.
const LOOKUPS = {
  filamentos: { colunas: 'id, nome, cor', rotulo: (f) => `${f.nome} ${f.cor || ''}` },
  clientes: { colunas: 'id, nome', rotulo: (c) => c.nome },
  fornecedores: { colunas: 'id, nome', rotulo: (f) => f.nome }
};
const listas = { filamentos: [], clientes: [], fornecedores: [] };

// Cada campo: [coluna, rótulo, tipo, opções]. Tipos: text, textarea, number, bool, select, fk (opções = tabela).
const CAMPOS_CONTATO = [
  ['documento', 'CPF / CNPJ', 'text'],
  ['email', 'E-mail', 'text'],
  ['telefone', 'Telefone / WhatsApp', 'text']
];

const TABELAS = {
  produtos: {
    titulo: 'Produto', plural: 'Produtos',
    ordem: 'created_at',
    colunas: [['nome', 'Nome'], ['preco_venda', 'Preço', 'brl'], ['publicado', 'Na vitrine', 'bool']],
    campos: [
      ['nome', 'Nome', 'text'],
      ['slug', 'Slug (endereço)', 'text'],
      ['descricao', 'Descrição', 'textarea'],
      ['imagem_url', 'URL da imagem', 'text'],
      ['stl_url', 'URL do STL', 'text'],
      ['filamento_id', 'Filamento', 'fk', 'filamentos'],
      ['peso_g', 'Peso (g)', 'number'],
      ['tempo_impressao_min', 'Tempo de impressão (min)', 'number'],
      ['preco_venda', 'Preço de venda (R$)', 'number'],
      ['publicado', 'Publicado na vitrine', 'bool']
    ]
  },
  filamentos: {
    titulo: 'Filamento', plural: 'Filamentos',
    ordem: 'nome',
    colunas: [['nome', 'Nome'], ['cor', 'Cor'], ['preco_kg', 'R$/kg', 'brl'], ['estoque_g', 'Estoque (g)', 'num'], ['ativo', 'Ativo', 'bool']],
    campos: [
      ['nome', 'Nome', 'text'],
      ['material', 'Material', 'text'],
      ['cor', 'Cor', 'text'],
      ['marca', 'Marca', 'text'],
      ['fornecedor_id', 'Fornecedor', 'fk', 'fornecedores'],
      ['preco_kg', 'Preço (R$/kg)', 'number'],
      ['estoque_g', 'Estoque (g)', 'number'],
      ['ativo', 'Ativo', 'bool']
    ]
  },
  clientes: {
    titulo: 'Cliente', plural: 'Clientes',
    ordem: 'nome',
    colunas: [['nome', 'Nome'], ['telefone', 'Telefone'], ['cidade', 'Cidade']],
    campos: [
      ['nome', 'Nome / Razão social', 'text'],
      ['tipo', 'Tipo', 'select', ['PF', 'PJ']],
      ...CAMPOS_CONTATO,
      ['cep', 'CEP', 'text'],
      ['endereco', 'Endereço', 'text'],
      ['numero', 'Número', 'text'],
      ['complemento', 'Complemento', 'text'],
      ['bairro', 'Bairro', 'text'],
      ['cidade', 'Cidade', 'text'],
      ['uf', 'UF', 'select', UFS],
      ['observacoes', 'Observações', 'textarea'],
      ['ativo', 'Ativo', 'bool']
    ]
  },
  fornecedores: {
    titulo: 'Fornecedor', plural: 'Fornecedores',
    ordem: 'nome',
    colunas: [['nome', 'Nome'], ['categoria', 'Categoria'], ['telefone', 'Telefone']],
    campos: [
      ['nome', 'Nome / Razão social', 'text'],
      ['tipo', 'Tipo', 'select', ['PJ', 'PF']],
      ['categoria', 'Categoria', 'select', CATEGORIAS_FORN],
      ...CAMPOS_CONTATO,
      ['contato', 'Pessoa de contato', 'text'],
      ['site', 'Site / loja', 'text'],
      ['cidade', 'Cidade', 'text'],
      ['uf', 'UF', 'select', UFS],
      ['observacoes', 'Observações', 'textarea'],
      ['ativo', 'Ativo', 'bool']
    ]
  },
  orcamentos: {
    titulo: 'Orçamento', plural: 'Orçamentos',
    ordem: 'created_at',
    colunas: [['descricao', 'Peça'], ['cliente_nome', 'Cliente'], ['preco_final', 'Preço', 'brl'], ['status', 'Status', 'status']],
    campos: [
      ['descricao', 'Peça', 'text'],
      ['cliente_id', 'Cliente cadastrado', 'fk', 'clientes'],
      ['cliente_nome', 'Nome do cliente', 'text'],
      ['cliente_contato', 'Contato', 'text'],
      ['quantidade', 'Quantidade', 'number'],
      ['preco_final', 'Preço final (R$)', 'number'],
      ['status', 'Status', 'select', STATUS_ORC]
    ],
    somenteEdicao: true // orçamentos nascem no precificador
  },
  pedidos: {
    titulo: 'Pedido', plural: 'Pedidos',
    ordem: 'created_at',
    colunas: [['cliente_nome', 'Cliente'], ['valor', 'Valor', 'brl'], ['status', 'Status', 'status']],
    campos: [
      ['cliente_id', 'Cliente cadastrado', 'fk', 'clientes'],
      ['cliente_nome', 'Nome do cliente', 'text'],
      ['cliente_contato', 'Contato', 'text'],
      ['quantidade', 'Quantidade', 'number'],
      ['valor', 'Valor (R$)', 'number'],
      ['status', 'Status', 'select', STATUS_PED],
      ['observacoes', 'Observações', 'textarea']
    ]
  }
};

// Parâmetros de custo: uma linha só (id = 1), editada direto, sem lista.
const PARAMETROS = [
  ['Energia', [
    ['tarifa_kwh', 'Tarifa de energia (R$/kWh)'],
    ['potencia_impressora_w', 'Potência média da impressora (W)']
  ]],
  ['Máquina', [
    ['valor_impressora', 'Valor pago na impressora (R$)'],
    ['vida_util_horas', 'Vida útil estimada (horas de impressão)'],
    ['manutencao_hora', 'Manutenção e peças de reposição (R$/h)']
  ]],
  ['Produção', [
    ['custo_mao_obra_hora', 'Mão de obra de acabamento (R$/h)'],
    ['custo_embalagem', 'Embalagem por peça (R$)'],
    ['taxa_falha_pct', 'Taxa de falha de impressão (%)']
  ]],
  ['Venda', [
    ['margem_lucro_pct', 'Margem de lucro (%)'],
    ['impostos_pct', 'Impostos sobre a venda (%)'],
    ['taxa_venda_pct', 'Taxa de cartão / marketplace (%)'],
    ['preco_minimo', 'Preço mínimo por peça (R$)']
  ]]
];


// Cor do selo para cada status.
const COR_STATUS = {
  aberto: 'amarelo', enviado: 'azul', aprovado: 'verde', recusado: 'vermelho',
  novo: 'amarelo', imprimindo: 'laranja', pronto: 'azul', entregue: 'verde', cancelado: 'vermelho'
};
const CAMPOS_LARGOS = new Set(['textarea']);
const COLS_LARGAS = new Set(['nome', 'descricao', 'endereco', 'imagem_url', 'stl_url', 'site', 'cliente_id', 'cliente_nome']);

let aba = 'inicio';
let linhas = [];
let editando = null;

function mostrar(id) {
  ['login', 'semAcesso', 'painel'].forEach((s) => $(s).classList.toggle('oculto', s !== id));
}

function slugify(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function celula(valor, tipo) {
  if (tipo === 'brl') return `<td class="num">${valor == null ? '—' : fmt(valor)}</td>`;
  if (tipo === 'num') return `<td class="num">${valor ?? '—'}</td>`;
  if (tipo === 'bool') return `<td><span class="status ${valor ? 'verde' : ''}">${valor ? 'Sim' : 'Não'}</span></td>`;
  if (tipo === 'status') return `<td><span class="status ${COR_STATUS[valor] || ''}">${esc(valor)}</span></td>`;
  return `<td>${valor ? esc(valor) : '<span style="color:var(--muted)">—</span>'}</td>`;
}

// ---------- Navegação ----------
async function carregar() {
  const def = TABELAS[aba];
  $('tituloAba').textContent = def ? def.plural : (aba === 'inicio' ? 'Início' : 'Parâmetros de custo');
  $('busca').classList.toggle('oculto', !def);
  $('novo').classList.toggle('oculto', !def);
  $('novo').textContent = def ? (def.somenteEdicao ? 'Novo no precificador' : `Novo ${def.titulo.toLowerCase()}`) : '';
  $('conteudo').innerHTML = '<p class="vazio">Carregando…</p>';
  if (aba === 'inicio') return carregarInicio();
  if (aba === 'parametros') return carregarParametros();

  const { data, error } = await sb.from(aba).select('*').order(def.ordem, { ascending: def.ordem === 'nome' });
  if (error) { toast(error.message, true); return; }
  linhas = data;
  desenharLista();
}

function desenharLista() {
  const def = TABELAS[aba];
  const termo = $('busca').value.trim().toLowerCase();
  const visiveis = termo
    ? linhas.filter((l) => def.colunas.some(([c]) => String(l[c] ?? '').toLowerCase().includes(termo)))
    : linhas;
  if (!visiveis.length) {
    $('conteudo').innerHTML = `<div class="painel vazio">${ICONES.caixa}${termo ? 'Nada encontrado para essa busca.'
      : (def.somenteEdicao ? 'Nenhum orçamento ainda. Crie o primeiro no precificador.' : `Nenhum ${def.titulo.toLowerCase()} cadastrado ainda.`)}</div>`;
    return;
  }
  $('conteudo').innerHTML = `<div class="painel tabela-rolagem" style="padding:8px 14px">
    <table><thead><tr>${def.colunas.map(([, r, t]) => `<th class="${t === 'brl' || t === 'num' ? 'num' : ''}">${r}</th>`).join('')}<th></th></tr></thead>
    <tbody>${visiveis.map((l) => `<tr>${def.colunas.map(([c, , t]) => celula(l[c], t)).join('')}
      <td class="acao"><button class="secundario pequeno" data-editar="${l.id}">Editar</button></td></tr>`).join('')}</tbody></table></div>`;
}

// ---------- Início ----------
async function carregarInicio() {
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const [orc, ped, cli] = await Promise.all([
    sb.from('orcamentos').select('id, descricao, cliente_nome, preco_final, status, created_at').order('created_at', { ascending: false }),
    sb.from('pedidos').select('valor, status, created_at'),
    sb.from('clientes').select('id', { count: 'exact', head: true })
  ]);
  const orcs = orc.data || [], peds = ped.data || [];
  const abertos = orcs.filter((o) => o.status === 'aberto' || o.status === 'enviado');
  const producao = peds.filter((p) => p.status === 'novo' || p.status === 'imprimindo');
  const mes = peds.filter((p) => p.status !== 'cancelado' && new Date(p.created_at) >= inicioMes);
  const soma = (xs, k) => xs.reduce((t, x) => t + Number(x[k] || 0), 0);
  $('conteudo').innerHTML = `
    <div class="metricas">
      <div class="metrica"><small>Orçamentos em aberto</small><strong>${abertos.length}</strong><small>${fmt(soma(abertos, 'preco_final'))} em negociação</small></div>
      <div class="metrica"><small>Pedidos em produção</small><strong>${producao.length}</strong><small>novos ou imprimindo</small></div>
      <div class="metrica"><small>Vendas do mês</small><strong>${fmt(soma(mes, 'valor'))}</strong><small>${mes.length} pedido(s)</small></div>
      <div class="metrica"><small>Clientes cadastrados</small><strong>${cli.count ?? 0}</strong><small>&nbsp;</small></div>
    </div>
    <div class="painel tabela-rolagem" style="padding:8px 14px">
      <h2 style="font-size:1.1rem;margin:10px 0 4px">Últimos orçamentos</h2>
      ${orcs.length ? `<table><thead><tr><th>Peça</th><th>Cliente</th><th class="num">Preço</th><th>Status</th></tr></thead><tbody>
        ${orcs.slice(0, 6).map((o) => `<tr>${celula(o.descricao)}${celula(o.cliente_nome)}${celula(o.preco_final, 'brl')}${celula(o.status, 'status')}</tr>`).join('')}
      </tbody></table>` : `<p class="vazio">Nenhum orçamento ainda. <a href="precificador.html">Abrir o precificador</a></p>`}
    </div>`;
}

// ---------- Formulário (gaveta lateral) ----------
function campoHtml([col, rot, tipo, opcoes], valor) {
  const v = valor ?? '';
  const largo = CAMPOS_LARGOS.has(tipo) || COLS_LARGAS.has(col) ? ' largo' : '';
  if (tipo === 'bool') {
    return `<label class="largo" style="display:flex;gap:10px;align-items:center;margin-top:16px;color:var(--text)">
      <input type="checkbox" name="${col}" ${valor ? 'checked' : ''}> ${rot}</label>`;
  }
  let input;
  if (tipo === 'textarea') input = `<textarea name="${col}" id="f_${col}" rows="3">${esc(v)}</textarea>`;
  else if (tipo === 'select') input = `<select name="${col}" id="f_${col}">${opcoes.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  else if (tipo === 'fk') {
    const { rotulo } = LOOKUPS[opcoes];
    input = `<select name="${col}" id="f_${col}"><option value="">Nenhum</option>${listas[opcoes].map((x) =>
      `<option value="${x.id}" ${x.id === valor ? 'selected' : ''}>${esc(rotulo(x))}</option>`).join('')}</select>`;
  } else input = `<input name="${col}" id="f_${col}" type="${tipo === 'number' ? 'number' : 'text'}" step="any" value="${esc(v)}">`;
  return `<div class="${largo.trim()}"><label for="f_${col}">${rot}</label>${input}</div>`;
}

function abrirGaveta(abrir) {
  $('formItem').classList.toggle('oculto', !abrir);
  $('gavetaFundo').classList.toggle('oculto', !abrir);
  if (abrir) setTimeout(() => $('formItem').querySelector('input:not([type=checkbox]),select,textarea')?.focus(), 30);
}

function formulario(linha) {
  const def = TABELAS[aba];
  editando = linha;
  const extra = aba === 'orcamentos' && linha?.status === 'aprovado'
    ? `<button type="button" class="secundario" id="virarPedido">Gerar pedido</button>` : '';
  const padrao = (c) => (c[2] === 'bool' ? c[0] !== 'publicado' : null);
  $('formItem').innerHTML = `
    <header>
      <h2 id="tituloGaveta">${linha ? 'Editar' : 'Novo'} ${def.titulo.toLowerCase()}</h2>
      <button type="button" class="secundario pequeno" data-fechar aria-label="Fechar">Fechar</button>
    </header>
    <div class="corpo-gaveta"><div class="form-grade">
      ${def.campos.map((c) => campoHtml(c, linha ? linha[c[0]] : padrao(c))).join('')}
    </div></div>
    <footer>
      <button>${linha ? 'Salvar alterações' : 'Criar'}</button>
      ${extra}
      ${linha ? `<button type="button" class="perigo direita" id="excluir">Excluir</button>` : ''}
    </footer>`;
  if (linha) $('excluir').onclick = () => excluir(linha.id);
  if (extra) $('virarPedido').onclick = () => gerarPedido(linha);
  if (aba === 'produtos') {
    const nome = $('formItem').elements.nome, slug = $('formItem').elements.slug;
    nome.addEventListener('input', () => { if (!linha) slug.value = slugify(nome.value); });
  }
  // Ao escolher um cliente cadastrado, preenche nome e contato de orçamentos e pedidos.
  const cliSel = $('formItem').elements.cliente_id;
  if (cliSel) {
    cliSel.addEventListener('change', async () => {
      if (!cliSel.value) return;
      const { data } = await sb.from('clientes').select('nome, telefone, email').eq('id', cliSel.value).single();
      if (!data) return;
      $('formItem').elements.cliente_nome.value = data.nome;
      $('formItem').elements.cliente_contato.value = data.telefone || data.email || '';
    });
  }
  abrirGaveta(true);
}

function lerFormulario() {
  const f = $('formItem').elements;
  const dados = {};
  for (const [col, , tipo] of TABELAS[aba].campos) {
    const el = f[col];
    if (tipo === 'bool') dados[col] = el.checked;
    else if (tipo === 'number' || tipo === 'fk') dados[col] = el.value === '' ? null : Number(el.value);
    else dados[col] = el.value.trim() || null;
  }
  return dados;
}

async function salvar(ev) {
  ev.preventDefault();
  const dados = lerFormulario();
  const q = editando ? sb.from(aba).update(dados).eq('id', editando.id) : sb.from(aba).insert(dados);
  const { error } = await q;
  if (error) { toast(error.message, true); return; }
  toast(editando ? 'Alterações salvas.' : `${TABELAS[aba].titulo} criado.`);
  abrirGaveta(false);
  if (LOOKUPS[aba]) await carregarLista(aba);
  carregar();
}

async function excluir(id) {
  if (!confirm('Excluir este registro? Isso não pode ser desfeito.')) return;
  const { error } = await sb.from(aba).delete().eq('id', id);
  if (error) { toast(error.message, true); return; }
  toast('Registro excluído.');
  abrirGaveta(false);
  if (LOOKUPS[aba]) await carregarLista(aba);
  carregar();
}

async function gerarPedido(orc) {
  const { error } = await sb.from('pedidos').insert({
    orcamento_id: orc.id,
    cliente_id: orc.cliente_id,
    cliente_nome: orc.cliente_nome || 'Sem nome',
    cliente_contato: orc.cliente_contato,
    quantidade: orc.quantidade,
    valor: orc.preco_final,
    observacoes: orc.descricao
  });
  toast(error ? error.message : 'Pedido criado a partir do orçamento.', !!error);
  if (!error) abrirGaveta(false);
}

// ---------- Parâmetros de custo ----------
async function carregarParametros() {
  const { data, error } = await sb.from('configuracoes').select('*').eq('id', 1).single();
  if (error) { toast(error.message, true); return; }
  $('conteudo').innerHTML = `
    <form id="formParametros">
      <p class="aviso" style="margin-top:0">Estes valores são a base do precificador para todas as peças.</p>
      <div class="grade" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr))">
        ${PARAMETROS.map(([grupo, campos]) => `
          <fieldset class="painel" style="margin:0;padding:6px 18px 18px">
            <legend class="titulo-grupo" style="padding:0 6px;margin:0">${grupo}</legend>
            ${campos.map(([col, rot]) => `<label for="p_${col}">${rot}</label><input id="p_${col}" name="${col}" type="number" step="any" min="0" value="${esc(data[col])}">`).join('')}
          </fieldset>`).join('')}
      </div>
      <div class="painel" style="margin-top:16px;display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <span id="custoHora" style="color:var(--muted)"></span>
        <button>Salvar parâmetros</button>
      </div>
    </form>`;
  const form = $('formParametros');
  const mostrarCustoHora = () => {
    const v = (n) => parseFloat(form.elements[n].value) || 0;
    const maq = v('valor_impressora') / Math.max(1, v('vida_util_horas')) + v('manutencao_hora');
    const ene = (v('potencia_impressora_w') / 1000) * v('tarifa_kwh');
    form.querySelector('#custoHora').innerHTML =
      `Cada hora de impressão custa <strong style="color:var(--text)">${fmt(maq)}</strong> de máquina e <strong style="color:var(--text)">${fmt(ene)}</strong> de energia, antes do filamento.`;
  };
  form.addEventListener('input', mostrarCustoHora);
  mostrarCustoHora();
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = Object.fromEntries(PARAMETROS.flatMap(([, c]) => c)
      .map(([col]) => [col, parseFloat(form.elements[col].value) || 0]));
    const { error: e } = await sb.from('configuracoes').update(dados).eq('id', 1);
    toast(e ? e.message : 'Parâmetros salvos.', !!e);
  });
}

async function carregarLista(tabela) {
  const { data } = await sb.from(tabela).select(LOOKUPS[tabela].colunas).order('nome');
  listas[tabela] = data || [];
}

async function iniciar() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) { mostrar('login'); return; }
  if (!(await isAdmin())) {
    $('sqlAdmin').textContent = `insert into public.admins (user_id) values ('${session.user.id}');`;
    mostrar('semAcesso');
    return;
  }
  mostrar('painel');
  await Promise.all(Object.keys(LOOKUPS).map(carregarLista));
  carregar();
}

// ---------- Eventos ----------
$('formLogin').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  $('msgLogin').textContent = '';
  const { error } = await sb.auth.signInWithPassword({ email: $('email').value, password: $('senha').value });
  if (error) {
    $('msgLogin').textContent = error.message === 'Invalid login credentials'
      ? 'E-mail ou senha incorretos.'
      : `Não foi possível entrar: ${error.message}`;
    return;
  }
  iniciar();
});

document.querySelectorAll('[data-sair]').forEach((b) => b.addEventListener('click', async () => {
  await sb.auth.signOut();
  mostrar('login');
}));

$('abas').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-aba]');
  if (!b) return;
  aba = b.dataset.aba;
  document.querySelectorAll('#abas [data-aba]').forEach((x) => x.classList.toggle('ativo', x === b));
  $('busca').value = '';
  carregar();
});

$('conteudo').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-editar]');
  if (b) formulario(linhas.find((l) => String(l.id) === b.dataset.editar));
});

$('novo').addEventListener('click', () => {
  if (TABELAS[aba].somenteEdicao) { location.href = 'precificador.html'; return; }
  formulario(null);
});
$('busca').addEventListener('input', desenharLista);
$('formItem').addEventListener('submit', salvar);
$('formItem').addEventListener('click', (ev) => { if (ev.target.closest('[data-fechar]')) abrirGaveta(false); });
$('gavetaFundo').addEventListener('click', () => abrirGaveta(false));
document.addEventListener('keydown', (ev) => { if (ev.key === 'Escape') abrirGaveta(false); });

iniciar();
