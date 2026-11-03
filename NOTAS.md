# WhatMatters · nota de traspaso

Para retomar el trabajo en una conversación nueva. Última actualización: 3 de noviembre de 2026.

## Cómo trabajamos

- **Primero comentamos, después implementamos.** Ante cada propuesta, dar consideraciones antes de hacer nada.
- **No se publica nada sin un pedido explícito** ("pasalo a la prueba", "pasala a la principal").
- Etapas: **simulación → copia local → implementación de prueba → implementación principal**.
  - La simulación es una página de muestra (no es la app): sirve para decidir diseño y es lo más barato.
  - La copia local es el código en este repositorio, probado con el simulador de Google (`test/`).
  - La prueba y la principal son la misma app publicada con dos enlaces; **comparten la misma planilla y los mismos datos** (lo que se hace en la prueba es real: los correos salen).
- Publicar cuesta muchos pasos: juntar cambios y subir una vez. Para pasar a la principal se apunta a la **misma versión** ya probada.
- Llevar una lista de cambios acordados y mostrarla antes de cada subida.
- Textos de la app sin imperativos. Terminar las respuestas con el enlace relevante.
- Modelos: decidir reglas y diseño → Opus, esfuerzo alto. Aplicar cambios acordados y probar → Sonnet, medio. Publicar → Sonnet, bajo o medio. Abrir una conversación nueva por bloque.

## Enlaces

- App principal: https://script.google.com/macros/s/AKfycbz5JrZew87Yr1pVm9h6yWotEfMl3RbiGMLQRP4g3C7sBgfDi-0wMxtvPyOIA1--4N1dBQ/exec
- App de prueba: https://script.google.com/macros/s/AKfycbwkovsL_-gWgo74ZszytqWGzyP2nZioPtvNda-91HYio5Bz_A5So32rmm0iJWTyJEvO4A/exec
- Editor de Apps Script: https://script.google.com/home/projects/1gRmAUtMbzsFaRUk73aswJ77SluneqjiEB3uUbEZsThEIw43tYNNjzXY4/edit
- Planilla: https://docs.google.com/spreadsheets/d/1RqiKrjwNhJcK7soUsX_vkRyC_eAtIi6konjOEXLU2ng/edit (pestañas Personas, Árboles, Quieren sumarse, Cómo se juega)
- Simulación (página privada de Claude): https://claude.ai/artifact/XUPqUD4o2AahCveaH1YzD9
- Lienzo de diseño (logo, fondo, bocetos): https://claude.ai/artifact/DdxZTSB8qeDSgvs4dMrK9V

## Estado al cierre

- **Principal:** versión 46 (diseño nuevo: logo, modo claro/oscuro, fondo de Montevideo con datos abiertos, puntos con color por alcance).
- **Prueba:** versión 47 = este repositorio (`app/`). Incluye: inicio con tres puertas (Ver cómo funciona · Ver la red · Entrar), portada solo en el inicio, WHATMATTERS lleva al inicio, lema, "Ver la red" con desplegable de árboles + mapa + lista, "posición" en lugar de "lugar" en app, correos y hoja, identificador de posición arriba del nombre en el mapa, mapa del árbol corrido al norte (todo en tierra), fondo con dos árboles nuevos (puerto y zona este), títulos más grandes.
- **Pendiente:** ejecutar `ordenarPlanilla` desde el editor para reescribir la hoja "Cómo se juega" (conviene hacerlo con la próxima subida, cuando el lema nuevo esté en el código). En el editor, el selector de funciones se trabó al usarlo con el navegador automatizado; si vuelve a pasar, pedirle a Virginia que lo haga: elegir `ordenarPlanilla` junto a "Ejecutar" y tocar Ejecutar.

## Vocabulario acordado

