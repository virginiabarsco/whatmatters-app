# WhatMatters · Lo que importa

Un juego serio y emocionante que recompensa nuestra habilidad para ponernos de acuerdo en lo importante.

WhatMatters es una red que crece por invitación, de a tres. Cada árbol nace de una semilla de tres personas que acuerdan su nombre; cada persona abre después su propia tríada, y así el árbol crece. Todo está a la vista: cualquiera puede ver todos los árboles, con los nombres, lo que le importa a cada quien y sus posiciones. Los correos no se muestran.

Forma parte del proyecto *IE: Inteligencia Exponencial*.

## Cómo está hecho

- Una app web de Google Apps Script (`app/Code.gs` y `app/Index.html`) que guarda los datos en una planilla de Google.
- `test/` tiene un simulador de los servicios de Google para probar la app sin publicarla.
- `mapa/` dibuja el fondo de Montevideo a partir de datos abiertos.
- `NOTAS.md` resume el estado del trabajo, las decisiones y cómo publicar.

## Créditos

El mapa de fondo se dibujó con datos abiertos de la Intendencia de Montevideo (límites de barrios y cruces de calles), tomados del repositorio [vierja/geojson_montevideo](https://github.com/vierja/geojson_montevideo). Los datos se publican bajo la Licencia de Datos Abiertos de Uruguay.

## Licencia

Código bajo la licencia GNU Affero General Public License v3.0 (AGPL-3.0). Quien use o modifique este código para ofrecer un servicio tiene que publicar también su código.
