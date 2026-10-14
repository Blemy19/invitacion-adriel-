/* Funcionalidades de la invitación: personalización, mapa, WhatsApp, copiar y confeti. */
(() => {
  'use strict';
  const defaults = {
    nombre: 'Adriel', edad: 3, dia: 18, mes: 'octubre', anio: 2026,
    hora: 'Por confirmar', lugar: 'Por confirmar', enlaceGoogleMaps: '',
    whatsappConfirmacion: '', mensaje: '¡Acompáñanos a celebrar una aventura llena de juegos y diversión!'
  };
  const cfg = { ...defaults, ...(window.INVITACION || {}) };
  const $ = id => document.getElementById(id);
  const set = (id, value) => { const el = $(id); if (el) el.textContent = String(value); };
  const caps = text => String(text).toLocaleUpperCase('es');
  const mesLabel = String(cfg.mes || defaults.mes).trim();

  document.title = `¡${cfg.nombre} cumple ${cfg.edad}! | Invitación`;
  set('nombre-hero', cfg.nombre);
  set('nombre-final', cfg.nombre);
  set('edad-hero', cfg.edad);
  set('edad-globo', cfg.edad);
  set('dia-hero', cfg.dia);
  set('dia-grande', cfg.dia);
  set('mes-hero', caps(mesLabel));
  set('mes-grande', caps(mesLabel) + ' ');
  // Anidamos el año de forma segura dentro del mes, cuyo contenido cambia.
  const year = document.createElement('span');
  year.id = 'anio-grande';
  year.textContent = String(cfg.anio);
  $('mes-grande').appendChild(year);
  set('hora-evento', cfg.hora || defaults.hora);
  set('lugar-evento', cfg.lugar || defaults.lugar);

  // Permite enlaces oficiales de Google Maps y direcciones https seguras.
  function urlSegura(value) {
    try {
      const u = new URL(String(value).trim());
      if (u.protocol !== 'https:') return '';
      const host = u.hostname.toLowerCase();
      if (host === 'maps.app.goo.gl' || host === 'goo.gl' || host === 'maps.google.com' ||
          host === 'www.google.com' || host === 'google.com' || host.endsWith('.google.com')) {
        return u.href;
      }
    } catch (_) { /* vacío o incorrecto */ }
    return '';
  }
  const mapsUrl = urlSegura(cfg.enlaceGoogleMaps);
  const mapa = $('boton-mapa');
  if (mapsUrl) {
    mapa.href = mapsUrl;
    mapa.target = '_blank';
    mapa.rel = 'noopener noreferrer';
    mapa.removeAttribute('data-pending');
    mapa.removeAttribute('aria-disabled');
    mapa.innerHTML = '🗺️ ABRIR EN GOOGLE MAPS <span aria-hidden="true">↗</span>';
    set('mapa-subtitulo', '¡Toca el botón para ver la ruta en Google Maps!');
  } else {
    mapa.addEventListener('click', (event) => {
      event.preventDefault();
      toast('📍 La ubicación se compartirá muy pronto.');
    });
  }

  const digits = String(cfg.whatsappConfirmacion || '').replace(/\D/g, '');
  if (digits.length >= 9 && digits.length <= 15) {
    const texto = `¡Hola! Quiero confirmar mi asistencia al cumpleaños de ${cfg.nombre} 🎉`;
    const whatsapp = $('boton-whatsapp');
    whatsapp.href = `https://wa.me/${digits}?text=${encodeURIComponent(texto)}`;
    whatsapp.classList.remove('hidden');
  }

  // La hora aún no está fijada: cuenta los días hasta las 00:00 de la fecha elegida.
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const monthNumber = meses.indexOf(mesLabel.toLocaleLowerCase('es'));
  function actualizarCuenta() {
    if (monthNumber === -1) return;
    const now = new Date();
    const hoy = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const fiesta = new Date(Number(cfg.anio), monthNumber, Number(cfg.dia));
    if (Number.isNaN(fiesta.getTime())) return;
    const dias = Math.round((fiesta.getTime() - hoy.getTime()) / 86400000);
    set('cuenta-regresiva', dias > 1 ? `¡Faltan ${dias} días para la fiesta!`
      : dias === 1 ? '¡Mañana es la gran fiesta!'
      : dias === 0 ? '¡HOY ES EL GRAN DÍA!'
      : '¡Gracias por celebrar con nosotros!');
  }
  actualizarCuenta();

  let toastTimeout;
  function toast(message) {
    const el = $('toast');
    el.textContent = message;
    el.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => el.classList.remove('visible'), 3600);
  }

  function textoInvitacion() {
    const partes = [
      `🎉 ¡${cfg.nombre} cumple ${cfg.edad} años! 🎉`,
      '',
      cfg.mensaje,
      `📅 ${cfg.dia} de ${mesLabel} de ${cfg.anio}`,
      `🕒 Hora: ${cfg.hora || 'Por confirmar'}`,
      `📍 Lugar: ${cfg.lugar || 'Por confirmar'}`
    ];
    if (mapsUrl) partes.push(`🗺️ Google Maps: ${mapsUrl}`);
    partes.push('', '¡Te esperamos! 🧡💙');
    return partes.join('\n');
  }
  $('boton-copiar').addEventListener('click', async () => {
    const texto = textoInvitacion();
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(texto);
      } else {
        const ta = document.createElement('textarea');
        ta.value = texto;
        ta.setAttribute('readonly', '');
        ta.style.cssText = 'position:fixed;left:-9999px;top:0;';
        document.body.appendChild(ta);
        ta.select();
        const copied = document.execCommand('copy');
        ta.remove();
        if (!copied) throw new Error('No se puede copiar');
      }
      toast('✅ ¡Invitación copiada! Lista para enviar.');
    } catch (_) {
      toast('No se pudo copiar automáticamente. Selecciona el texto para compartirlo.');
      window.prompt('Copia este texto:', texto);
    }
  });

  // Efecto confeti sin librerías ni red: funciona incluso sin internet.
  const canvas = $('confeti');
  const ctx = canvas.getContext('2d');
  let pieces = [], animation = 0;
  const colors = ['#ff7517', '#ffcf27', '#ffffff', '#0798ed', '#8ee3fa', '#fa3b69'];
  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(window.innerWidth * dpr);
    canvas.height = Math.floor(window.innerHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  function pintar() {
    ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);
    pieces = pieces.filter(p => p.life > 0 && p.y < window.innerHeight + 50);
    for (const p of pieces) {
      p.x += p.vx; p.y += p.vy; p.vy += .15; p.vx *= .997;
      p.angle += p.spin; p.life--;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
      ctx.fillStyle = p.color; ctx.globalAlpha = Math.min(1, p.life / 24);
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    if (pieces.length) animation = window.requestAnimationFrame(pintar);
    else animation = 0;
  }
  function lanzarConfeti() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      toast('🎉 ¡Feliz cumpleaños, Adriel!');
      return;
    }
    fit();
    const x = window.innerWidth / 2, y = Math.min(window.innerHeight * .5, 390);
    for (let i = 0; i < 170; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = 3 + Math.random() * 10;
      pieces.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 4,
        angle: Math.random() * 6.28, spin: (Math.random() - .5) * .22,
        life: 100 + Math.random() * 75, w: 6 + Math.random() * 7,
        h: 5 + Math.random() * 10, color: colors[i % colors.length] });
    }
    if (!animation) pintar();
  }
  $('boton-confeti').addEventListener('click', lanzarConfeti);
  window.addEventListener('resize', () => { if (pieces.length) fit(); }, { passive: true });
})();

