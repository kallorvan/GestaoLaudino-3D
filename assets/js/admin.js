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
    titulo: 'Produto',
    ordem: 'created_at',
    colunas: [['nome', 'Nome'], ['preco_venda', 'Preço', 'brl'], ['publicado', 'Publicado', 'bool']],
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
    titulo: 'Filamento',
    ordem: 'nome',
    colunas: [['nome', 'Nome'], ['cor', 'Cor'], ['preco_kg', 'R$/kg', 'brl'], ['estoque_g', 'Estoque (g)']],
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
    titulo: 'Cliente',
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
    titulo: 'Fornecedor',
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
    titulo: 'Orçamento',
    ordem: 'created_at',
    colunas: [['descricao', 'Peça'], ['cliente_nome', 'Cliente'], ['preco_final', 'Preço', 'brl'], ['status', 'Status']],
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
    titulo: 'Pedido',
    ordem: 'created_at',
    colunas: [['cliente_nome', 'Cliente'], ['valor', 'Valor', 'brl'], ['status', 'Status']],
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

let aba = 'produtos';
let linhas = [];

function mostrar(id) {
  ['login', 'semAcesso', 'painel'].forEach((s) => $(s).classList.toggle('oculto', s !== id));
}

function aviso(texto, erro = false) {
  $('msg').className = erro ? 'msg-erro' : 'msg-ok';
  $('msg').textContent = texto;
}