- **Posición** (nunca "lugar" para una posición). Estados: **Ocupada**, **Convocada**, **Por convocar**. No se usa "libre" ni "vacía".
- **Alcance:** **En proceso** o **Completo**.
- **Convocar** en todos lados (acción y estado), también en correos y en la planilla.
- **Lugar** = geográfico (lugar del árbol, ciudad, lugar que te gusta). No "zona".
- **Semilla** = alcance 1. **Árbol** = desde que hay al menos una persona en el alcance 2. La semilla pasa a llamarse **tríada base del tronco** cuando se completa el alcance 2.
- Lema: "Un juego serio y emocionante que recompensa nuestra habilidad para ponernos de acuerdo en lo importante." (en compu dos renglones, corte después de "habilidad"; en celular cuatro: "Un juego serio y emocionante / que recompensa nuestra habilidad / para ponernos de acuerdo / en lo importante."). Es una intención del juego, no una promesa inmediata.

## Bloque 1 · textos, colores y filtros (acordado, sin implementar)

1. Lema nuevo (app y hoja "Cómo se juega").
2. Estados de posición en leyenda, tarjetas, lista y mensajes: Ocupada · Convocada · Por convocar.
3. Filtros de la lista: Todas · Ocupadas · Convocadas · Por convocar.
4. Leyenda: título "Alcance de las posiciones de cada árbol"; frase "El color muestra el alcance y el borde muestra el estado de la posición"; aro punteado "podés convocar".
5. "Tenés N posiciones por convocar" (sin "invitar").
6. Identificador de posición (P1, P2.3…): blanco igual que el nombre cuando la posición está ocupada; gris cuando no (convocadas y por convocar), en mapa y lista.
7. Convocar en todos lados: botón "Convocar", correos ("… te convoca a su tríada en WhatMatters"), hoja.
8. **Migración en la misma subida:** en la planilla, estado "Invitada" → "Convocada" (Personas y Quieren sumarse) y columna "Invitó (posición)" → "Convocó (posición)". El código tiene que leer los dos valores durante la migración.
9. El aviso "Este enlace es personal: conviene no reenviarlo" en el correo de convocatoria queda como está.

## Bloque 2 · reglas del juego (acordado, sin implementar)

1. **Convocar sin esperar:** cada persona puede llenar su propia tríada del alcance siguiente apenas entra, sin esperar a que se complete la tríada por la que entró.
   - Se mantiene el **freno del nombre**: hasta que la semilla acuerda el nombre no se abren tríadas siguientes.
   - **Límite de tres alcances:** el alcance N se abre solo si el alcance N−3 está completo (el 4 necesita el 1 completo; el 5, el 2; etc.). Con el freno del nombre, el primer límite que frena de verdad es el 5.
   - Quien quiera convocar en una tríada todavía bloqueada ve por qué ("Se abre cuando se complete el alcance 2").
   - Probar que el mapa siga legible con árboles desparejos (ramas hasta A5 y otras en A2), en celular y compu, y mostrar capturas antes de subir.
2. **Vencimiento de convocatorias:** vencen a los **7 días**; recordatorio automático al **5.º día**; al vencer la posición vuelve a "Por convocar" y quien convocó recibe un aviso (puede convocar de nuevo, incluso a la misma persona). Necesita una tarea programada diaria en Apps Script (se instala ejecutando una función una vez desde el editor). La convocatoria existente a la posición 3.3 es a un correo de Virginia: sirve para probar que vence apenas se active la regla.
3. **Árbol / semilla:** nueva definición (ver vocabulario). Hoy el código marca árbol al completar el alcance 2: cambiarlo.
4. **Subtítulo de cada árbol:** sacar el tipo (temático/geográfico). Mostrar: **alcance completo** (el más alto con todas sus posiciones ocupadas), **alcance en proceso** (el más alto con al menos una persona activa o convocada), **personas** (activas) y **tu posición** (solo si estás en ese árbol). Ejemplo: "Completo: 2 · En proceso: 4 · 12 personas · Tu posición: 1.2".
5. **Lugar del árbol:** sin tipo; nombre y lugar para todos (acordar el nombre pide nombre y lugar). Ajustar las columnas Tipo/Lugar de la hoja Árboles.
6. **Ciudad y lugar de cada persona** (al entrar y en Mi perfil), con el buscador de lugares incorporado de Apps Script (Maps.newGeocoder), sin pegar enlaces de Google Maps:
   - **Ciudad: obligatoria.**
   - **Un lugar que te guste: opcional.** Texto propuesto: "Un lugar que te guste, solo a los efectos de dibujar el mapa del juego. Puede ser una plaza, un parque, una cafetería, etc. No es obligatorio: si preferís no elegir uno, el mapa marca un punto central de la ciudad que elijas, y siempre se puede cambiar desde Mi perfil." (pendiente de confirmar; ver más abajo).
   - Idea de fondo: que cada persona quede georreferenciada a un lugar donde estaría dispuesta a encontrarse, para que el juego potencie el encuentro virtual y presencial.

