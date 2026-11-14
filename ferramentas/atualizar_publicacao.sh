#!/usr/bin/env bash
# Atualiza a branch `publicacao` (espelho do que está no ar) com o samuel-site.zip que acabou de ser publicado.
# Uso: ferramentas/atualizar_publicacao.sh <samuel-site.zip> [--push]
#   NOTA="..."   linha opcional no LEIA-ME (ex.: o que entrou neste pacote)
#   DESDE="AAAA-MM-DD HH:MM -03:00"   quando o pacote entrou no ar (padrão: agora, horário de Brasília)
# 1. Recusa o zip se ele não for idêntico ao que ferramentas/empacotar.sh gera do HEAD.
# 2. git fetch origin publicacao; monta o LEIA-ME.md (o "Pacote atual" anterior vira "Pacote anterior").
# 3. Cria o commit só com objetos do git (hash-object/mktree/commit-tree), pai = origin/publicacao, com
#    samuel-site.zip e LEIA-ME.md. Não mexe em HEAD, index nem pasta de trabalho.
# Sem --push só mostra o commit e o comando de envio; com --push envia (fast-forward da publicacao).
set -euo pipefail
uso() { echo "uso: ferramentas/atualizar_publicacao.sh <samuel-site.zip> [--push]" >&2; exit 2; }
[ $# -eq 1 ] || [ $# -eq 2 ] || uso
zip=$1; push=0
if [ $# -eq 2 ]; then [ "$2" = "--push" ] || uso; push=1; fi
[ -f "$zip" ] || { echo "✗ zip não encontrado: $zip" >&2; exit 2; }
case "$zip" in /*) ;; *) zip="$PWD/$zip" ;; esac
raiz="$(cd "$(dirname "$0")/.." && pwd)"
cd "$raiz"

sha256() { if command -v shasum >/dev/null 2>&1; then shasum -a 256 "$1"; else sha256sum "$1"; fi | cut -d' ' -f1; }
tmp=$(mktemp -d); trap 'rm -rf "$tmp"' EXIT

# 1. o zip tem de ser o git archive do HEAD (mesma lista de caminhos: quem gera é o próprio empacotar.sh)
if ! ferramentas/empacotar.sh "$tmp/esperado.zip" >/dev/null; then
  echo "✗ empacotar.sh falhou: não dá para conferir o zip" >&2; exit 1
fi
commit=$(git rev-parse --short HEAD)
sha=$(sha256 "$zip")
if [ "$sha" != "$(sha256 "$tmp/esperado.zip")" ]; then
  echo "✗ $zip não é o pacote do HEAD ($commit): gere com ferramentas/empacotar.sh no commit publicado" >&2; exit 1
fi

# 2. LEIA-ME
git fetch -q origin publicacao
pai=$(git rev-parse --verify -q "origin/publicacao^{commit}") || { echo "✗ origin/publicacao não existe" >&2; exit 1; }
blob_zip=$(git hash-object -w "$zip")
if [ "$(git rev-parse -q --verify "$pai:samuel-site.zip" || true)" = "$blob_zip" ]; then
  echo "✓ a publicacao já tem este zip ($commit, SHA-256 $sha): nada a fazer"; exit 0
fi
if [ -z "${DESDE:-}" ]; then
  z=$(TZ=America/Sao_Paulo date +%z)
  DESDE="$(TZ=America/Sao_Paulo date '+%Y-%m-%d %H:%M') ${z:0:3}:${z:3:2}"
fi
# "Pacote atual = … desde X:" + linha seguinte (git archive, SHA-256) → "Pacote anterior: …, no ar de X a DESDE."
anterior=$(git show "$pai:LEIA-ME.md" 2>/dev/null | awk -v ate="$DESDE" '
  p { printf "Pacote anterior: %s, no ar de %s a %s.", $0, desde, ate; exit }
  /^Pacote atual = o que está em produção desde / {
    desde = $0; sub(/^Pacote atual = o que está em produção desde /, "", desde); sub(/:$/, "", desde); p = 1 }')
[ -n "$anterior" ] || anterior="Pacote anterior: veja o commit $(git rev-parse --short "$pai") desta branch."
{
  echo "# Branch de publicação"
  echo
  echo "Contém só \`samuel-site.zip\`: os arquivos públicos do site, gerados a partir da \`main\` com \`ferramentas/empacotar.sh\`."
  echo "Não edite aqui: altere a \`main\` e gere o pacote de novo."
  echo
  echo "Pacote atual = o que está em produção desde $DESDE:"
  echo "\`git archive $commit\`, SHA-256 \`$sha\`"
  if [ -n "${NOTA:-}" ]; then echo "$NOTA"; fi
  echo "$anterior"
} > "$tmp/LEIA-ME.md"

# 3. commit fora da pasta de trabalho
blob_leia=$(git hash-object -w "$tmp/LEIA-ME.md")
arvore=$(printf '100644 blob %s\tLEIA-ME.md\n100644 blob %s\tsamuel-site.zip\n' "$blob_leia" "$blob_zip" | git mktree)
msg=$(printf 'Pacote de publicação = produção atual (git archive %s)' "$commit")
# COAUTOR="Nome <email>" acrescenta a linha Co-Authored-By (ex.: quando um agente faz a publicação)
if [ -n "${COAUTOR:-}" ]; then msg=$(printf '%s\n\nCo-Authored-By: %s' "$msg" "$COAUTOR"); fi
novo=$(printf '%s\n' "$msg" | git commit-tree "$arvore" -p "$pai")
echo "✓ commit $novo (pai $(git rev-parse --short "$pai") = origin/publicacao): git archive $commit, SHA-256 $sha"
if [ "$push" -eq 1 ]; then
  git push origin "$novo:refs/heads/publicacao"
else
  echo "  enviar: git push origin $novo:refs/heads/publicacao"
fi
