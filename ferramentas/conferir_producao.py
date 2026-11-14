#!/usr/bin/env python3
"""Confere se o que está no ar é o conteúdo de um samuel-site.zip (o pacote publicado).

Uso: python3 ferramentas/conferir_producao.py <samuel-site.zip> [--base https://samuel.tech]

O catálogo vem de _app/jogos.json DE DENTRO do zip. Checagens (cada item imprime ✓ ou ✗):
  a) SHA-256 igual entre o zip e o servido para assets/** e robots.txt (exceção abaixo para PNG/JPEG);
  b) jogos "pronto": cada arquivo de _privado/jogos/<slug>/ (fora ocultos) igual ao de /jogo/<slug>/<arquivo>;
  c) 403 em /_privado/jogos/<slug>/<entry> e /_app/jogos.json; 403 ou 404 em /kit/, /docs/,
     /ferramentas/empacotar.sh, /desenvolvimento/ e /.git/HEAD;
  d) 200 em /, /jogos/, /admin/ e /jogar/?jogo=<slug> de cada jogo pronto;
  e) jogos do catálogo fora do "pronto" que têm pasta no zip: /jogo/<slug>/<entry> não pode ser 200.

Só faz GET, sem cookie nem login, com User-Agent genérico. Redirecionamentos NÃO são seguidos: um 3xx vale como o
próprio status (onde se exige 200, 403 ou 404, um 3xx é ✗). Assim nenhuma requisição sai do host da --base.
PNG/JPEG: o CDN da Hostinger (cabeçalho "server: hcdn") recodifica essas imagens, então os bytes servidos nunca
batem com o zip. Para elas, quando a resposta vem do hcdn e o SHA-256 difere, vale "≈": mesmo formato e mesma largura
×altura (lidos do cabeçalho da imagem). Limite: uma troca que preserve formato e dimensões passa; o resumo conta os ≈.
Atenção: o status trocado em /admin (status_site, fora do repositório) pode fazer o ar diferir do catálogo do zip.
Saída: 0 tudo ✓; 1 algum ✗; 2 erro de uso ou zip ilegível."""
import argparse, hashlib, json, sys, zipfile
from concurrent.futures import ThreadPoolExecutor
from urllib.error import HTTPError, URLError
from urllib.parse import quote
from urllib.request import HTTPRedirectHandler, Request, build_opener

AGENTE = "samuel-tech-conferencia/1.0"
TEMPO = 20


class SemRedirecionar(HTTPRedirectHandler):
    def redirect_request(self, *args, **kwargs):
        return None   # o 3xx volta como HTTPError e é tratado como status


ABRIR = build_opener(SemRedirecionar).open


def baixar(url):
    """(status, corpo, servidor) — status None e corpo = mensagem quando a rede falha."""
    try:
        with ABRIR(Request(url, headers={"User-Agent": AGENTE}), timeout=TEMPO) as r:
            return r.status, r.read(), r.headers.get("Server", "")
    except HTTPError as e:
        return e.code, b"", e.headers.get("Server", "") if e.headers else ""
    except (URLError, OSError) as e:
        return None, str(getattr(e, "reason", e)).encode(), ""


def imagem(dados):
    """("png"|"jpeg", largura, altura) lido do cabeçalho, ou None."""
    if dados[:8] == b"\x89PNG\r\n\x1a\n" and len(dados) >= 24:
        return "png", int.from_bytes(dados[16:20], "big"), int.from_bytes(dados[20:24], "big")
    i = 2
    while dados[:2] == b"\xff\xd8" and i + 9 <= len(dados) and dados[i] == 0xFF:
        marca, tam = dados[i + 1], int.from_bytes(dados[i + 2:i + 4], "big")
        if 0xC0 <= marca <= 0xCF and marca not in (0xC4, 0xC8, 0xCC):   # SOFn: altura e largura
            return "jpeg", int.from_bytes(dados[i + 7:i + 9], "big"), int.from_bytes(dados[i + 5:i + 7], "big")
        i += 2 + tam
    return None


def sha(dados):
    return hashlib.sha256(dados).hexdigest()


def oculto(caminho):
    return any(p.startswith(".") for p in caminho.split("/"))


