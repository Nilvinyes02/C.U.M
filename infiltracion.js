
/* C.U.M. — MINIJOC D'INFILTRACIÓ */

(() => {

    'use strict';

    const $ = s => document.querySelector(s);

    const canvas = $('#board');
    const ctx = canvas.getContext('2d');

    const CELL = 40;

    // =====================================
    // CONFIGURACIÓ DEL MAPA
    // =====================================

    // # = Paret
    // . = Passadís
    // S = Inici
    // 1, 2, 3 = Arxius
    // A, B = Antivirus
    // E = Sortida

    const map = [
        '###################',
        '#S....#.....#....1#',
        '#.###.#.#.#.#.#.###',
        '#.....#.#.....#...#',
        '#.#.#####.#####.#.#',
        '#.......#....A....#',
        '#.###.#.#.#.#.###.#',
        '#.#...........#...#',
        '#.#.#######.#.#.#.#',
        '#..........3......#',
        '#.###.###.###.###.#',
        '#...#...#.......#.#',
        '#.#.###.###.#####.#',
        '#2...B#...#.......#',
        '#.#####.#.###.###.#',
        '#................E#',
        '###################'
    ];

    canvas.width = map[0].length * CELL;
    canvas.height = map.length * CELL;

    const dirs = {
        up: [0, -1],
        down: [0, 1],
        left: [-1, 0],
        right: [1, 0]
    };

    const names = [
        'Trakatrá.ID',
        'Bujarrada.LOG',
        'SixSeven.DAT'
    ];

    const fileMessages = [
        'Identidad de la agente verificada.',
        'Registro de ubicaciones recuperado.',
        'Archivo del objeto recuperado.'
    ];


    // =====================================
    // POSICIONS I MOVIMENTS
    // =====================================

    const pos = ch => {

        for (let y = 0; y < map.length; y++) {

            const x = map[y].indexOf(ch);

            if (x !== -1) {
                return { x, y };
            }

        }

    };

    const start = pos('S');
    const exit = pos('E');

    const packets = names.map((name, i) => ({
        ...pos(String(i + 1)),
        name
    }));

    const same = (a, b) =>
        a.x === b.x && a.y === b.y;

    const walkable = (x, y) =>
        map[y]?.[x] !== undefined &&
        map[y][x] !== '#';

    const neighbors = p =>
        Object.values(dirs)
            .map(([dx, dy]) => ({
                x: p.x + dx,
                y: p.y + dy
            }))
            .filter(q => walkable(q.x, q.y));


    // =====================================
    // ALGORITME BFS DELS ANTIVIRUS
    // =====================================

    function path(from, to) {

        const key = p =>
            p.y * map[0].length + p.x;

        const queue = [from];

        const prev = new Map([
            [key(from), null]
        ]);

        for (let i = 0; i < queue.length; i++) {

            const p = queue[i];

            if (same(p, to)) {

                const result = [];

                let cur = p;

                while (prev.get(key(cur)) !== null) {

                    result.push(cur);
                    cur = prev.get(key(cur));

                }

                return result.reverse();

            }

            for (const q of neighbors(p)) {

                if (!prev.has(key(q))) {

                    prev.set(key(q), p);
                    queue.push(q);

                }

            }

        }

        return [];

    }


    // =====================================
    // CONFIGURACIÓ DELS ANTIVIRUS
    // =====================================

    const makeEnemy = (letter, patrol) => ({

        ...pos(letter),

        px: pos(letter).x,
        py: pos(letter).y,

        patrol,

        way: 0,
        direction: 'left',
        next: 0,
        alert: false

    });


    // =====================================
    // VARIABLES DEL JOC
    // =====================================

    let player;
    let enemies;
    let collected;
    let lives;

    let state = 'ready';

    let held = null;
    let queued = null;

    let lastPlayer = 0;
    let immuneUntil = 0;

    let frame = 0;
    let progressTimer = 0;

    let soundOn = true;
    let audio = null;

    const stepMs = 135;
    const enemyMs = 315;

    const log = msg => {

        $('#log').textContent = '> ' + msg;

    };


    // =====================================
    // SISTEMA DE SO
    // =====================================

    function beep(freq = 660, duration = .12) {

        if (!soundOn) return;

        try {

            const Audio =
                window.AudioContext ||
                window.webkitAudioContext;

            if (!Audio) return;

            audio ??= new Audio();

            if (audio.state === 'suspended') {

                audio.resume().catch(() => {});

            }

            const o = audio.createOscillator();
            const g = audio.createGain();

            o.type = 'triangle';

            o.frequency.value = freq;

            g.gain.setValueAtTime(
                .035,
                audio.currentTime
            );

            g.gain.exponentialRampToValueAtTime(
                .0001,
                audio.currentTime + duration
            );

            o.connect(g);
            g.connect(audio.destination);

            o.start();

            o.stop(audio.currentTime + duration);

        } catch (_) {}

    }


    // =====================================
    // REINICIAR POSICIONS
    // =====================================

    function resetPositions(now = performance.now()) {

        player = {

            ...start,

            px: start.x,
            py: start.y,

            direction: 'right'

        };

        enemies = [

            makeEnemy('A', [
                { x: 13, y: 5 },
                { x: 17, y: 7 },
                { x: 15, y: 11 }
            ]),

            makeEnemy('B', [
                { x: 5, y: 13 },
                { x: 3, y: 9 },
                { x: 7, y: 15 }
            ])

        ];

        enemies.forEach(e => {

            e.next = now + 1000;

        });

        lastPlayer = now;
        immuneUntil = now + 1800;

        held = queued = null;

        clearPressed();

    }


    // =====================================
    // ACTUALITZAR MARCADORS
    // =====================================

    function updateHUD() {

        $('#data-count').textContent =
            `${collected.size}/3`;

        $('#lives').textContent =
            Array.from(
                { length: 3 },
                (_, i) => i < lives ? '♥' : '♡'
            ).join(' ');

        $('#lives').setAttribute(
            'aria-label',
            `${lives} vidas`
        );

        $('#access').textContent =

            collected.size === 3
                ? 'ABIERTO'
                : 'BLOQUEADO';

        $('#access').classList.toggle(
            'open',
            collected.size === 3
        );

        $('#file-list').replaceChildren(

            ...names.map((name, i) => {

                const row =
                    document.createElement('div');

                row.className =
                    'file' +
                    (collected.has(i) ? ' recovered' : '');

                const title =
                    document.createElement('strong');

                const status =
                    document.createElement('span');

                title.textContent = name;

                status.textContent =

                    collected.has(i)
                        ? '✓ RECUPERADO'
                        : 'CIFRADO';

                row.append(title, status);

                return row;

            })

        );

    }


    // =====================================
    // PANTALLA INICIAL I PAUSA
    // =====================================

    function overlay(
        title,
        text,
        button,
        kicker = 'UNIDAD UMBREON-01'
    ) {

        $('#overlay-title').textContent = title;
        $('#overlay-text').textContent = text;
        $('#start').textContent = button;
        $('#overlay-kicker').textContent = kicker;

        $('#overlay').hidden = false;
        $('#pause').disabled = true;

    }


    // =====================================
    // INICIALITZAR EL JOC
    // =====================================

    function init() {

        clearInterval(progressTimer);

        progressTimer = 0;

        collected = new Set();

        lives = 3;

        state = 'ready';

        resetPositions();

        updateHUD();

        // Reiniciar la pantalla de resultat.

        $('#result').hidden = true;

        $('#message').hidden = true;

        $('#progress-fill').style.width = '0%';

        $('#percent').textContent = '0%';

        $('#decrypt-title').textContent =
            'Descifrando archivo...';

        $('#decrypt-overlay').hidden = true;

        $('#decrypt-log').textContent =
            'Iniciando protocolo de descifrado...';

        document.querySelectorAll('.decrypt-file')
            .forEach(row => {

                row.classList.remove('done');

                row.querySelector('span').textContent =
                    '[ ]';

            });

        $('#restart').disabled = false;

        $('.progress').setAttribute(
            'aria-valuenow',
            '0'
        );

        $('#pause').textContent = 'PAUSA';

        overlay(

            'Infiltración lista',

            'Recupera los tres archivos amarillos, ' +
            'esquiva los antivirus y alcanza la salida. ' +
            'Dispones de tres vidas.',

            'INICIAR INFILTRACIÓN'

        );

        log('Esperando autorización de la agente...');

    }


    // =====================================
    // INICIAR O REPRENDRE PARTIDA
    // =====================================

    function play() {

        if (state === 'lost' || state === 'won') {

            init();

        }

        state = 'playing';

        $('#overlay').hidden = true;

        $('#pause').disabled = false;

        $('#pause').textContent = 'PAUSA';

        const now = performance.now();

        lastPlayer = now;

        enemies.forEach(e => {

            e.next = now + 500;

        });

        immuneUntil = Math.max(
            immuneUntil,
            now + 800
        );

        log('Unidad UMBREON-01 desplegada.');

        beep();

    }


    function clearPressed() {

        document.querySelectorAll('[data-dir]')
            .forEach(b => {

                b.classList.remove('pressed');

            });

    }


    function pause() {

        if (state !== 'playing') return;

        state = 'paused';

        held = queued = null;

        clearPressed();

        overlay(

            'Operación en pausa',

            'La infiltración se ha detenido. ' +
            'Continúa cuando estés lista.',

            'CONTINUAR'

        );

        log('Operación en pausa.');

    }


    // =====================================
    // COL·LISIÓ AMB ANTIVIRUS
    // =====================================

    function hit(now) {

        if (now < immuneUntil) return false;

        lives--;

        updateHUD();

        beep(140, .25);

        if (lives === 0) {

            state = 'lost';

            held = queued = null;

            clearPressed();

            overlay(

                'Conexión interrumpida',

                'Los antivirus han bloqueado la unidad. ' +
                'Puedes volver a intentarlo todas ' +
                'las veces que quieras.',

                'REINTENTAR',

                'ALERTA // ACCESO DENEGADO'

            );

            log(
                'Conexión perdida. Reinicio disponible.'
            );

        } else {

            resetPositions(now);

            log(

                `Antivirus detectado. ${lives} vidas ` +
                'restantes. Los archivos recuperados ' +
                'se conservan.'

            );

        }

        return true;

    }


    function contact(now) {

        return enemies.some(e => same(e, player))
            && hit(now);

    }


    // =====================================
    // MOVIMENT D'UMBREON
    // =====================================

    function move(dir, now) {

        const [dx, dy] = dirs[dir];

        player.direction = dir;

        const x = player.x + dx;
        const y = player.y + dy;

        if (!walkable(x, y)) return;

        // La sortida està bloquejada fins
        // que recupera els tres arxius.

        if (

            same({ x, y }, exit) &&
            collected.size < 3

        ) {

            log(

                'Núcleo bloqueado: recupera ' +
                'todos los fragmentos.'

            );

            return;

        }

        player.x = x;
        player.y = y;

        if (contact(now)) return;

        // Recollir els arxius.

        packets.forEach((p, i) => {

            if (

                !collected.has(i) &&
                same(p, player)

            ) {

                collected.add(i);

                beep(780 + i * 110, .2);

                updateHUD();

                log(

                    collected.size === 3

                        ? 'Tres fragmentos recuperados. Núcleo desbloqueado.'

                        : `${p.name}: ${fileMessages[i]}`

                );

            }

        });

        // Comprovar la victòria.

        if (

            same(player, exit) &&
            collected.size === 3

        ) {

            win();

        }

    }


    // =====================================
    // MOVIMENT DELS ANTIVIRUS
    // =====================================

    function enemyMove(e, now) {

        const route = path(e, player);

        e.alert =

            route.length > 0 &&
            route.length <= 5 &&
            now >= immuneUntil;

        let dest;

        if (e.alert) {

            // Perseguir el jugador.

            dest = route[0];

        } else {

            // Seguir la ruta de patrulla.

            if (same(e, e.patrol[e.way])) {

                e.way =

                    (e.way + 1) %
                    e.patrol.length;

            }

            dest = path(
                e,
                e.patrol[e.way]
            )[0];

        }

        if (dest) {

            const dx = dest.x - e.x;
            const dy = dest.y - e.y;

            e.direction =

                dx > 0 ? 'right' :
                dx < 0 ? 'left' :
                dy > 0 ? 'down' :
                'up';

            e.x = dest.x;
            e.y = dest.y;

        }

        e.next = now + (

            e.alert ? 275 : enemyMs

        );

    }


    // =====================================
    // VICTÒRIA I DESXIFRATGE DE L'ARXIU
    // =====================================

    function win() {

        if (state !== 'playing') return;

        // Aturar el videojoc.

        state = 'won';

        held = queued = null;

        clearPressed();

        $('#pause').disabled = true;
        $('#restart').disabled = true;

        log(

            'Núcleo alcanzado. Descifrando archivo...'

        );

        // Mostrar la pantalla de desxifratge.

        $('#decrypt-overlay').hidden = false;

        const rows = [

            ...document.querySelectorAll(
                '.decrypt-file'
            )

        ];

        // Percentatges als quals es recupera
        // cadascun dels arxius.

        const thresholds = [18, 52, 84];

        const messages = [

            'Analizando fragmentos recuperados...',

            'Reconstruyendo estructura del archivo...',

            'Verificando integridad de los paquetes...',

            'Descifrando contenido protegido...',

            'Finalizando proceso...'

        ];

        let p = 0;

        let stage = -1;

        beep(660, .15);

        // Animació de la barra de progrés.

        progressTimer = setInterval(() => {

            p = Math.min(100, p + 2);

            $('#progress-fill').style.width =
                p + '%';

            $('#percent').textContent =
                p + '%';

            $('.progress').setAttribute(

                'aria-valuenow',

                String(p)

            );

            // Actualitzar el missatge del sistema.

            const currentStage = Math.min(

                4,

                Math.floor(p / 20)

            );

            if (currentStage !== stage) {

                stage = currentStage;

                $('#decrypt-log').textContent =
                    messages[stage];

            }

            // Recuperar progressivament els arxius.

            rows.forEach((row, i) => {

                if (

                    p >= thresholds[i] &&
                    !row.classList.contains('done')

                ) {

                    row.classList.add('done');

                    row.querySelector('span')
                        .textContent = '[✓]';

                    $('#decrypt-log').textContent =

                        names[i] + ' restaurado.';

                    beep(780 + i * 140, .15);

                }

            });

            // Desxifratge completat.

            if (p === 100) {

                clearInterval(progressTimer);

                progressTimer = 0;

                $('#decrypt-title').textContent =

                    'ARCHIVO DESCIFRADO';

                $('#decrypt-log').textContent =

                    'Integridad verificada. ' +
                    'Descifrado completado.';

                $('#message').hidden = false;

                $('#decrypt-continue').focus();

                beep(1200, .22);

                log(

                    'Archivo descifrado correctamente.'

                );

                // Guardar la fase completada.

                try {

                    const demo = new URLSearchParams(

                        location.search

                    ).get('demo') === '1';

                    if (!demo) {

                        localStorage.setItem(

                            'cum-fase04-completada',

                            '1'

                        );

                    }

                } catch (_) {}

            }

        }, 90);

    }


    // =====================================
    // CONTINUAR DESPRÉS DEL DESXIFRATGE
    // =====================================

    $('#decrypt-continue').addEventListener('click', () => {

        if (state !== 'won') return;

        const demo = new URLSearchParams(
            window.location.search
        ).get('demo') === '1';

        window.location.href = demo
            ? 'informe.html?fase=4&demo=1'
            : 'informe.html?fase=4';

    });


    // =====================================
    // GRÀFICS DEL VIDEOJOC
    // =====================================

    function rect(x, y, w, h, c) {

        ctx.fillStyle = c;

        ctx.fillRect(

            Math.round(x),

            Math.round(y),

            w,

            h

        );

    }


    // =====================================
    // DIBUIXAR EL MAPA
    // =====================================

    function drawMap() {

        for (let y = 0; y < map.length; y++) {

            for (let x = 0; x < map[y].length; x++) {

                const X = x * CELL;
                const Y = y * CELL;

                if (map[y][x] === '#') {

                    // Parets i servidors.

                    rect(X, Y, 40, 40, '#101d20');

                    rect(
                        X + 2, Y + 2,
                        36, 36, '#203339'
                    );

                    rect(
                        X + 4, Y + 4,
                        32, 30, '#142529'
                    );

                    if ((x + y) % 3 !== 0) {

                        for (let k = 0; k < 3; k++) {

                            rect(
                                X + 7,
                                Y + 8 + k * 8,
                                26, 5,
                                '#0a171a'
                            );

                            rect(
                                X + 10,
                                Y + 9 + k * 8,
                                5, 2,
                                '#68bd7d'
                            );

                            rect(
                                X + 17,
                                Y + 9 + k * 8,
                                3, 2,
                                '#2e6b4b'
                            );

                            rect(
                                X + 27,
                                Y + 9 + k * 8,
                                3, 2,
                                '#508d61'
                            );

                        }

                    }

                    if (walkable(x, y + 1)) {

                        rect(
                            X, Y + 37,
                            40, 3, '#43875d'
                        );

                    }

                    if (walkable(x + 1, y)) {

                        rect(
                            X + 37, Y,
                            3, 40, '#43875d'
                        );

                    }

                    if (walkable(x - 1, y)) {

                        rect(
                            X, Y,
                            3, 40, '#43875d'
                        );

                    }

                    if (walkable(x, y - 1)) {

                        rect(
                            X, Y,
                            40, 3, '#43875d'
                        );

                    }

                } else {

                    // Terra dels passadissos.

                    rect(

                        X, Y, 40, 40,

                        (x + y) % 2
                            ? '#122b24'
                            : '#142e27'

                    );

                    rect(
                        X, Y, 40, 1, '#203d32'
                    );

                    rect(
                        X, Y, 1, 40, '#203d32'
                    );

                    // Detalls del terra.

                    if ((x * 3 + y * 7) % 11 === 0) {

                        rect(
                            X + 12, Y + 12,
                            16, 16, '#10241e'
                        );

                        for (let a = 0; a < 3; a++) {

                            rect(
                                X + 15 + a * 4,
                                Y + 15,
                                2, 10,
                                '#2a4538'
                            );

                        }

                    }

                }

            }

        }

    }


    // =====================================
    // DIBUIXAR ELS ARXIUS
    // =====================================

    function drawPacket(p, i, t) {

        const x = p.x * 40 + 20;

        const y =

            p.y * 40 + 20 +

            Math.round(
                Math.sin(t / 240 + i) * 2
            );

        ctx.save();

        ctx.shadowColor = '#f2cf78';
        ctx.shadowBlur = 12;

        rect(
            x - 8, y - 11,
            16, 22, '#e9c16d'
        );

        ctx.restore();

        rect(
            x - 5, y - 8,
            10, 16, '#593f22'
        );

        rect(
            x - 4, y - 5,
            8, 2, '#f8dda0'
        );

        rect(
            x - 4, y,
            8, 2, '#f8dda0'
        );

        rect(
            x - 4, y + 5,
            5, 2, '#f8dda0'
        );

        rect(
            x + 4, y - 11,
            4, 4, '#fff0bb'
        );

    }


    // =====================================
    // DIBUIXAR LA SORTIDA
    // =====================================

    function drawExit(t) {

        const X = exit.x * 40;
        const Y = exit.y * 40;

        const open = collected.size === 3;

        const col = open
            ? '#9df0bf'
            : '#e8bb64';

        rect(
            X + 3, Y + 2,
            34, 36, '#091615'
        );

        rect(
            X + 5, Y + 4,
            30, 32, col
        );

        rect(
            X + 8, Y + 7,
            24, 27, '#152a25'
        );

        if (open) {

            rect(
                X + 10, Y + 8,
                20, 24, '#225b3c'
            );

            ctx.fillStyle = col;

            ctx.font = 'bold 10px monospace';

            ctx.textAlign = 'center';

            ctx.fillText(
                'EXIT',
                X + 20,
                Y + 24
            );

        } else {

            rect(
                X + 15, Y + 13,
                10, 8, col
            );

            rect(
                X + 17, Y + 15,
                6, 6, '#152a25'
            );

            rect(
                X + 12, Y + 20,
                16, 10, col
            );

            rect(
                X + 19, Y + 23,
                2, 5, '#152a25'
            );

        }

    }


    // =====================================
    // SPRITE D'UMBREON
    // =====================================

    // Imatge incrustada al JavaScript.
    // No necessita cap arxiu PNG extern.

    const umbreonSheet = new Image();

    umbreonSheet.src = 'data:image/png;base64,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';


    // =====================================
    // DIBUIXAR UMBREON
    // =====================================

    function drawPlayer(t) {

        const x =
            player.px * CELL + CELL / 2;

        const y =
            player.py * CELL + CELL / 2;

        // Parpelleig després de perdre una vida.

        if (

            state === 'playing' &&
            t < immuneUntil &&
            Math.floor(t / 100) % 2 === 0

        ) return;

        const moving =

            state === 'playing' &&

            (

                Math.abs(player.x - player.px) +

                Math.abs(player.y - player.py)

                > .035

            );

        // Animació del moviment.

        const pose = moving

            ? [1, 0, 2, 0][Math.floor(t / 95) % 4]

            : 0;

        const row =

            player.direction === 'up' ? 2 :

            player.direction === 'down' ? 1 :

            0;

        ctx.save();

        ctx.translate(

            Math.round(x),

            Math.round(y)

        );

        // Aura verda del personatge.

        ctx.fillStyle = '#9df0bf18';

        ctx.beginPath();

        ctx.arc(
            0, 0, 19,
            0, Math.PI * 2
        );

        ctx.fill();

        ctx.strokeStyle = '#9df0bf55';

        ctx.lineWidth = 1;

        ctx.stroke();

        // Ombra.

        ctx.fillStyle = '#05090c90';

        ctx.beginPath();

        ctx.ellipse(

            0, 17, 13, 3,

            0, 0, Math.PI * 2

        );

        ctx.fill();

        // Invertir el sprite si va a l'esquerra.

        if (player.direction === 'left') {

            ctx.scale(-1, 1);

        }

        ctx.imageSmoothingEnabled = false;

        if (

            umbreonSheet.complete &&
            umbreonSheet.naturalWidth

        ) {

            ctx.drawImage(

                umbreonSheet,

                pose * 48,

                row * 48,

                48, 48,

                -20, -21,

                40, 40

            );

        } else {

            rect(
                -6, -6,
                12, 12,
                '#f1c750'
            );

        }

        ctx.restore();

    }


    // =====================================
    // DIBUIXAR ANTIVIRUS
    // =====================================

    function drawEnemy(e, t) {

        const x = e.px * 40 + 20;
        const y = e.py * 40 + 20;

        ctx.save();

        ctx.translate(x, y);

        const angles = {

            right: 0,

            down: Math.PI / 2,

            left: Math.PI,

            up: -Math.PI / 2

        };

        ctx.rotate(angles[e.direction]);

        ctx.fillStyle = e.alert

            ? '#ff4f553f'

            : '#ff777b16';

        ctx.beginPath();

        ctx.moveTo(0, 0);
        ctx.lineTo(20, -12);
        ctx.lineTo(20, 12);

        ctx.closePath();

        ctx.fill();

        ctx.restore();

        // Cos del robot.

        rect(
            x - 12, y - 8,
            24, 16, '#0b1014'
        );

        rect(
            x - 9, y - 11,
            18, 22, '#49585e'
        );

        rect(
            x - 12, y - 5,
            24, 10, '#7a8a8f'
        );

        rect(
            x - 8, y - 8,
            16, 16, '#25353d'
        );

        rect(
            x - 5, y - 4,
            10, 8, '#a02b38'
        );

        // Ull vermell.

        rect(

            x - 3, y - 2,

            6, 4,

            e.alert
                ? '#fff0e8'
                : '#ff5964'

        );

        rect(
            x - 14, y - 3,
            4, 6, '#ff6f76'
        );

        rect(
            x + 10, y - 3,
            4, 6, '#ff6f76'
        );

    }


    // =====================================
    // DIBUIXAR L'ESCENA COMPLETA
    // =====================================

    function draw(t) {

        drawMap();

        drawExit(t);

        packets.forEach((p, i) => {

            if (!collected.has(i)) {

                drawPacket(p, i, t);

            }

        });

        const actors = [

            player,

            ...enemies

        ];

        // Interpolació del moviment perquè
        // els personatges no vagin a salts.

        for (const a of actors) {

            a.px += (a.x - a.px) * .32;

            a.py += (a.y - a.py) * .32;

            if (Math.abs(a.x - a.px) < .01) {

                a.px = a.x;

            }

            if (Math.abs(a.y - a.py) < .01) {

                a.py = a.y;

            }

        }

        enemies.forEach(e => {

            drawEnemy(e, t);

        });

        drawPlayer(t);

    }


    // =====================================
    // BUCLE PRINCIPAL
    // =====================================

    function loop(now) {

        if (state === 'playing') {

            if (

                now - lastPlayer >= stepMs &&
                (held || queued)

            ) {

                const d = queued || held;

                queued = null;

                lastPlayer = now;

                move(d, now);

            }

            if (state === 'playing') {

                for (const e of enemies) {

                    if (now >= e.next) {

                        enemyMove(e, now);

                        if (contact(now)) break;

                    }

                }

            }

        }

        draw(now);

        frame = requestAnimationFrame(loop);

    }


    // =====================================
    // CONTROLS DEL JUGADOR
    // =====================================

    function press(d) {

        if (state !== 'playing') return;

        held = d;
        queued = d;

        clearPressed();

        document.querySelector(

            `[data-dir="${d}"]`

        ).classList.add('pressed');

    }


    function release(d) {

        if (held === d) {

            held = null;

            clearPressed();

        }

    }


    // =====================================
    // CONTROLS DE TECLAT
    // =====================================

    const keyDirs = {

        ArrowUp: 'up',

        ArrowDown: 'down',

        ArrowLeft: 'left',

        ArrowRight: 'right',

        w: 'up',

        s: 'down',

        a: 'left',

        d: 'right'

    };


    addEventListener('keydown', e => {

        const d =

            keyDirs[e.key] ||

            keyDirs[e.key.toLowerCase()];

        if (d && state === 'playing') {

            e.preventDefault();

            if (!e.repeat) press(d);

        }

        if (

            e.key === 'Escape' &&
            state === 'playing'

        ) {

            pause();

        }

    });


    addEventListener('keyup', e => {

        const d =

            keyDirs[e.key] ||

            keyDirs[e.key.toLowerCase()];

        if (d) release(d);

    });


    // =====================================
    // CONTROLS TÀCTILS
    // =====================================

    document.querySelectorAll('[data-dir]')
        .forEach(b => {

            const d = b.dataset.dir;

            b.addEventListener('pointerdown', e => {

                e.preventDefault();

                b.setPointerCapture(e.pointerId);

                press(d);

            });

            [

                'pointerup',

                'pointercancel',

                'lostpointercapture'

            ].forEach(ev => {

                b.addEventListener(

                    ev,

                    () => release(d)

                );

            });

            b.addEventListener('click', e => {

                if (

                    e.detail === 0 &&
                    state === 'playing'

                ) {

                    queued = d;

                }

            });

        });


    // =====================================
    // BOTONS DEL JOC
    // =====================================

    $('#start').addEventListener(

        'click',

        play

    );

    $('#pause').addEventListener(

        'click',

        pause

    );

    $('#restart').addEventListener(

        'click',

        init

    );


    // Activar o desactivar els sons.

    $('#sound').addEventListener('click', () => {

        soundOn = !soundOn;

        $('#sound').textContent =

            'SONIDO: ' +

            (soundOn ? 'SÍ' : 'NO');

        $('#sound').setAttribute(

            'aria-pressed',

            String(soundOn)

        );

        if (soundOn) beep();

    });


    // Pausar si canvia de pestanya.

    addEventListener('blur', pause);

    document.addEventListener(

        'visibilitychange',

        () => {

            if (document.hidden) pause();

        }

    );


    // =====================================
    // INICI DEL VIDEOJOC
    // =====================================

    init();

    frame = requestAnimationFrame(loop);

})();
