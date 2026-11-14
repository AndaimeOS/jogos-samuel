#!/usr/bin/env bash
# Gera samuel-site.zip só com os arquivos do site (a partir do último commit).
# Fica de fora: kit/, ferramentas/, docs e arquivos do repositório.
# Uso: ferramentas/empacotar.sh [saída.zip]   (padrão: samuel-site.zip na raiz; atualizar_publicacao.sh usa a saída)
# Antes de empacotar roda o verificar_jogo.py --todos e recusa se ele falhar. O verificador lê a pasta de trabalho
# e o zip sai do HEAD: por isso avisa quando há mudança não commitada.
set -euo pipefail
raiz="$(cd "$(dirname "$0")/.." && pwd)"
saida="${1:-$raiz/samuel-site.zip}"
case "$saida" in /*) ;; *) saida="$PWD/$saida" ;; esac
cd "$raiz"

if ! python3 ferramentas/verificar_jogo.py --todos; then
  echo "✗ verificar_jogo.py --todos falhou: nada foi empacotado" >&2
  exit 1
fi
if [ -n "$(git status --porcelain)" ]; then
  echo "⚠ árvore suja: o zip usa o último commit; mudanças não commitadas ficam de fora" >&2
fi

git archive --format=zip -o "$saida" HEAD \
  .htaccess index.php 404.php jogo.php capa.php robots.txt \
  _app _privado assets entrar exploradores jogos jogar conta sair admin

if command -v shasum >/dev/null 2>&1; then sha=$(shasum -a 256 "$saida" | cut -d' ' -f1)
else sha=$(sha256sum "$saida" | cut -d' ' -f1); fi
echo "✓ $saida ($(du -h "$saida" | cut -f1))"
echo "  commit  $(git rev-parse --short HEAD)"
echo "  SHA-256 $sha"
