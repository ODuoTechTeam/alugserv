/* =========================================================
   ALUGSERV / LANDING PAGE UNIDADE LOUVEIRA
   Catálogo com busca e filtros, links de WhatsApp e âncoras.
   ========================================================= */

// ===== CONFIGURAÇÃO DA UNIDADE =====
const UNIDADE = {
    nome: 'Louveira',
    whatsapp: '551999445111',          // (19) 9944-5111
    telefone: '(19) 9944-5111',
    endereco: 'R. Bento Martins Cruz, 58 – Vila Pasti, Louveira – SP'
};

const LOTE = 12; // equipamentos exibidos por vez

let filtroAtual = 'Todos';
let buscaAtual = '';
let exibidos = LOTE;

// ===== HELPERS =====
function linkWhatsApp(mensagem) {
    return 'https://wa.me/' + UNIDADE.whatsapp + '?text=' + encodeURIComponent(mensagem);
}

function escapeHtml(texto) {
    return String(texto)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// Remove acentos e caixa para a busca ("betoneira" acha "Betoneira", "furacao" acha "Furação").
function normalizar(texto) {
    return String(texto)
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');
}

document.addEventListener('DOMContentLoaded', () => {
    initLinksWhatsApp();
    initCatalogo();
    initBusca();
    initAtalhosCategoria();
});

// ===== LINKS DE WHATSAPP =====
// Todo elemento [data-wa] recebe o link da unidade com mensagem pré-preenchida.
function initLinksWhatsApp() {
    document.querySelectorAll('[data-wa]').forEach(el => {
        const msg = el.getAttribute('data-wa-msg') || 'Olá! Gostaria de um orçamento na unidade de ' + UNIDADE.nome + '.';
        el.setAttribute('href', linkWhatsApp(msg));
        el.setAttribute('target', '_blank');
        el.setAttribute('rel', 'noopener noreferrer');
    });
}

// ===== CATÁLOGO =====
function initCatalogo() {
    const filtros = document.getElementById('catalogFilters');
    const btnMais = document.getElementById('catalogMore');
    if (!filtros) return;

    const listaFiltros = ['Todos'].concat(CATEGORIAS);
    filtros.innerHTML = listaFiltros.map(cat =>
        `<button type="button" class="filter-btn${cat === 'Todos' ? ' active' : ''}" data-cat="${escapeHtml(cat)}">
            <span>${escapeHtml(cat)}</span><span class="count" data-count-for="${escapeHtml(cat)}"></span>
        </button>`
    ).join('');

    filtros.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', () => aplicarFiltro(btn.dataset.cat));
    });

    if (btnMais) {
        btnMais.addEventListener('click', () => {
            exibidos += LOTE;
            renderCatalogo();
        });
    }

    renderCatalogo();
}

// ===== BUSCA =====
function initBusca() {
    const input = document.getElementById('catalogSearch');
    const limpar = document.getElementById('catalogClear');
    if (!input) return;

    let debounce;
    input.addEventListener('input', () => {
        clearTimeout(debounce);
        debounce = setTimeout(() => {
            buscaAtual = input.value.trim();
            exibidos = LOTE;
            if (limpar) limpar.hidden = buscaAtual === '';
            renderCatalogo();
        }, 150);
    });

    // Enter não deve submeter nada nem recarregar a página
    input.addEventListener('keydown', e => {
        if (e.key === 'Enter') e.preventDefault();
        if (e.key === 'Escape') limparBusca();
    });

    if (limpar) limpar.addEventListener('click', limparBusca);
}

function limparBusca() {
    const input = document.getElementById('catalogSearch');
    const botao = document.getElementById('catalogClear');
    if (input) input.value = '';
    if (botao) botao.hidden = true;
    buscaAtual = '';
    exibidos = LOTE;
    renderCatalogo();
}

// ===== SELEÇÃO =====
// A busca vale sobre o catálogo inteiro; a categoria refina o resultado.
function porBusca(lista) {
    if (!buscaAtual) return lista;
    const termos = normalizar(buscaAtual).split(/\s+/).filter(Boolean);
    return lista.filter(eq => {
        const alvo = normalizar(eq.nome + ' ' + eq.cat + ' ' + eq.desc);
        return termos.every(t => alvo.indexOf(t) !== -1);
    });
}

function porCategoria(lista, categoria) {
    return categoria === 'Todos' ? lista : lista.filter(eq => eq.cat === categoria);
}