window.__adrielScriptInitialized = true;


/* Música de bienvenida: prueba autoplay, con respaldo mediante un toque.
   Los navegadores pueden bloquear el sonido sin interacción previa. */
(() => {
  'use strict';
  if (window.__adrielMusicInitialized) return;
  window.__adrielMusicInitialized = true;
  const audio = document.getElementById('musica-adriel');
  const gate = document.getElementById('musica-bienvenida');
  const start = document.getElementById('musica-comenzar');
  const control = document.getElementById('musica-control');
  const label = document.getElementById('musica-control-text');
  if (!audio || !gate || !start || !control || !label) return;
  audio.volume = 0.65;

  function update() {
    const playing = !audio.paused;
    control.classList.toggle('is-playing', playing);
    control.setAttribute('aria-pressed', String(playing));
    control.setAttribute('aria-label', playing ? 'Pausar música' : 'Reproducir música');
    label.textContent = playing ? 'PAUSAR MÚSICA' : 'ACTIVAR MÚSICA';
    control.querySelector('.music-icon').textContent = playing ? '🔊' : '🎵';
  }
  function closeGate() {
    gate.hidden = true;
    document.body.style.overflow = '';
  }
  function showGate() {
    if (!audio.paused) return;
    gate.hidden = false;
    document.body.style.overflow = 'hidden';
    start.focus({preventScroll:true});
  }
  async function playFromTap() {
    closeGate();
    try {
      await audio.play();
      update();
    } catch (err) {
      closeGate();
      update();
      // Si el dispositivo o archivo falla, la invitación sigue accesible.
      console.warn('No se pudo iniciar la música:', err);
    }
  }
  start.addEventListener('click', playFromTap);
  control.addEventListener('click', async () => {
    if (!audio.paused) {
      audio.pause();
    } else {
      await playFromTap();
    }
    update();
  });
  audio.addEventListener('play', update);
  audio.addEventListener('pause', update);
  audio.addEventListener('error', () => {
    closeGate();
    update();
    label.textContent = 'MÚSICA NO DISPONIBLE';
    control.disabled = true;
  });

  update();
  const attempt = audio.play();
  if (attempt && typeof attempt.then === 'function') {
    attempt.then(() => {closeGate(); update();})
      .catch(() => showGate());
  } else {
    showGate();
  }
})();
