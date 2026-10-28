(function () {
  'use strict';

  document.documentElement.classList.add('js');
  var reduz = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── Ano no rodapé ───────────────────────────────── */
  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();

  /* ── Header ao rolar ─────────────────────────────── */
  var header = document.querySelector('.header');
  function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 10); }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── Menu mobile ─────────────────────────────────── */
  var burger = document.getElementById('burger');
  var nav = document.getElementById('nav');
  function setMenu(aberto) {
    nav.classList.toggle('is-open', aberto);
    burger.setAttribute('aria-expanded', aberto);
    burger.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    document.body.classList.toggle('menu-open', aberto);
  }
  burger.addEventListener('click', function () { setMenu(!nav.classList.contains('is-open')); });
  nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ── 16 · Revelar palavra por palavra ────────────── */
  function revelarPalavras(el) {
    if (!el.dataset.pronto) {
      el.innerHTML = el.textContent.trim().split(/\s+/)
        .map(function (p) { return '<span class="palavra">' + p + '</span>'; }).join(' ');
      el.dataset.pronto = '1';
    }
    var palavras = el.querySelectorAll('.palavra');
    palavras.forEach(function (p, i) {
      setTimeout(function () { p.classList.add('dentro'); }, reduz ? 0 : 400 + i * 55);
    });
  }
  document.querySelectorAll('.js-split').forEach(revelarPalavras);

  /* ── 17 · Palavras que se alternam ───────────────── */
  function alternarPalavras(janela) {
    var fita = janela.querySelector('.fita');
    var palavras = fita.children;
    var itens = palavras.length;
    var i = 0;
    /* a faixa amarela acompanha a largura da palavra atual */
    function largura(n) { janela.style.width = palavras[n].offsetWidth + 'px'; }
    largura(0);
    if (document.fonts) document.fonts.ready.then(function () { largura(i); });
    window.addEventListener('resize', function () { largura(i); });
    setInterval(function () {
      i++;
      largura(i);
      fita.style.transition = 'transform .6s cubic-bezier(.16,1,.3,1)';
      fita.style.transform = 'translateY(' + (-i * 100 / itens) + '%)';
      if (i === itens - 1) {           /* volta invisível ao início */
        setTimeout(function () {
          fita.style.transition = 'none';
          fita.style.transform = 'translateY(0)';
          i = 0;
        }, 620);
      }
    }, 2000);
  }
  if (!reduz) document.querySelectorAll('.troca .janela').forEach(alternarPalavras);

  /* ── Avaliações deslizando ───────────────────────── */
  document.querySelectorAll('.reviews-marquee .reviews').forEach(function (faixa) {
    var originais = Array.prototype.slice.call(faixa.children);
    /* repete os cards até a metade da faixa cobrir a tela, depois duplica tudo */
    while (faixa.scrollWidth < window.innerWidth * 1.2 && originais.length) {
      originais.forEach(function (c) { faixa.appendChild(c.cloneNode(true)); });
    }
    Array.prototype.slice.call(faixa.children).forEach(function (c) {
      var copia = c.cloneNode(true);
      copia.setAttribute('aria-hidden', 'true');
      faixa.appendChild(copia);
    });
    faixa.style.setProperty('--marquee-dur', Math.round(faixa.scrollWidth / 2 / 45) + 's');
  });

  /* ── Contadores ──────────────────────────────────── */
  function contar(el) {
    var alvo = parseFloat(el.dataset.count);
    var casas = parseInt(el.dataset.decimals || '0', 10);
    var fmt = function (n) { return n.toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas }); };
    if (reduz) { el.textContent = fmt(alvo); return; }
    var inicio = null, dur = 1600;
    function passo(t) {
      if (!inicio) inicio = t;
      var p = Math.min((t - inicio) / dur, 1);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(alvo * e);
      if (p < 1) requestAnimationFrame(passo);
    }
    requestAnimationFrame(passo);
  }

  /* ── Reveal ao rolar ─────────────────────────────── */
  var revelar = document.querySelectorAll('.reveal');
  var contadores = document.querySelectorAll('[data-count]');
  if (!('IntersectionObserver' in window)) {
    revelar.forEach(function (el) { el.classList.add('is-in'); });
    return;
  }
  var io = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (en) {
      if (!en.isIntersecting) return;
      var el = en.target;
      if (el.classList.contains('reveal')) {
        /* pequeno atraso em cascata entre irmãos */
        var irmaos = Array.prototype.filter.call(el.parentNode.children, function (c) { return c.classList.contains('reveal'); });
        el.style.transitionDelay = (Math.max(irmaos.indexOf(el), 0) * 80) + 'ms';
        el.classList.add('is-in');
      }
      if (el.dataset.count) contar(el);
      io.unobserve(el);
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  revelar.forEach(function (el) { io.observe(el); });
  contadores.forEach(function (el) { io.observe(el); });
})();
