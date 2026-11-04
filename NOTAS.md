# WhatMatters · nota de traspaso

Para retomar el trabajo en una conversación nueva. Última actualización: 4 de noviembre de 2026 (bloques 1 y 1b publicados, versión 49; **bloque 1c listo para publicar**).

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

- **Principal y prueba:** versión 49 = este repositorio (`app/`). Incluye los bloques 1 y 1b (ver abajo) sobre el diseño anterior: inicio con tres puertas, "Ver la red" con desplegable de árboles + mapa + lista, fondo de Montevideo con datos abiertos, modo claro/oscuro.
- **Migración hecha** (3 nov 2026): en la planilla "Invitada" pasó a "Convocada" (Personas y Quieren sumarse) y las columnas se llaman "Convocó (posición)" y "Fecha de convocatoria". El código sigue leyendo "Invitada" por si aparece alguna fila vieja.
- **Pendiente:** ejecutar `ordenarPlanilla` desde el editor para reescribir la hoja "Cómo se juega". Se decidió hacerlo **después del bloque 2**, para no hacerlo dos veces; la hoja todavía muestra el texto viejo (lema "entrena", "invitación"). Antes, repasar con Opus el texto de la hoja: hay filas que contradicen reglas del bloque 2 (Árbol, Tríadas siguientes, Nombre del árbol/tipo, vencimiento de convocatorias), "Alcance" usa la palabra "nivel", faltan los estados de posición, el estado del árbol dice "tema" en vez de "nombre", y conviene separar lo del juego de lo de las pestañas. En el editor, el selector de funciones: abrirlo y elegir la opción con la herramienta de búsqueda de elementos (find + clic por referencia); hacer scroll dentro de la lista congeló la pestaña.
- Regla de texto: todo con mayúscula inicial en etiquetas y leyendas. La regla 1 del texto de bienvenida ("Se requiere una invitación para empezar") se deja como está.

## Bloque 1c · Aceptada, cifras de la red y Lo que importa (IMPLEMENTADO y publicado, versión 50)

Acordado el 4 nov 2026, implementado y probado en el simulador (regresión sin errores). **Publicado el 4 nov 2026 en la prueba y la principal (versión 50); migrarConvocadas ya se ejecutó ("Activa" pasó a "Aceptada").**

1. Estado de posición **Aceptada** en lugar de Ocupada: leyenda, filtro "Aceptadas", "Todavía no hay posiciones aceptadas". En la planilla el estado "Activa" pasa a "Aceptada" (el código lee los dos).
2. La red hoy: "N personas en M posiciones" (una persona puede estar en varios árboles).
3. Al plantar: "El tema del árbol lo acuerdan las tres personas de la semilla cuando entren. Esta semilla cuenta como uno de tus tres árboles."
4. Tarjeta: "Acordar el tema" / "El tema es Lo que importa a quienes forman el árbol."
5. Tercer árbol (opción A): "Esa persona ya está en tres árboles, que es el máximo. Puede sumarse a este cuando libere uno." (y la variante al plantar).
6. Error al convocar una posición que alguien convocó un instante antes: "Alguien ya convocó a esa posición."
7. **Lo que importa siempre con mayúscula** cuando nombra el concepto; las frases conjugadas se reescriben para usar el nombre ("tu nombre y Lo que importa"). Corregido en la pantalla del código y en la hoja (Entrar, Transparencia, Quieren sumarse). Falta el texto oculto de "Cómo funciona" (se revisa con ese texto).

