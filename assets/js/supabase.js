// Cliente Supabase compartilhado e utilitários usados em todas as páginas.
const sb = window.supabase.createClient(APP_CONFIG.supabaseUrl, APP_CONFIG.supabaseKey);

const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const fmt = (v) => brl.format(Number(v) || 0);

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[c]);
}

async function isAdmin() {
  const { data: { session } } = await sb.auth.getSession();
  if (!session) return false;
  const { data, error } = await sb.rpc('is_admin');
  return !error && data === true;
}
