#!/bin/sh
# Arma la simulación (mapa/simulacion.html).
# real.py necesita los datos abiertos de Montevideo (repo vierja/geojson_montevideo) en ../../geojson_montevideo o en $GEOJSON_MVD;
# si no están, se usan los dibujos ya generados (mapa-*.svg, bgs-aerea.json).
cd "$(dirname "$0")"
[ -d "${GEOJSON_MVD:-../../geojson_montevideo}" ] && python3 real.py
python3 arbol.py && python3 extrae.py && python3 page.py
