# C.U.M. — Versió amb credencials (HTML + CSS + JavaScript)

Aquesta versió afegeix una **pantalla d'identificació** entre l'animació inicial i la terminal principal. No requereix Node.js, React ni cap instal·lació.

## 1. Com executar-la

1. Descomprimeix el ZIP.
2. Entra a `CUM-web-credenciales`.
3. Obre `index.html` amb Chrome o el navegador que vulguis.

**Ordre de pantalles:** connexió animada → credencials → terminal de l'agent → missió en espera.

## 2. Credencials de prova

- **Identificador:** `CUM-001`
- **Clau:** `4172`

Introdueix-les als dos camps i prem «VERIFICAR IDENTIDAD». Si t'equivoques, veuràs «ACCESO DENEGADO» i podràs reintentar-ho.

La web recorda que ja t'has identificat al mateix navegador; per tornar a provar el formulari, prem **CERRAR SESIÓN** a la terminal principal. Si l'has provat amb una versió anterior i has guardat dades, també pots esborrar les dades del lloc web.

## 3. Personalitzar la targeta

Obre `config.js` amb Visual Studio Code o el Bloc de notes i canvia:

```js
agent: 'AGENTE [NOMBRE]',
expediente: 'OP-001',
idAgente: 'CUM-001',
claveAcceso: '4172',
desbloqueo: ''
```

Quan imprimeixis la targeta amb el QR, posa-hi l'**identificador i la clau** perquè ella pugui introduir-los a la terminal. No es tracta d'una contrasenya personal ni de seguretat real; és part de la gincana.

Si configures l'hora del desbloqueig, utilitza el format `2026-12-12T11:00:00+01:00` (hivern peninsular) o `+02:00` (estiu peninsular). Deixar `desbloqueo: ''` manté el primer minijoc bloquejat.

## 4. Provar el desbloqueig

Afegeix `?demo=1` al final de la URL de `index.html` i prem Retorn. Després d'entrar amb les credencials, al peu de la terminal apareixerà un botó «SIMULAR DESBLOQUEIG» per provar la fase següent.

## 5. Estructura del projecte

- `index.html`: pantalla de connexió, formulari de credencials i terminal.
- `styles.css`: disseny responsive i animacions.
- `app.js`: verificació, sessió local, rellotge i desbloqueig.
- `config.js`: dades de la protagonista, codis i data.

## 6. Publicar a GitHub Pages

Puja aquests quatre fitxers a l'arrel d'un repositori i configura **Settings → Pages → Deploy from a branch → main / (root)**. El QR haurà d'enllaçar a la URL definitiva de GitHub Pages. No cal compilar res.

**Nota de privacitat:** GitHub Pages públic exposa el codi i els valors de `config.js`; les credencials només són part del joc. No hi posis contrasenyes personals ni dades sensibles de la teva amiga.

## 7. Pròxim pas

La triangulació i el minijoc d'Eevee encara no estan implementats. Per ara la fase disponible després del desbloqueig és un primer informe provisional.
