
/* C.U.M. — FASE 01: CALIBRACIÓ DE FREQÜÈNCIA */
(function () {
  'use strict';

  const config = window.CUM_CONFIG || {};
  const demo = new URLSearchParams(window.location.search).get('demo') === '1';

  const hora = config.desbloqueo
    ? new Date(config.desbloqueo).getTime()
    : NaN;

  // Control d'accés segons l'hora de desbloqueig.
  if (!demo && !(Number.isFinite(hora) && Date.now() >= hora)) {
    window.location.replace('index.html');
    return;
  }

  document.body.classList.remove('access-pending');

  const $ = (selector) => document.querySelector(selector);

  const slider = $('#frequency-slider');
  const readout = $('#frequency-readout');
  const feedback = $('#frequency-feedback');
  const meter = $('#signal-meter');
  const fill = $('#signal-fill');
  const signalValue = $('#signal-value');
  const minus = $('#frequency-minus');
  const plus = $('#frequency-plus');

  // Freqüència correcta configurada a config.js.
  // Treballem amb dècimes per evitar errors decimals.
  const valorConfig = Number(config.frecuenciaObjetivo);

  const target = Number.isFinite(valorConfig) &&
    valorConfig >= 87.5 && valorConfig <= 108
      ? Math.round(valorConfig * 10)
      : 967;

  let completada = false;
  let audioContext = null;
  let ultimaNota = 0;

  // =========================================
  // SISTEMA DE SO
  // =========================================

  function to(frequencia, durada, retard = 0, volum = 0.025) {
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return;

      if (!audioContext) {
        audioContext = new Audio();
      }

      if (audioContext.state === 'suspended') {
        audioContext.resume().catch(() => {});
      }

      const inici = audioContext.currentTime + retard;

      const oscilador = audioContext.createOscillator();
      const guany = audioContext.createGain();

      oscilador.type = 'sine';
      oscilador.frequency.setValueAtTime(frequencia, inici);

      guany.gain.setValueAtTime(0.0001, inici);
      guany.gain.exponentialRampToValueAtTime(
        volum,
        inici + 0.01
      );
      guany.gain.exponentialRampToValueAtTime(
        0.0001,
        inici + durada
      );

      oscilador.connect(guany);
      guany.connect(audioContext.destination);

      oscilador.start(inici);
      oscilador.stop(inici + durada + 0.015);

    } catch (_) {
      // El joc continua funcionant encara que no hi hagi so.
    }
  }

  // =========================================
  // RELLOTGE
  // =========================================

  function actualitzarRellotge() {
    $('#clock').textContent = new Date().toLocaleTimeString(
      'es-ES',
      {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }
    );
  }

  // =========================================
  // SIMULACIÓ DEL SENYAL
  // =========================================

  // Genera un pic de senyal al voltant d'una freqüència.
  function pic(frequencia, centre, intensitat, amplada) {
    const distancia = (frequencia - centre) / amplada;

    return intensitat * Math.exp(
      -distancia * distancia
    );
  }

  function calcularQualitat(decimes) {
    const frequencia = decimes / 10;
    const frequenciaCorrecta = target / 10;

    // Interferències de fons.
    // Fan que la barra fluctuï al llarg de tot el dial.
    const interferencies =
      8 +
      8 * Math.abs(Math.sin(frequencia * 2.1)) +
      7 * Math.abs(Math.cos(frequencia * 1.3));

    // Transmissions falses.
    // Generen pics d'intensitat en altres freqüències.
    const senyalsFalsos =
      pic(frequencia, 90.2, 52, 0.48) +
      pic(frequencia, 93.4, 63, 0.72) +
      pic(frequencia, 100.8, 54, 0.64) +
      pic(frequencia, 104.6, 64, 0.57);

    // Senyal real.
    // És més intensa prop de la freqüència correcta.
    const senyalReal = pic(
      frequencia,
      frequenciaCorrecta,
      78,
      0.65
    );

    // Només la freqüència exacta arriba al 100%.
    if (decimes === target) {
      return 100;
    }

    return Math.min(
      98,
      Math.round(
        interferencies + senyalsFalsos + senyalReal
      )
    );
  }

  // =========================================
  // ACTUALITZAR EL RECEPTOR
  // =========================================

  function ajustar(nouValor, silencios = false) {
    if (completada) return;

    const decimes = Math.max(
      875,
      Math.min(1080, Math.round(Number(nouValor) * 10))
    );

    const frequencia = (decimes / 10).toFixed(1);
    const qualitat = calcularQualitat(decimes);

    // Actualitzar freqüència.
    slider.value = frequencia;
    readout.textContent = frequencia;

    // Actualitzar barra d'intensitat.
    signalValue.textContent = `${qualitat}%`;
    meter.setAttribute('aria-valuenow', qualitat);
    fill.style.width = `${qualitat}%`;

    // =====================================
    // FREQÜÈNCIA CORRECTA
    // =====================================

    if (decimes === target) {
      completada = true;

      slider.disabled = true;
      minus.disabled = true;
      plus.disabled = true;

      $('.receiver').classList.add('completed');

      feedback.textContent =
        'SEÑAL ESTABILIZADA · FRECUENCIA RECUPERADA';

      // So de confirmació.
      to(660, 0.16, 0, 0.045);
      to(880, 0.16, 0.18, 0.045);
      to(1100, 0.27, 0.36, 0.045);

      // Guardar que s'ha superat aquesta fase.
      try {
        localStorage.setItem('cum-fase01-completada', '1');
      } catch (_) {}

      // Passar automàticament a la triangulació.
      window.setTimeout(() => {

          window.location.assign(

              demo

                  ? 'informe.html?fase=2&demo=1'

                  : 'informe.html?fase=2'

          );

      }, 1500);

      return;
    }

    // =====================================
    // MISSATGES SEGONS INTENSITAT
    // =====================================

    if (qualitat >= 75) {
      feedback.textContent =
        'PORTADORA DETECTADA · VERIFICANDO FRECUENCIA...';

    } else if (qualitat >= 40) {
      feedback.textContent =
        'SEÑAL INESTABLE · INTERFERENCIAS PRESENTES';

    } else {
      feedback.textContent =
        'BUSCANDO TRANSMISIÓN...';
    }

    // =====================================
    // SO DURANT LA SINTONITZACIÓ
    // =====================================

    if (!silencios && performance.now() - ultimaNota > 140) {
      ultimaNota = performance.now();

      // El to varia segons la intensitat.
      to(220 + qualitat * 4, 0.055, 0, 0.012);
    }
  }

  // =========================================
  // CONTROLS DEL RECEPTOR
  // =========================================

  slider.addEventListener('input', () => {
    ajustar(slider.value);
  });

  minus.addEventListener('click', () => {
    ajustar(Number(slider.value) - 0.1);
  });

  plus.addEventListener('click', () => {
    ajustar(Number(slider.value) + 0.1);
  });

  // =========================================
  // INICIALITZACIÓ
  // =========================================

  actualitzarRellotge();
  window.setInterval(actualitzarRellotge, 1000);

  // Mostrar la intensitat inicial sense reproduir cap so.
  ajustar(slider.value, true);

})();
