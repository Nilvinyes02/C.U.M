
/* C.U.M. — SISTEMA DE TRANSMISSIONS */

(function () {

    'use strict';

    const $ = selector => document.querySelector(selector);

    const config = window.CUM_CONFIG || {};

    const params = new URLSearchParams(
        window.location.search
    );

    const demo = params.get('demo') === '1';

    const fase = params.get('fase') || '1';


    // =====================================
    // CONFIGURACIÓ DELS INFORMES
    // =====================================

    const informes = {

        '1': {

            referencia: 'TX-01',

            titol: 'Señal interceptada',

            paragrafs: [

                'Agente Marianne,',

                'Nuestros sistemas han interceptado una señal de origen desconocido que parece contener la localización de un punto de interés.',

                'Creemos que en dicho lugar se encuentra información de vital importancia para recuperar el objeto desaparecido.',

                'Sin embargo, la señal es extremadamente débil y las interferencias nos impiden recuperar su contenido.',

                'Necesitamos que ajuste manualmente nuestro receptor para restablecer la transmisión.',

                'Confiamos en usted, agente.'

            ],

            boto: 'ACCEDER AL RECEPTOR →',

            seguent: 'calibracion.html'

        },

        '2': {

            referencia: 'TX-02',

            titol: 'Origen desconocido',

            paragrafs: [

                'Excelente trabajo, agente Marianne.',

                'Gracias a su intervención, hemos conseguido estabilizar la señal y confirmar que su origen se encuentra dentro del campus universitario de Montilivi.',

                'Sin embargo, parte de los datos recuperados está corrupta y desconocemos la ubicación exacta.',

                'Necesitamos recurrir a sus conocimientos del terreno para establecer una red de estaciones de rastreo y triangular la posición del emisor.',

                'El éxito de esta operación depende de usted.'

            ],

            boto: 'INICIAR TRIANGULACIÓN →',

            seguent: 'triangulacion.html'

        }

    };


    const informe = informes[fase];

    // Comprovar que existeix l'informe.

    if (!informe) {

        window.location.replace('index.html');
        return;

    }


    // =====================================
    // CONTROL D'ACCÉS
    // =====================================

    if (!demo) {

        const desbloqueo = config.desbloqueo
            ? new Date(config.desbloqueo).getTime()
            : NaN;

        if (!Number.isFinite(desbloqueo) ||
            Date.now() < desbloqueo) {

            window.location.replace('index.html');
            return;

        }

        // L'informe 2 requereix haver acabat
        // el minijoc de calibració.

        if (fase === '2') {

            let calibracioCompletada = false;

            try {

                calibracioCompletada =
                    localStorage.getItem(
                        'cum-fase01-completada'
                    ) === '1';

            } catch (_) {}

            if (!calibracioCompletada) {

                window.location.replace(
                    'calibracion.html'
                );

                return;

            }

        }

    }


    document.body.classList.remove('access-pending');


    // =====================================
    // PREPARAR LA PANTALLA
    // =====================================

    const contingut = $('#report-content');

    const cursor = $('#cursor');

    const botoContinuar = $('#continue-button');

    const botoOmetre = $('#skip-animation');

    $('#report-title').textContent = informe.titol;

    $('#report-reference').textContent =

        `${config.expediente || 'OP-067'} // ${informe.referencia}`;

    botoContinuar.textContent = informe.boto;


    // =====================================
    // CONFIGURACIÓ DE L'ANIMACIÓ
    // =====================================

    // Mil·lisegons entre cada caràcter.

    const velocitatText = 18;

    // Pausa entre paràgrafs.

    const pausaParagraf = 350;

    let paragrafActual = 0;

    let caracterActual = 0;

    let elementParagraf = null;

    let textNode = null;

    let temporitzador = null;

    let animacioAcabada = false;


    // =====================================
    // CREAR UN PARÀGRAF
    // =====================================

    function crearParagraf(index, text = '') {

        const paragraf = document.createElement('p');

        paragraf.textContent = text;

        // Últim paràgraf de color verd.

        if (index === informe.paragrafs.length - 1) {

            paragraf.classList.add('final-line');

        }

        contingut.appendChild(paragraf);

        return paragraf;

    }


    // =====================================
    // EFECTE MÀQUINA D'ESCRIURE
    // =====================================

    function escriureText() {

        if (animacioAcabada) return;

        // Comprovar si ja hem escrit tot.

        if (paragrafActual >= informe.paragrafs.length) {

            acabarAnimacio();

            return;

        }

        const text = informe.paragrafs[paragrafActual];

        // Crear un nou paràgraf.

        if (caracterActual === 0) {

            elementParagraf = crearParagraf(
                paragrafActual
            );

            textNode = document.createTextNode('');

            elementParagraf.appendChild(textNode);

            // Situar el cursor al final del text.

            elementParagraf.appendChild(cursor);

        }

        // Afegir una lletra.

        textNode.appendData(
            text.charAt(caracterActual)
        );

        caracterActual++;

        // Comprovar si hem acabat el paràgraf.

        if (caracterActual >= text.length) {

            caracterActual = 0;

            paragrafActual++;

            temporitzador = setTimeout(

                escriureText,

                pausaParagraf

            );

        } else {

            temporitzador = setTimeout(

                escriureText,

                velocitatText

            );

        }

    }


    // =====================================
    // FINALITZAR L'ANIMACIÓ
    // =====================================

    function acabarAnimacio() {

        animacioAcabada = true;

        clearTimeout(temporitzador);

        cursor.hidden = true;

        botoOmetre.hidden = true;

        $('#report-end').hidden = false;

        botoContinuar.hidden = false;

    }


    // =====================================
    // OMETRE L'ANIMACIÓ
    // =====================================

    function ometreAnimacio() {

        clearTimeout(temporitzador);

        contingut.innerHTML = '';

        // Mostrar tots els paràgrafs directament.

        informe.paragrafs.forEach((text, index) => {

            crearParagraf(index, text);

        });

        acabarAnimacio();

    }


    botoOmetre.addEventListener(

        'click',

        ometreAnimacio

    );


    // =====================================
    // CONTINUAR A LA SEGÜENT FASE
    // =====================================

    botoContinuar.addEventListener('click', () => {

        if (!animacioAcabada) return;

        window.location.href = demo

            ? `${informe.seguent}?demo=1`

            : informe.seguent;

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


    // =====================================
    // INICIAR LA TRANSMISSIÓ
    // =====================================

    if (window.matchMedia(
        '(prefers-reduced-motion: reduce)'
    ).matches) {

        ometreAnimacio();

    } else {

        temporitzador = setTimeout(

            escriureText,

            500

        );

    }

})();