Pendientes nuevos (4 nov):
- **Botón para irse de un árbol** (bloque 2). Decidido el 4 nov: a las tríadas que convocó se les avisa que esa persona salió y ellas deciden qué hacen; la posición vuelve a "Por convocar" y el grupo se reorganiza para convocarla de nuevo; alguien de la semilla puede irse antes de que se acuerde el tema. Es lo que hace que "Puede sumarse a este cuando libere uno" se pueda cumplir. Reglas aprobadas el 4 nov (propuestas de Claude, aceptadas todas):
  1. Quién convoca la posición vacía: las otras dos personas de la tríada donde está esa posición (si se va la 2, convocan la 1 y la 3). Si se va la persona de una posición, quedan por convocar esa posición y toda su cadena (2.1, 2.1.1…), porque es la misma persona en cada alcance; quien la acepte hereda la cadena.
  2. Convocatorias pendientes que había hecho: siguen valiendo (son convocatorias al árbol, no a la persona).
  3. Si se va la persona 1: la tarea de coordinar los pedidos para sumarse pasa a quien acepte la posición 1 y, mientras tanto, a las otras dos personas de la semilla.
  4. Si se va alguien de la semilla antes de acordar el tema: se borra su acuerdo; la propuesta de tema sigue en pie si la hizo otra persona y se borra si era suya. El tema necesita el acuerdo de las tres personas, incluida la nueva.
  5. Confirmación antes de irse (irse no tiene vuelta atrás; para volver hace falta una convocatoria nueva): "¿Irte de este árbol? Tu posición vuelve a Por convocar."
  6. La restricción actual de la administradora (solo quitar personas sin nadie en sus tríadas) deja de tener sentido y se reemplaza por esta misma lógica.
- Tercer árbol, opción C (más adelante): que la persona apoye el árbol con un cupo de apoyo en lugar de ocupar una posición, cuando existan los apoyos.

## Bloque 1b · tema del árbol y textos de convocatoria (IMPLEMENTADO y publicado, versión 49)

Acordados y publicados el 3 nov 2026. La migración de columnas de Árboles ya se ejecutó.

1. Correo de convocatoria: "X te convocó a su tríada semilla de un árbol nuevo de WhatMatters, en la posición N." + "El tema de este árbol lo acuerdan las tres personas de la semilla." / con tema: "X te convocó a su tríada del árbol «T» de WhatMatters, en la posición N." Después: "Con el botón podés ver la convocatoria." Se sacaron "Si es tu primera vez…" y "Este enlace es personal…".
2. Página de aceptar: título "X te convocó a su tríada"; párrafo "Es la tríada semilla de un árbol nuevo de WhatMatters. Vas a ocupar la posición N con el correo C. El tema de este árbol lo acuerdan las tres personas de la semilla." Si ya está en otro árbol: "Ya estás en otro árbol, así que entrás con los mismos datos que ya están en tu perfil."
3. Ya no aparece "Quiero sumarme a este árbol" cuando hay una convocatoria pendiente a ese árbol.
4. Árbol: **tema** en lugar de nombre en toda la app (inventario de 21 puntos aprobado). Acordar el tema es **de cero**: sin propuesta inicial, campo vacío, lo que importa a cada persona de la semilla se ve como texto. Debajo del título de la tarjeta: "El tema es lo que importa a quienes forman el árbol."
5. Ayuda de Lo que importa: "Al menos una palabra, luego se puede cambiar o ampliar. Puede ser cualquier tema: una idea, una causa, un lugar…"
6. "Ver cómo funciona": la puerta se queda, pero solo muestra "Este espacio está en proceso de redacción. Las dudas y los comentarios son bienvenidos por correo a whatmatters.pro@gmail.com." El texto anterior (reglas, semilla, avisos de privacidad) queda para revisar junto con la hoja "Cómo se juega".
7. Planilla: columnas de Árboles "Nombre" → "Tema" y "Propuesta: nombre" → "Propuesta: tema" (hecho con migrarConvocadas, que hace las dos migraciones y se puede repetir).
8. Código: etiquetas internas acordes al vocabulario: el árbol tiene `tema` (y `titulo` para lo que se muestra, que puede ser "Semilla de…"), la persona `loQueImporta`, la convocatoria `arbolTema`; el modo claro/oscuro se llama `modo`.

Pendientes nuevos:
- Frase que explique que el botón del correo entra sin clave (por ahora no va ninguna).
- **Cambiar el tema de un árbol** (bloque futuro): quién propone, qué umbral (probablemente decisión estructural: dos tercios, persona por persona) y el fork para quien no esté de acuerdo.
- Revisar el texto de "Cómo funciona" y de la hoja "Cómo se juega" como una sola fuente (versión corta y larga).

## Vocabulario acordado