function equipamentosFiltrados() {
    return porCategoria(porBusca(EQUIPAMENTOS), filtroAtual);
}

// ===== RENDER =====
function renderCatalogo() {
    const grid = document.getElementById('equipmentGrid');
    if (!grid) return;

    const lista = equipamentosFiltrados();
    const visiveis = lista.slice(0, exibidos);

    grid.innerHTML = visiveis.length
        ? visiveis.map(cardEquipamento).join('')
        : estadoVazio();

    atualizarContadores();
    atualizarResumo(lista.length);
    atualizarBotaoMais(lista.length - visiveis.length);
}

// Cada filtro mostra quantos itens ele traria considerando a busca atual.
function atualizarContadores() {
    const base = porBusca(EQUIPAMENTOS);

    document.querySelectorAll('.filter-btn').forEach(btn => {
        const cat = btn.dataset.cat;
        const total = porCategoria(base, cat).length;
        const span = btn.querySelector('.count');
        if (span) span.textContent = total;
        btn.classList.toggle('is-empty', total === 0 && cat !== filtroAtual);
    });
}

function atualizarResumo(total) {
    const el = document.getElementById('catalogCount');
    if (!el) return;

    // Sem busca e sem filtro não há o que resumir: as contagens já aparecem
    // dentro de cada botão de categoria.
    if (!buscaAtual && filtroAtual === 'Todos') {
        el.innerHTML = '';
        return;
    }

    const contexto = [];
    if (buscaAtual) contexto.push(`"${escapeHtml(buscaAtual)}"`);
    if (filtroAtual !== 'Todos') contexto.push(escapeHtml(filtroAtual));

    el.innerHTML = total === 1
        ? `<strong>1</strong> equipamento encontrado para ${contexto.join(' em ')}`
        : `<strong>${total}</strong> equipamentos encontrados para ${contexto.join(' em ')}`;
}

function atualizarBotaoMais(restantes) {
    const btn = document.getElementById('catalogMore');
    if (!btn) return;

    const wrapper = btn.closest('.catalog-more') || btn;
    wrapper.style.display = restantes > 0 ? '' : 'none';
    btn.textContent = `Ver mais equipamentos (${restantes})`;
}

function estadoVazio() {
    const termo = buscaAtual || filtroAtual;
    const msg = `Olá! Procurei por "${termo}" no site da AlugServ Louveira e não encontrei. Vocês têm esse equipamento?`;
    return `
        <div class="catalog-empty">
            <p>Nenhum equipamento encontrado para <strong>${escapeHtml(termo)}</strong>.<br>
            Fale com a gente: temos itens que não estão listados aqui.</p>
            <a href="${linkWhatsApp(msg)}" class="btn btn-whatsapp btn-lg" target="_blank" rel="noopener noreferrer">Perguntar no WhatsApp</a>
        </div>
    `;
}

function cardEquipamento(eq) {
    const msg = `Olá! Gostaria de um orçamento para *${eq.nome}* na unidade da AlugServ em ${UNIDADE.nome}.`;
    return `
        <article class="equipment-item">
            <div class="equipment-thumb">
                <span class="equipment-tag">${escapeHtml(eq.cat)}</span>
                <img src="${escapeHtml(eq.img)}" alt="${escapeHtml(eq.nome)} para locação em ${UNIDADE.nome}" loading="lazy">
            </div>
            <div class="equipment-body">
                <h3>${escapeHtml(eq.nome)}</h3>
                <p>${escapeHtml(eq.desc)}</p>
                <a href="${linkWhatsApp(msg)}" class="btn btn-whatsapp" target="_blank" rel="noopener noreferrer">
                    <svg fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    Orçamento
                </a>
            </div>
        </article>
    `;
}

function aplicarFiltro(categoria) {
    filtroAtual = categoria;
    exibidos = LOTE;

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.cat === categoria);
    });

    renderCatalogo();
}

// ===== ATALHOS PARA O CATÁLOGO =====
// Cards de categoria e barra do topo levam ao catálogo já filtrado.
function initAtalhosCategoria() {
    document.querySelectorAll('[data-filtro]').forEach(el => {
        el.addEventListener('click', () => {
            const cat = el.getAttribute('data-filtro');
            if (CATEGORIAS.indexOf(cat) === -1) return;
            limparBusca();
            aplicarFiltro(cat);
        });
    });
}
