
/* C.U.M. — FASE 02: TRIANGULACIÓ */

(function () {

    'use strict';

    const $ = selector => document.querySelector(selector);

    // =====================================
    // CONFIGURACIÓ DEL CODI UV
    // =====================================

    // Canviar aquest valor pel codi definitiu
    // que trobarà escrit amb tinta invisible.

    const CODI_UV = '4210';


    // =====================================
    // CONTROL D'ACCÉS
    // =====================================

    const demo = new URLSearchParams(
        window.location.search
    ).get('demo') === '1';

    let calibracioCompletada = false;

    try {

        calibracioCompletada =
            localStorage.getItem(
                'cum-fase01-completada'
            ) === '1';

    } catch (_) {}

    if (!demo && !calibracioCompletada) {

        window.location.replace('calibracion.html');
        return;

    }

    document.body.classList.remove('access-pending');


    // =====================================
    // CONFIGURACIÓ DELS PUNTS
    // =====================================

    const punts = {

        a: {
            nom: 'AULARIO COMÚN',
            x: 236,
            y: 562,

            respostes: [
                'aulari comu',
                'aulario comun',
                'aulari',
                'aulario',
                'ac'
            ],

            completat: false
        },

        b: {
            nom: 'BIBLIOTECA',
            x: 605,
            y: 614,

            respostes: [
                'biblioteca',
                'biblioteca montilivi',
                'biblioteca del campus',
                'biblioteca de montilivi',
                'biblioteca udg',
                'biblio'
            ],

            completat: false
        },

        c: {
            nom: 'POLITÉCNICA II',
            x: 785,
            y: 361,

            respostes: [
                'p2',
                'p 2',
                'p-2',
                'politècnica 2',
                'politecnica ii',
                'eps 2',
                'eps2',
                'edifici p2',
                'edificio p2'
            ],

            completat: false
        }

    };

    // Entrada de la cafeteria.

    const objectiu = {
        x: 490,
        y: 510
    };

    let puntsCompletats = 0;


    // =====================================
    // CONFIGURACIÓ DEL MINIJOC
    // =====================================

    const svgNS = 'http://www.w3.org/2000/svg';

    const idsEstacions = ['a', 'b', 'c'];

    const parelles = [
        ['a', 'b'],
        ['b', 'c'],
        ['c', 'a']
    ];

    // Cada unitat representa 15 graus.
    // En girar una estació també es mouen
    // les altres dues.

    const moviments = {

        a: { a: 2, b: 1, c: -1 },

        b: { a: -1, b: 2, c: 1 },

        c: { a: 1, b: -1, c: 2 }

    };

    let rotacions = {
        a: 0,
        b: 0,
        c: 0
    };

    let estacioSeleccionada = 'a';

    let nombreMoviments = 0;

    let alineacioIniciada = false;

    let alineacioCompletada = false;

    let connexionsAnteriors = 0;

    let codiUVValidat = false;


    // =====================================
    // NORMALITZAR RESPOSTES
    // =====================================

    function normalitzar(text) {

        return text
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim()
            .replace(/\s+/g, ' ');

    }


    // =====================================
    // VALIDAR ELS EDIFICIS
    // =====================================

    function validarResposta(id, formulari) {

        const punt = punts[id];

        if (!punt || punt.completat) return;

        const input = formulari.querySelector('input');

        const boto = formulari.querySelector('button');

        const feedback = formulari.querySelector(
            '.answer-feedback'
        );

        const resposta = normalitzar(input.value);

        const correcte = punt.respostes.some(

            valor => normalitzar(valor) === resposta

        );

        if (correcte) {

            punt.completat = true;
            puntsCompletats++;

            formulari.classList.remove('incorrect');

            formulari.classList.add('completed');

            input.value = punt.nom;
            input.disabled = true;
            boto.disabled = true;

            feedback.textContent =
                '✓ ESTACIÓN IDENTIFICADA';

            // Mostrar el node al mapa.

            $(`#node-${id}`).classList.add('active');

            reproduirSo();

            actualitzarComptador();

        } else {

            formulari.classList.add('incorrect');

            feedback.textContent =
                'UBICACIÓN NO RECONOCIDA. ' +
                'INTÉNTELO DE NUEVO.';

        }

    }


    // =====================================
    // COMPTADOR DE PUNTS
    // =====================================

    function actualitzarComptador() {

        $('#node-counter').textContent =
            `${puntsCompletats}/3 NODOS`;

        if (puntsCompletats === 3) {

            iniciarAlineacio();

        }

    }


    // =====================================
    // CREAR ELEMENTS SVG
    // =====================================

    function crearSVG(tipus, atributs) {

        const element = document.createElementNS(
            svgNS,
            tipus
        );

        Object.entries(atributs).forEach(([clau, valor]) => {

            element.setAttribute(clau, valor);

        });

        return element;

    }


    // =====================================
    // PREPARAR ELS NODES GIRATORIS
    // =====================================

    function prepararNode(id) {

        const punt = punts[id];

        const node = $(`#node-${id}`);

        node.classList.add('station');

        // Ampliar el cercle central.

        const cercle = node.querySelector('.node-core');

        cercle.setAttribute('r', 24);

        // Centrar la lletra dins del cercle.

        const lletra = node.querySelector('text');

        lletra.setAttribute('x', punt.x);
        lletra.setAttribute('y', punt.y + 8);

        lletra.setAttribute(
            'text-anchor',
            'middle'
        );

        // Posicionar les puntes al centre del node.

        const centre = crearSVG('g', {

            transform: `translate(${punt.x} ${punt.y})`

        });

        // Grup que conté les dues puntes giratòries.

        const rotor = crearSVG('g', {

            id: `rotor-${id}`

        });

        // Calcular els angles segons
        // la posició dels altres dos nodes.

        idsEstacions.forEach(altreId => {

            if (altreId === id) return;

            const altre = punts[altreId];

            const angle = Math.atan2(

                altre.y - punt.y,
                altre.x - punt.x

            ) * 180 / Math.PI;

            const punta = crearSVG('path', {

                d: 'M22 -9 L47 0 L22 9 Z',

                class: 'station-port',

                transform: `rotate(${angle})`

            });

            rotor.appendChild(punta);

        });

        centre.appendChild(rotor);

        node.insertBefore(centre, cercle);

        // Zona tàctil ampliada per a mòbils.

        const zonaTactil = crearSVG('circle', {

            cx: punt.x,
            cy: punt.y,
            r: 72,
            fill: 'transparent'

        });

        node.appendChild(zonaTactil);

        node.addEventListener('click', () => {

            seleccionarEstacio(id);

        });

    }


    // =====================================
    // PREPARAR LES CONNEXIONS
    // =====================================

    function prepararConnexions() {

        const capa = $('#network-lines');

        capa.innerHTML = '';

        parelles.forEach(([a, b]) => {

            const origen = punts[a];

            const desti = punts[b];

            const linia = crearSVG('line', {

                id: `link-${a}-${b}`,

                x1: origen.x,
                y1: origen.y,

                x2: desti.x,
                y2: desti.y,

                class: 'network-link'

            });

            capa.appendChild(linia);

        });

    }


    // =====================================
    // SELECCIONAR ESTACIÓ
    // =====================================

    function seleccionarEstacio(id) {

        if (alineacioCompletada) return;

        estacioSeleccionada = id;

        idsEstacions.forEach(estacio => {

            $(`#node-${estacio}`).classList.toggle(

                'selected',

                estacio === id

            );

        });

        document.querySelectorAll('[data-station]')
            .forEach(boto => {

                const seleccionat =
                    boto.dataset.station === id;

                boto.classList.toggle(

                    'selected',
                    seleccionat

                );

                boto.setAttribute(

                    'aria-pressed',
                    String(seleccionat)

                );

            });

    }


    // =====================================
    // GIRAR LES ESTACIONS
    // =====================================

    function aplicarMoviment(id, sentit) {

        idsEstacions.forEach(estacio => {

            const increment =
                moviments[id][estacio] * sentit;

            rotacions[estacio] = (

                rotacions[estacio] + increment + 24

            ) % 24;

        });

    }


    function girarEstacio(sentit) {

        if (!alineacioIniciada ||
             alineacioCompletada) return;

        aplicarMoviment(

            estacioSeleccionada,
            sentit

        );

        nombreMoviments++;

        actualitzarAlineacio();

    }


    // =====================================
    // ACTUALITZAR L'ALINEACIÓ
    // =====================================

    function actualitzarAlineacio() {

        // Girar les puntes dels nodes.

        idsEstacions.forEach(id => {

            const angle = rotacions[id] * 15;

            $(`#rotor-${id}`).setAttribute(

                'transform',

                `rotate(${angle})`

            );

            $(`#node-${id}`).classList.toggle(

                'aligned',

                rotacions[id] === 0

            );

        });

        // Comprovar les connexions.

        let connexions = 0;

        parelles.forEach(([a, b]) => {

            const connectats =

                rotacions[a] === 0 &&
                rotacions[b] === 0;

            $(`#link-${a}-${b}`).classList.toggle(

                'connected',

                connectats

            );

            if (connectats) {

                connexions++;

            }

        });

        // Actualitzar comptadors.

        $('#connection-counter').textContent =
            `${connexions}/3 ENLACES`;

        $('#node-counter').textContent =
            `${connexions}/3 ENLACES`;

        $('#move-counter').textContent =
            `${nombreMoviments} MOVIMIENTOS`;

        // So quan s'estableix una nova connexió.

        if (connexions > connexionsAnteriors) {

            reproduirSo();

        }

        connexionsAnteriors = connexions;

        // Comprovar si el minijoc està resolt.

        if (connexions === 3) {

            completarTriangulacio();

        }

    }


    // =====================================
    // REINICIAR EL TRENCACLOSQUES
    // =====================================

    function reiniciarAlineacio() {

        if (alineacioCompletada) return;

        rotacions = {

            a: 0,
            b: 0,
            c: 0

        };

        // Desordenar a partir d'una solució.
        // Això garanteix que sigui resoluble.

        aplicarMoviment('a', 1);
        aplicarMoviment('a', 1);

        aplicarMoviment('b', -1);
        aplicarMoviment('b', -1);

        aplicarMoviment('c', 1);

        nombreMoviments = 0;

        connexionsAnteriors = 0;

        seleccionarEstacio('a');

        actualitzarAlineacio();

    }


    // =====================================
    // INICIAR EL MINIJOC
    // =====================================

    function iniciarAlineacio() {

        if (alineacioIniciada) return;

        alineacioIniciada = true;

        // Amagar els formularis d'identificació.

        $('#reference-points').hidden = true;

        // Mostrar els controls d'alineació.

        $('#references-completed').hidden = false;

        // Actualitzar la introducció.

        $('.intro h1').textContent =
            'Sincronización de estaciones';

        $('.intro > p:last-child').textContent =

            'Las tres estaciones han sido desplegadas. ' +
            'Establezca una red de rastreo estable ' +
            'para localizar el origen de la transmisión.';

        prepararConnexions();

        idsEstacions.forEach(id => {

            prepararNode(id);

        });

        reiniciarAlineacio();

    }


    // =====================================
    // COMPLETAR LA TRIANGULACIÓ
    // =====================================

    function completarTriangulacio() {

        if (alineacioCompletada) return;

        alineacioCompletada = true;

        // Desactivar els controls.

        document.querySelectorAll(
            '#references-completed button'
        ).forEach(boto => {

            boto.disabled = true;

        });

        idsEstacions.forEach(id => {

            $(`#node-${id}`).classList.remove('selected');

        });

        $('#alignment-title').textContent =
            'RED SINCRONIZADA';

        const capa = $('#network-lines');

        const capaObjectiu = $('#target-layer');

        // Dibuixar les línies cap a la cafeteria.

        idsEstacions.forEach(id => {

            const punt = punts[id];

            const linia = crearSVG('line', {

                x1: punt.x,
                y1: punt.y,

                x2: objectiu.x,
                y2: objectiu.y,

                class: 'target-line'

            });

            capa.appendChild(linia);

        });

        // Crear el marcador final.

        const anell = crearSVG('circle', {

            cx: objectiu.x,
            cy: objectiu.y,
            r: 26,

            class: 'target-ring'

        });

        const puntFinal = crearSVG('circle', {

            cx: objectiu.x,
            cy: objectiu.y,
            r: 8,

            class: 'target-point'

        });

        capaObjectiu.appendChild(anell);

        capaObjectiu.appendChild(puntFinal);

        // Seqüència de sons de confirmació.

        reproduirSo(660, 0.18);

        setTimeout(() => {

            reproduirSo(880, 0.18);

        }, 200);

        setTimeout(() => {

            reproduirSo(1100, 0.28);

        }, 400);

        // Guardar la fase completada.

        try {

            localStorage.setItem(
                'cum-fase02-completada',
                '1'
            );

        } catch (_) {}

        // Mostrar la fotografia i el codi UV.

        setTimeout(() => {

            mostrarResultat();

        }, 1500);

    }


    // =====================================
    // MOSTRAR LA LOCALITZACIÓ FINAL
    // =====================================

    function mostrarResultat() {

        $('#references-completed').hidden = true;

        $('#location-result').hidden = false;

        $('.intro h1').textContent =
            'Origen de la señal localizado';

        $('.intro > p:last-child').textContent =

            'La red de rastreo ha identificado ' +
            'correctamente el origen de la transmisión.';

        // Carregar la fotografia.

        const foto = $('#location-photo');

        const feedback = $('#photo-feedback');

        foto.onload = () => {

            foto.hidden = false;

            feedback.textContent = '';

        };

        foto.onerror = () => {

            feedback.textContent =
                'Referencia visual no disponible.';

        };

        foto.src = foto.dataset.src;

    }


    // =====================================
    // NORMALITZAR EL CODI UV
    // =====================================

    function normalitzarCodi(valor) {

        return valor
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .replace(/[\s-]/g, '');

    }


    // =====================================
    // VALIDAR EL CODI UV
    // =====================================

    function validarCodiUV(event) {

        event.preventDefault();

        // Evitar validacions duplicades.

        if (codiUVValidat ||
            !alineacioCompletada) return;

        const input = $('#uv-code');

        const resposta = normalitzarCodi(
            input.value
        );

        const codiCorrecte = normalitzarCodi(
            CODI_UV
        );

        if (resposta === codiCorrecte) {

            codiUVValidat = true;

            // Guardar que ha superat la prova.

            try {

                localStorage.setItem(
                    'cum-fase03-completada',
                    '1'
                );

            } catch (_) {}

            // So de confirmació.

            reproduirSo(880, 0.2);

            setTimeout(() => {

                reproduirSo(1100, 0.25);

            }, 200);

            // Amagar el formulari.

            $('#uv-form').hidden = true;

            // Mostrar el missatge de confirmació.

            $('#uv-completed').hidden = false;

        } else {

            $('#uv-feedback').textContent =

                'CÓDIGO NO RECONOCIDO. ' +
                'VERIFIQUE LA INFORMACIÓN RECUPERADA.';

            reproduirSo(220, 0.2);

        }

    }


    // =====================================
    // SISTEMA DE SO
    // =====================================

    let audioContext = null;

    function reproduirSo(
        frequencia = 880,
        durada = 0.18
    ) {

        try {

            const Audio = window.AudioContext ||
                          window.webkitAudioContext;

            if (!Audio) return;

            if (!audioContext) {

                audioContext = new Audio();

            }

            if (audioContext.state === 'suspended') {

                audioContext.resume().catch(() => {});

            }

            const oscilador = audioContext.createOscillator();

            const volum = audioContext.createGain();

            oscilador.type = 'sine';

            oscilador.frequency.value = frequencia;

            volum.gain.setValueAtTime(

                0.035,

                audioContext.currentTime

            );

            volum.gain.exponentialRampToValueAtTime(

                0.0001,

                audioContext.currentTime + durada

            );

            oscilador.connect(volum);

            volum.connect(audioContext.destination);

            oscilador.start();

            oscilador.stop(

                audioContext.currentTime + durada

            );

        } catch (_) {}

    }


    // =====================================
    // ESDEVENIMENTS DELS FORMULARIS
    // =====================================

    document.querySelectorAll('.reference-card')
        .forEach(formulari => {

            formulari.addEventListener('submit', event => {

                event.preventDefault();

                validarResposta(

                    formulari.dataset.point,

                    formulari

                );

            });

        });


    // =====================================
    // ESDEVENIMENTS DEL MINIJOC
    // =====================================

    document.querySelectorAll('[data-station]')
        .forEach(boto => {

            boto.addEventListener('click', () => {

                seleccionarEstacio(

                    boto.dataset.station

                );

            });

        });

    $('#rotate-left').addEventListener('click', () => {

        girarEstacio(-1);

    });

    $('#rotate-right').addEventListener('click', () => {

        girarEstacio(1);

    });

    $('#reset-alignment').addEventListener('click', () => {

        reiniciarAlineacio();

    });


    // =====================================
    // ESDEVENIMENT DEL CODI UV
    // =====================================

    $('#uv-form').addEventListener(
        'submit',
        validarCodiUV
    );

    // Esborrar l'error quan torna a escriure.

    $('#uv-code').addEventListener('input', () => {

        $('#uv-feedback').textContent = '';

    });


    // =====================================
    // ACCÉS A LA TERCERA TRANSMISSIÓ
    // =====================================

    $('#uv-continue').addEventListener('click', () => {

        if (!codiUVValidat) return;

        window.location.href = demo
            ? 'informe.html?fase=3&demo=1'
            : 'informe.html?fase=3';

    });

    // =====================================
    // RELLOTGE
    // =====================================

    function actualitzarRellotge() {

        $('#clock').textContent =

            new Date().toLocaleTimeString('es-ES', {

                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit'

            });

    }

    actualitzarRellotge();

    setInterval(actualitzarRellotge, 1000);

})();
