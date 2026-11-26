/* C.U.M. — VALIDACIÓ FINAL */
(function () {
    'use strict';
    const $ = s => document.querySelector(s);

    // CONFIGURACIÓ: canviar aquests dos valors abans de la missió.
    const CODI_FINAL = '06723';
    const PISTA_FINAL = '';

    const demo = new URLSearchParams(location.search).get('demo') === '1';
    const config = window.CUM_CONFIG || {};

    function llegir(clau) {
        try { return localStorage.getItem(clau) === '1'; }
        catch (_) { return false; }
    }

    // CONTROL D'ACCÉS
    if (!demo) {
        const desbloqueig = new Date(config.desbloqueo || '').getTime();
        if (!Number.isFinite(desbloqueig) || Date.now() < desbloqueig) {
            location.replace('index.html');
            return;
        }
        if (!llegir('cum-fase04-completada')) {
            location.replace('infiltracion.html');
            return;
        }
    }

    document.body.classList.remove('access-pending');
    $('#location-clue').textContent = PISTA_FINAL;

    // Fotografia opcional; si no existeix, es manté el símbol.
    const foto = $('#box-photo');
    foto.onload = () => {
        foto.hidden = false;
        $('#box-symbol').hidden = true;
    };
    foto.onerror = () => {
        foto.hidden = true;
        $('#box-symbol').hidden = false;
    };
    foto.src = foto.dataset.src;

    // Ignorar accents, espais, guionets i majúscules.
    function normalitzar(text) {
        return text.normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase().replace(/[\s-]/g, '');
    }

    let completat = false;

    function mostrarFinal() {
        if (completat) return;
        completat = true;
        if (!demo) {
            try { localStorage.setItem('cum-fase05-completada', '1'); }
            catch (_) {}
        }
        $('#recovery').hidden = true;
        $('#final-screen').hidden = false;
        document.title = 'C.U.M. | Misión completada';
        $('#final-title').focus({ preventScroll: true });
        window.scrollTo(0, 0);
    }

    $('#final-form').addEventListener('submit', event => {
        event.preventDefault();
        if (completat) return;
        if (normalitzar($('#final-code').value) === normalitzar(CODI_FINAL)) {
            mostrarFinal();
        } else {
            $('#feedback').textContent = 'CLAVE INCORRECTA. VERIFIQUE EL CÓDIGO DEL CONTENEDOR.';
            $('#final-code').focus();
        }
    });
    $('#final-code').addEventListener('input', () => {
        $('#feedback').textContent = '';
    });

    // Recuperar el desenllaç si es refresca la pàgina real.
    if (!demo && llegir('cum-fase05-completada')) mostrarFinal();

    function actualitzarRellotge() {
        $('#clock').textContent = new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });
    }
    actualitzarRellotge();
    setInterval(actualitzarRellotge, 1000);
})();
