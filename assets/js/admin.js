// Área administrativa: CRUD simples das tabelas, guiado pela definição em TABELAS.
const $ = (id) => document.getElementById(id);

const STATUS_ORC = ['aberto', 'enviado', 'aprovado', 'recusado'];
const STATUS_PED = ['novo', 'imprimindo', 'pronto', 'entregue', 'cancelado'];

// Cada campo: [coluna, rótulo, tipo, opções]. Tipos: text, textarea, number, bool, select, filamento.
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
      ['filamento_id', 'Filamento', 'filamento'],
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
      ['preco_kg', 'Preço (R$/kg)', 'number'],
      ['estoque_g', 'Estoque (g)', 'number'],
      ['ativo', 'Ativo', 'bool']
    ]
  },
  orcamentos: {
    titulo: 'Orçamento',
    ordem: 'created_at',
    colunas: [['descricao', 'Peça'], ['cliente_nome', 'Cliente'], ['preco_final', 'Preço', 'brl'], ['status', 'Status']],
    campos: [
      ['descricao', 'Peça', 'text'],
      ['cliente_nome', 'Cliente', 'text'],
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
      ['cliente_nome', 'Cliente', 'text'],
      ['cliente_contato', 'Contato', 'text'],
      ['quantidade', 'Quantidade', 'number'],
      ['valor', 'Valor (R$)', 'number'],
      ['status', 'Status', 'select', STATUS_PED],
      ['observacoes', 'Observações', 'textarea']
    ]
  }
};

let aba = 'produtos';
let linhas = [];
let filamentos = [];

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
  else if (tipo === 'filamento') input = `<select name="${col}"><option value="">Nenhum</option>${filamentos.map((f) =>
      `<option value="${f.id}" ${f.id === valor ? 'selected' : ''}>${esc(f.nome)} ${esc(f.cor || '')}</option>`).join('')}</select>`;
  else input = `<input name="${col}" type="${tipo === 'number' ? 'number' : 'text'}" step="any" value="${esc(v)}">`;
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
  $('formItem').innerHTML = `
    <h3 style="margin-top:0">${linha ? 'Editar' : 'Novo'} ${def.titulo.toLowerCase()}</h3>
    ${def.campos.map((c) => campoHtml(c, linha ? linha[c[0]] : (c[2] === 'bool' ? c[0] !== 'publicado' : null))).join('')}
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
}

function lerFormulario() {
  const f = $('formItem').elements;
  const dados = {};
  for (const [col, , tipo] of TABELAS[aba].campos) {
    const el = f[col];
    if (tipo === 'bool') dados[col] = el.checked;
    else if (tipo === 'number' || tipo === 'filamento') dados[col] = el.value === '' ? null : Number(el.value);
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
  if (aba === 'filamentos') await carregarFilamentos();
  carregar();
}

async function excluir(id) {
  if (!confirm('Excluir este registro? Isso não pode ser desfeito.')) return;
  const { error } = await sb.from(aba).delete().eq('id', id);
  if (error) { aviso(error.message, true); return; }
  aviso('Registro excluído.');
  carregar();
}

async function gerarPedido(orc) {
  const { error } = await sb.from('pedidos').insert({
    orcamento_id: orc.id,
    cliente_nome: orc.cliente_nome || 'Sem nome',
    cliente_contato: orc.cliente_contato,
    quantidade: orc.quantidade,
    valor: orc.preco_final,
    observacoes: orc.descricao
  });
  if (error) { aviso(error.message, true); return; }
  aviso('Pedido criado a partir do orçamento.');
}

async function carregarFilamentos() {
  const { data } = await sb.from('filamentos').select('id, nome, cor').order('nome');
  filamentos = data || [];
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
  await carregarFilamentos();
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
