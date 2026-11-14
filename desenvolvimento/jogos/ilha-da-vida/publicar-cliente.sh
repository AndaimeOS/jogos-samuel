#!/bin/sh
# Publica o cliente da Ilha da Vida na VPS: extrai www/ da imagem de build, troca o index.html pelo nosso
# (cliente/index.html, com a pasta da versão) e envia para /opt/vida/www (servido pelo nginx em /vida/jogo/).
# Uso: desenvolvimento/jogos/ilha-da-vida/publicar-cliente.sh [imagem]   (padrão: luanti-wasm:samuel)
set -eu
IMG=${1:-luanti-wasm:samuel}
VPS=${VPS:-root@srv2114451.hstgr.cloud}   # chave SSH dedicada em ~/.ssh/samuel_tech_vps
AQUI=$(cd "$(dirname "$0")" && pwd)
TMP=$(mktemp -d)
trap 'rm -rf "$TMP"; docker rm -f ilha-vida-extrai >/dev/null 2>&1 || true' EXIT
docker create --name ilha-vida-extrai "$IMG" >/dev/null
docker cp ilha-vida-extrai:/luanti-wasm/www "$TMP/www"
VERSAO=$(cd "$TMP/www" && ls -d */ | head -1 | tr -d /)
[ -n "$VERSAO" ] && [ -f "$TMP/www/$VERSAO/luanti.wasm" ] || { echo "build sem luanti.wasm" >&2; exit 1; }
sed "s/%__RELEASE_UUID__%/$VERSAO/g" "$AQUI/cliente/index.html" > "$TMP/www/index.html"
find "$TMP/www" -name .htaccess -delete          # o nginx não lê .htaccess; os cabeçalhos estão na conf
echo "versão $VERSAO:"; (cd "$TMP/www" && find . -type f -exec ls -l {} \; | awk '{print $5, $9}')
rsync -az --delete -e "ssh -i $HOME/.ssh/samuel_tech_vps" "$TMP/www/" "$VPS:/opt/vida/www/"
ssh -i "$HOME/.ssh/samuel_tech_vps" "$VPS" 'chown -R root:root /opt/vida/www && chmod -R a+rX,go-w /opt/vida/www'
echo "publicado em https://srv2114451.hstgr.cloud:8443/vida/jogo/"