function slugify(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
    .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function celula(valor, tipo) {
  if (tipo === 'brl') return `<td class="num">${valor == null ? '' : fmt(valor)}</td>`;
  if (tipo === 'bool') return `<td>${valor ? 'Sim' : 'Não'}</td>`;
  return `<td>${esc(valor)}</td>`;
}

async function carregar() {
  $('lista').parentElement.classList.toggle('oculto', aba === 'parametros');
  $('parametros').classList.toggle('oculto', aba !== 'parametros');
  if (aba === 'parametros') return carregarParametros();

  const def = TABELAS[aba];
  const { data, error } = await sb.from(aba).select('*').order(def.ordem, { ascending: def.ordem === 'nome' });
  if (error) { aviso(error.message, true); return; }
  linhas = data;
  $('lista').innerHTML = linhas.length
    ? `<table><thead><tr>${def.colunas.map(([, r, t]) => `<th class="${t === 'brl' ? 'num' : ''}">${r}</th>`).join('')}<th></th></tr></thead>
       <tbody>${linhas.map((l) => `<tr>${def.colunas.map(([c, , t]) => celula(l[c], t)).join('')}
         <td><button class="secundario" data-editar="${l.id}">Editar</button></td></tr>`).join('')}</tbody></table>`
    : `<p class="vazio">Nenhum registro.</p>`;
  formulario(null);
}

function campoHtml([col, rot, tipo, opcoes], valor) {
  const v = valor ?? '';
  if (tipo === 'bool') {
    return `<label style="display:flex;gap:8px;align-items:center"><input type="checkbox" name="${col}" style="width:auto" ${valor ? 'checked' : ''}> ${rot}</label>`;
  }
  let input;
  if (tipo === 'textarea') input = `<textarea name="${col}" rows="3">${esc(v)}</textarea>`;
  else if (tipo === 'select') input = `<select name="${col}">${opcoes.map((o) => `<option ${o === v ? 'selected' : ''}>${o}</option>`).join('')}</select>`;
  else if (tipo === 'fk') {
    const { rotulo } = LOOKUPS[opcoes];
    input = `<select name="${col}"><option value="">Nenhum</option>${listas[opcoes].map((x) =>
      `<option value="${x.id}" ${x.id === valor ? 'selected' : ''}>${esc(rotulo(x))}</option>`).join('')}</select>`;
  } else input = `<input name="${col}" type="${tipo === 'number' ? 'number' : 'text'}" step="any" value="${esc(v)}">`;
  return `<label>${rot}</label>${input}`;
}

function formulario(linha) {
  const def = TABELAS[aba];
  if (!linha && def.somenteEdicao) {
    $('formItem').innerHTML = `<p class="aviso">Orçamentos são criados no <a href="precificador.html">precificador</a>. Clique em Editar para mudar o status.</p>`;
    return;
  }
  const extra = aba === 'orcamentos' && linha?.status === 'aprovado'
    ? `<button type="button" class="secundario" id="virarPedido" style="margin-left:8px">Gerar pedido</button>` : '';
  const padrao = (c) => (c[2] === 'bool' ? c[0] !== 'publicado' : null);
  $('formItem').innerHTML = `
    <h3 style="margin-top:0">${linha ? 'Editar' : 'Novo'} ${def.titulo.toLowerCase()}</h3>
    ${def.campos.map((c) => campoHtml(c, linha ? linha[c[0]] : padrao(c))).join('')}
    <div style="margin-top:14px">
      <button>${linha ? 'Salvar' : 'Criar'}</button>
      ${linha ? `<button type="button" class="secundario" id="cancelar" style="margin-left:8px">Cancelar</button>
                 <button type="button" class="secundario" id="excluir" style="margin-left:8px">Excluir</button>` : ''}
      ${extra}
    </div>`;
  $('formItem').dataset.id = linha?.id ?? '';
  if (linha) {
    $('cancelar').onclick = () => formulario(null);
    $('excluir').onclick = () => excluir(linha.id);
  }
  if (extra) $('virarPedido').onclick = () => gerarPedido(linha);
  if (aba === 'produtos') {
    const nome = $('formItem').elements.nome, slug = $('formItem').elements.slug;
    nome.addEventListener('input', () => { if (!linha) slug.value = slugify(nome.value); });
  }
  // Ao escolher um cliente cadastrado, preenche nome e contato para orçamentos e pedidos.
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
  const id = $('formItem').dataset.id;
  const dados = lerFormulario();
  const q = id ? sb.from(aba).update(dados).eq('id', id) : sb.from(aba).insert(dados);
  const { error } = await q;
  if (error) { aviso(error.message, true); return; }
  aviso(id ? 'Alterações salvas.' : 'Registro criado.');
  if (LOOKUPS[aba]) await carregarLista(aba);
  carregar();
}

async function excluir(id) {
  if (!confirm('Excluir este registro? Isso não pode ser desfeito.')) return;
  const { error } = await sb.from(aba).delete().eq('id', id);
  if (error) { aviso(error.message, true); return; }
  aviso('Registro excluído.');
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
  if (error) { aviso(error.message, true); return; }
  aviso('Pedido criado a partir do orçamento.');
}

async function carregarParametros() {
  const { data, error } = await sb.from('configuracoes').select('*').eq('id', 1).single();
  if (error) { aviso(error.message, true); return; }
  $('parametros').innerHTML = `
    <form id="formParametros" class="painel">
      <h3 style="margin-top:0">Parâmetros de custo</h3>
      <p class="aviso">Estes valores são a base do precificador para todas as peças.</p>
      <div class="grade" style="grid-template-columns:repeat(auto-fit,minmax(240px,1fr));margin-top:8px">
        ${PARAMETROS.map(([grupo, campos]) => `
          <fieldset style="border:1px solid var(--border);border-radius:8px;padding:4px 14px 14px">
            <legend style="color:var(--muted);padding:0 6px">${grupo}</legend>
            ${campos.map(([col, rot]) => `<label>${rot}</label><input name="${col}" type="number" step="any" min="0" value="${esc(data[col])}">`).join('')}
          </fieldset>`).join('')}
      </div>
      <p class="aviso" id="custoHora" style="margin-top:14px"></p>
      <button style="margin-top:8px">Salvar parâmetros</button>
    </form>`;
  const form = $('formParametros');
  const mostrarCustoHora = () => {
    const v = (n) => parseFloat(form.elements[n].value) || 0;
    const maq = v('valor_impressora') / Math.max(1, v('vida_util_horas')) + v('manutencao_hora');
    const ene = (v('potencia_impressora_w') / 1000) * v('tarifa_kwh');
    form.querySelector('#custoHora').textContent =
      `Cada hora de impressão custa ${fmt(maq)} de máquina e ${fmt(ene)} de energia, antes do filamento.`;
  };
  form.addEventListener('input', mostrarCustoHora);
  mostrarCustoHora();
  form.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dados = Object.fromEntries(PARAMETROS.flatMap(([, c]) => c)
      .map(([col]) => [col, parseFloat(form.elements[col].value) || 0]));
    const { error: e } = await sb.from('configuracoes').update(dados).eq('id', 1);
    aviso(e ? e.message : 'Parâmetros salvos.', !!e);
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
  document.querySelectorAll('#abas button').forEach((x) => x.classList.toggle('ativo', x === b));
  $('msg').textContent = '';
  carregar();
});

$('lista').addEventListener('click', (ev) => {
  const b = ev.target.closest('[data-editar]');
  if (b) formulario(linhas.find((l) => String(l.id) === b.dataset.editar));
});

$('formItem').addEventListener('submit', salvar);

iniciar();