def main():
    ap = argparse.ArgumentParser(description="Confere produção contra um samuel-site.zip.")
    ap.add_argument("zip")
    ap.add_argument("--base", default="https://samuel.tech")
    a = ap.parse_args()
    base = a.base.rstrip("/")
    try:
        z = zipfile.ZipFile(a.zip)
        arquivos = {n: z.read(n) for n in z.namelist() if not n.endswith("/")}
        jogos = json.loads(arquivos["_app/jogos.json"])["games"]
    except (OSError, zipfile.BadZipFile, KeyError, ValueError) as e:
        print(f"✗ zip ilegível ou sem _app/jogos.json: {e}", file=sys.stderr)
        return 2

    def url(caminho):   # caminho do site (com / no começo); quote em cada segmento, query preservada
        p, _, q = caminho.partition("?")
        return base + quote(p, safe="/") + ("?" + q if q else "")

    prontos = [g for g in jogos if g.get("status") == "pronto"]
    fora = [g for g in jogos if g.get("status") != "pronto" and g.get("entry")
            and any(n.startswith(f"_privado/jogos/{g['slug']}/") for n in arquivos)]

    # (grupo, caminho no site, conferência) — conferência recebe (status, corpo) e devolve o erro ou None
    itens = []

    def igual(conteudo):
        esperado, img = sha(conteudo), imagem(conteudo)

        def conferir(st, corpo, servidor):
            if st != 200:
                return f"status {st}"
            if sha(corpo) == esperado:
                return None
            if img and servidor.lower() == "hcdn" and imagem(corpo) == img:
                return "≈"
            return "SHA-256 diferente do zip"
        return conferir

    def status_em(*aceitos):
        return lambda st, corpo, sv: None if st in aceitos else f"status {st}, esperado {'/'.join(map(str, aceitos))}"

    for n in sorted(arquivos):
        if (n.startswith("assets/") or n == "robots.txt") and not oculto(n):
            itens.append(("a) arquivos públicos", "/" + n, igual(arquivos[n])))
    for g in prontos:
        pasta = f"_privado/jogos/{g['slug']}/"
        for n in sorted(arquivos):
            if n.startswith(pasta) and not oculto(n[len(pasta):]):
                itens.append(("b) jogos prontos", f"/jogo/{g['slug']}/{n[len(pasta):]}", igual(arquivos[n])))
    if prontos:
        g = prontos[0]
        itens.append(("c) bloqueios", f"/_privado/jogos/{g['slug']}/{g.get('entry', 'index.html')}", status_em(403)))
    itens.append(("c) bloqueios", "/_app/jogos.json", status_em(403)))
    for c in ["/kit/", "/docs/", "/ferramentas/empacotar.sh", "/desenvolvimento/", "/.git/HEAD"]:
        itens.append(("c) bloqueios", c, status_em(403, 404)))
    for c in ["/", "/jogos/", "/admin/"] + [f"/jogar/?jogo={quote(g['slug'])}" for g in prontos]:
        itens.append(("d) páginas", c, status_em(200)))
    for g in fora:
        itens.append(("e) jogos fora do ar", f"/jogo/{g['slug']}/{g['entry']}",
                      lambda st, corpo, sv: "entregue (200)" if st == 200 else None))

    with ThreadPoolExecutor(8) as ex:
        respostas = list(ex.map(lambda it: baixar(url(it[1])), itens))

    falhas, quase, grupo = 0, 0, None
    for (gr, caminho, conferir), (st, corpo, servidor) in zip(itens, respostas):
        if gr != grupo:
            grupo = gr
            print(gr)
        erro = f"sem resposta: {corpo.decode(errors='replace')}" if st is None else conferir(st, corpo, servidor)
        if erro == "≈":
            quase += 1
            print(f"  ≈ {caminho}: recodificada pelo CDN (hcdn); mesmo formato e dimensões, bytes diferentes")
            continue
        falhas += erro is not None
        print(f"  ✗ {caminho}: {erro}" if erro else f"  ✓ {caminho}")
    print(f"\n{len(itens) - falhas}/{len(itens)} ok em {base}" + (f" ({quase} ≈ imagem do CDN)" if quase else "")
          + (f" — {falhas} ✗" if falhas else ""))
    return 1 if falhas else 0


if __name__ == "__main__":
    sys.exit(main())
