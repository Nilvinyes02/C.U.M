/* C.U.M. — Comportament de la terminal en JavaScript pur. */
(function () {
  'use strict';

  const config = window.CUM_CONFIG || {};
  const agent = String(config.agent || 'AGENTE [NOMBRE]');
  const expediente = String(config.expediente || 'OP-001');
  const idAgente = String(config.idAgente || 'CUM-001').trim().toUpperCase();
  const claveAcceso = String(config.claveAcceso || '4172');
  const storageKey = 'cum-acceso-autorizado-v1';
  function guardado() { try { return localStorage.getItem(storageKey) === idAgente; } catch (_) { return false; } }
  function guardarAcceso() { try { localStorage.setItem(storageKey, idAgente); } catch (_) { /* Mode local restringit: no persistirà. */ } }
  function borrarAcceso() { try { localStorage.removeItem(storageKey); } catch (_) { /* Sense dades persistides. */ } }
  let accesoVerificado = guardado();
  const fechaDesbloqueo = config.desbloqueo ? new Date(config.desbloqueo).getTime() : Infinity;
  const esFechaValida = Number.isFinite(fechaDesbloqueo);

  // Per provar el desbloqueig, obre index.html?demo=1 al navegador.
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';
  let demoDesbloqueado = false;
  let estadoPrevio = null;

  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => document.querySelectorAll(selector);

  $$('[data-agent]').forEach((item) => { item.textContent = agent; });
  $$('[data-agent-short]').forEach((item) => {
    item.textContent = agent.replace(/^AGENTE\s+/i, '');
  });
  $$('[data-expediente]').forEach((item) => { item.textContent = expediente; });

  function desbloqueada() {
    return demoDesbloqueado || (esFechaValida && Date.now() >= fechaDesbloqueo);
  }

  function actualizarPantalla() {
    const abierta = desbloqueada();
    const estado = abierta ? 'ready' : 'waiting';

    ['waiting', 'ready'].forEach((id) => { $(`#${id}`).hidden = id !== estado; });
    $('#status-panel').classList.toggle('status-panel--ready', abierta);
    $('.radar__label--bottom').textContent = abierta ? 'SIGNAL FOUND' : 'NO SIGNAL';

    if (demo) {
      $('#demo-controls').hidden = false;
      $('#demo-toggle').textContent = demoDesbloqueado ? 'TORNAR A BLOQUEJAR' : 'SIMULAR DESBLOQUEIG';
    }
    if (estado !== estadoPrevio) {
      $('#status-panel').classList.remove('status-transition');
      void $('#status-panel').offsetWidth;
      $('#status-panel').classList.add('status-transition');
      estadoPrevio = estado;
    }
  }

  function actualizarReloj() {
    $('#clock').textContent = new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
    });
    actualizarPantalla();
  }

  // La segona fase està separada en una pàgina pròpia.
  $('#show-report').addEventListener('click', () => {

    if (!desbloqueada()) return;

    window.location.href = demo

        ? 'informe.html?fase=1&demo=1'

        : 'informe.html?fase=1';

  });
  $('#demo-toggle').addEventListener('click', () => {
    demoDesbloqueado = !demoDesbloqueado;
    actualizarPantalla();
  });

  // Pantalla de credencials: forma part del joc, NO és autenticació de seguretat real.
  function mostrarAcceso() {
    $('#boot').hidden = true;
    $('#terminal').hidden = true;
    $('#access').hidden = false;
    $('#access').classList.add('animate-in');
    $('#agent-id').focus({ preventScroll: true });
  }

  function mostrarTerminal() {
    if (!terminado) {
      terminado = true;
      clearInterval(introInterval);
      clearTimeout(cierreTimeout);
    }
    $('#boot').hidden = true;
    $('#access').hidden = true;
    $('#terminal').hidden = false;
    $('#terminal').classList.add('animate-in');
    actualizarReloj();
  }

  function continuarDespresIntro() {
    if (terminado) return;
    terminado = true;
    clearInterval(introInterval);
    clearTimeout(cierreTimeout);
    $('#boot').hidden = true;
    if (accesoVerificado) mostrarTerminal();
    else mostrarAcceso();
  }

  $('#access-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const identificador = $('#agent-id').value.trim().replace(/\s+/g, '').toUpperCase();
    const clave = $('#access-pin').value.trim();
    if (identificador === idAgente && clave === claveAcceso) {
      accesoVerificado = true;
      guardarAcceso();
      $('#access-feedback').textContent = 'IDENTIDAD VERIFICADA. AUTORIZANDO ACCESO...';
      $('#access-feedback').className = 'access-feedback access-feedback--ok';
      $('.access-card__status').textContent = '● VALIDADA';
      $('#access-card').classList.add('verified');
      $('#access-submit').disabled = true;
      window.setTimeout(mostrarTerminal, 850);
      return;
    }
    $('#access-feedback').textContent = 'ACCESO DENEGADO. COMPRUEBE LAS CREDENCIALES.';
    $('#access-feedback').className = 'access-feedback access-feedback--error';
    $('#access-pin').value = '';
    $('#access-pin').focus();
  });

  $('#reveal-pin').addEventListener('click', () => {
    const visible = $('#access-pin').type === 'text';
    $('#access-pin').type = visible ? 'password' : 'text';
    $('#reveal-pin').textContent = visible ? 'MOSTRAR' : 'OCULTAR';
    $('#reveal-pin').setAttribute('aria-pressed', String(!visible));
    $('#reveal-pin').setAttribute('aria-label', visible ? 'Mostrar clave' : 'Ocultar clave');
  });

  $('#logout').addEventListener('click', () => {
    accesoVerificado = false;
    borrarAcceso();
    $('#access-submit').disabled = false;
    $('#access-card').classList.remove('verified');
    $('.access-card__status').textContent = '● EN ESPERA';
    $('#access-form').reset();
    $('#access-feedback').textContent = 'INTRODUZCA LAS CREDENCIALES PARA CONTINUAR.';
    $('#access-feedback').className = 'access-feedback';
    $('#access-pin').type = 'password';
    $('#reveal-pin').textContent = 'MOSTRAR';
    $('#reveal-pin').setAttribute('aria-pressed', 'false');
    $('#reveal-pin').setAttribute('aria-label', 'Mostrar clave');
    mostrarAcceso();
  });

  // Pantalla de càrrega. Els fitxers continuen sent 100% locals i estàtics.
  const lineas = [
    'ESTABLECIENDO CONEXIÓN CIFRADA...',
    'COMPROBANDO INTEGRIDAD DEL SISTEMA...',
    `PREPARANDO CONTROL DE ACCESO ${expediente}...`,
    'SINCRONIZANDO CON CENTRAL...',
    'TERMINAL DE IDENTIFICACIÓN DISPONIBLE.'
  ];
  let numero = 0;
  let terminado = false;
  let introInterval;
  let cierreTimeout;

  $('#skip-boot').addEventListener('click', continuarDespresIntro);
  introInterval = setInterval(() => {
    if (terminado) return;
    if (numero < lineas.length) {
      const entrada = document.createElement('div');
      entrada.className = 'boot-line';
      const prefijo = document.createElement('span');
      prefijo.textContent = `${String(numero + 1).padStart(2, '0')} /`;
      entrada.append(prefijo, document.createTextNode(` ${lineas[numero]}`));
      $('#boot-console').insertBefore(entrada, $('.console-cursor'));
      numero += 1;
      $('#boot-progress').style.width = `${(numero / lineas.length) * 100}%`;
    }
    if (numero === lineas.length) {
      clearInterval(introInterval);
      cierreTimeout = setTimeout(continuarDespresIntro, 680);
    }
  }, 430);

  actualizarReloj();
  setInterval(actualizarReloj, 1000);
})();