## Bloque 3 · administración y búsqueda (acordado, sin implementar)

1. **Panel de administración** (solo para la administradora = la cuenta que publicó la app): personas con correo (corregir nombre, quitar de un árbol), convocatorias pendientes (reenviar, cancelar), pedidos de sumarse, y un botón para actualizar la hoja "Cómo se juega" (reemplaza el paso por el editor). Hoy esas herramientas solo aparecen al tocar a una persona en la pestaña Mapa, y no se encuentran fácil.
2. **Un solo buscador** arriba, siempre visible, que busque árboles y personas de toda la red. Resultados agrupados: Árboles (abre el árbol) y Personas (nombre · posición · árbol; abre el árbol y lleva a la persona). Reemplaza "Buscar un árbol" y "Buscar a una persona". El servidor suma un índice con nombre, árbol y posición de cada persona, **sin correos**. Si la red crece a miles de personas, la búsqueda pasa al servidor.

## Para más adelante

- Rediseño visual de los correos.
- Landing en whatmatters.pro (la app de Apps Script no puede usar un dominio propio: landing estática en el dominio + la app sigue en Apps Script). Ícono de la pestaña y crédito a los datos abiertos, ahí.
- Mapa del lugar real de cada árbol (hoy todos muestran Montevideo).
- Mapa con todos los árboles juntos; conversación por árbol; Apoyos; Bosques y micorrizas; Recompensas.

## Cómo probar sin publicar

```
cd test
python3 mkharness.py          # arma test/harness.html con app/ + el simulador de Google
node regresion.js             # prueba de regresión: debe terminar en "ERRS []"
node capturas-visitante.js    # capturas de las pantallas para quien no entró
```
Requiere Node con Playwright y Chromium.

## Cómo publicar en Apps Script (con Claude en Chrome)

1. Abrir el editor. Con JavaScript, agregar un `<input type="file">` oculto (aria-label "wm upload") que guarde el texto del archivo en `window.__wmfile`.
2. Subir el archivo con la herramienta de subida (la ruta tiene que estar bajo el directorio de trabajo).
3. `monaco.editor.getModels()`: `file_1.js` es Código.gs y `file_2.html` es Index.html. Hacer `setValue(window.__wmfile)` en el modelo que corresponde y verificar la suma (`h=(h*31+c.codePointAt(0))>>>0` sobre `for…of`) contra la copia local.
4. Guardar con ctrl+s (si aparece "¿Salir del sitio?", guardar de nuevo); recargar y volver a verificar las sumas.
5. Implementar → Administrar implementaciones. **Fijarse en la descripción** cuál es "principal" y cuál "prueba" (el orden puede cambiar). Lápiz → Versión → "Nueva versión" (o elegir la versión ya probada para la principal) → descripción → Implementar.
6. Verificar el enlace con `?v=N`.

Cuidados: si la pestaña del editor deja de responder a las capturas, cerrarla y abrir otra; el desplegable de funciones del editor no responde bien a la automatización.

## Estructura del repositorio

- `app/` — el código de la app (Código.gs e Index.html), igual al publicado en la prueba.
- `test/` — simulador de los servicios de Google y pruebas automáticas.
- `mapa/` — programas que dibujan el fondo de Montevideo y arman la simulación (`construir.sh`).
- `logo/` — programas del logo.