- **Posición** (nunca "lugar" para una posición). Estados: **Aceptada** (antes Ocupada), **Convocada**, **Por convocar**. No se usa "libre" ni "vacía".
- **Alcance:** **En proceso** o **Completo**.
- **Convocar** en todos lados (acción y estado), también en correos y en la planilla.
- **Lo que importa** se escribe siempre con mayúscula cuando nombra el concepto (es también el nombre de la app en castellano).
- **Tema del árbol** = lo que importa a quienes forman el árbol (lo acuerdan las tres personas de la semilla). El árbol no tiene "nombre": el nombre es de la persona. **Lo que importa** = el tema de cada persona.
- **Lugar** = geográfico (lugar del árbol, ciudad, lugar que te gusta). No "zona".
- **Semilla** = alcance 1. **Árbol** = desde que hay al menos una persona en el alcance 2. La semilla pasa a llamarse **tríada base del tronco** cuando se completa el alcance 2.
- Lema: "Un juego serio y emocionante que recompensa nuestra habilidad para ponernos de acuerdo en lo importante." (en compu dos renglones, corte después de "habilidad"; en celular cuatro: "Un juego serio y emocionante / que recompensa nuestra habilidad / para ponernos de acuerdo / en lo importante."). Es una intención del juego, no una promesa inmediata.

## Bloque 1 · textos, colores y filtros (IMPLEMENTADO y publicado, versión 48)

1. Lema nuevo (app y hoja "Cómo se juega").
2. Estados de posición en leyenda, tarjetas, lista y mensajes: Ocupada · Convocada · Por convocar.
3. Filtros de la lista: Todas · Ocupadas · Convocadas · Por convocar.
4. Leyenda: título "Alcance de las posiciones de cada árbol"; frase "El color muestra el alcance y el borde muestra el estado de la posición"; aro punteado "podés convocar".
5. "Tenés N posiciones por convocar" (sin "invitar").
6. Identificador de posición (P1, P2.3…): blanco igual que el nombre cuando la posición está ocupada; gris cuando no (convocadas y por convocar), en mapa y lista.
7. Convocar en todos lados: botón "Convocar", correos ("… te convoca a su tríada en WhatMatters"), hoja.
8. **Migración en la misma subida:** en la planilla, estado "Invitada" → "Convocada" (Personas y Quieren sumarse) y columna "Invitó (posición)" → "Convocó (posición)". El código tiene que leer los dos valores durante la migración.
9. El aviso "Este enlace es personal: conviene no reenviarlo" en el correo de convocatoria queda como está.

## Bloque 2 · reglas del juego (acordado, sin implementar; hacerlo en una conversación nueva con Opus)

0. Con el cambio a tema: "el freno del nombre" pasa a ser **el freno del tema**, y "acordar el nombre pide nombre y lugar" pasa a **tema y lugar**.
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
   - **Un lugar que te guste: opcional.** Texto acordado: "Un lugar que te guste, solo a los efectos de dibujar el mapa del juego. Puede ser una plaza, un parque, una cafetería, etc. No es obligatorio: si preferís no elegir uno, el mapa marca un punto central de la ciudad que elijas, por ejemplo Plaza Independencia si es Montevideo. Siempre se puede cambiar desde Mi perfil."
   - **Punto por defecto:** una lista propia con la plaza principal de cada ciudad donde ya hay gente (Montevideo → Plaza Independencia; Punta del Este → Plaza Artigas), que crece con las ciudades nuevas. Para las demás ciudades, el punto que da el buscador de Google (no siempre es una plaza; verificar dónde cae el de Montevideo).
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

Atajo que funcionó el 3 nov: subir el código a una rama temporal del repositorio y, desde la consola del editor, leerlo con `fetch` de `raw.githubusercontent.com` (funciona desde la página del editor), para no pasar los archivos por la conversación. Hace falta activar "Permitir salida a la red" en Configuración > Capacidades. La lista de versiones del diálogo de implementaciones puede no mostrar la versión recién creada: recargar el editor y volver a abrir el diálogo. Mejor aún: subir los cambios directo a `main` y leerlos desde el editor con la dirección del envío (`raw.githubusercontent.com/…/<commit>/app/…`), así no quedan ramas temporales (desde aquí no se pueden borrar ramas). Pasos completos:

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
