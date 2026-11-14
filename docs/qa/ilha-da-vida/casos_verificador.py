import subprocess, sys, os
S = sys.argv[1]; U = "https://srv2114451.hstgr.cloud:8443/vida/jogo/"
casos = {
 "ok_card_real": (open(sys.argv[2]).read(), 0),
 "neg_blank": (f'<a href="{U}" target="_blank">x</a>', 1),
 "neg_sem_target": (f'<a href="{U}">x</a>', 1),
 "neg_outra_url": ('<a href="https://outro.exemplo.com/" target="_top">x</a>', 1),
 "neg_script_src": ('<script src="https://cdn.exemplo.com/x.js"></script>', 1),
 "neg_script_mesma_url": (f'<script src="{U}"></script>', 1),
 "neg_iframe_mesma_url": (f'<iframe src="{U}"></iframe>', 1),
 "neg_prefixo": (f'<a href="{U}x" target="_top">x</a>', 1),
 "neg_style_na_tag": (f'<a href="{U}" target="_top" style="background:url(https://cdn.exemplo.com/x.png)">x</a>', 1),
 "neg_onclick_na_tag": (f'<a href="{U}" target="_top" onclick="fetch(\'https://evil.exemplo.com/x\')">x</a>', 1),
 "neg_dentro_script": (f'<script>var s=\'<a href="{U}" target="_top">\';fetch(\'https://evil.exemplo.com/x\')</script>', 1),
 "neg_data_target": (f'<a href="{U}" data-target="_top">x</a>', 1),
 "neg_data_href": (f'<a data-href="{U}" target="_top">x</a>', 1),
 "neg_href_antes_tag": (f'<link href="https://cdn.exemplo.com/a.css"><a href="{U}" target="_top">x</a>', 1),
}
falhas = 0
for nome, (html, esperado) in casos.items():
    open(os.path.join(S, "_privado/jogos/ilha-da-vida/index.html"), "w").write(html)
    r = subprocess.run([sys.executable, "-I", os.path.join(S, "ferramentas/verificar_jogo.py"), "ilha-da-vida"], capture_output=True, text=True)
    ok = r.returncode == esperado
    falhas += not ok
    print(("OK  " if ok else "FALHA"), nome, "rc=", r.returncode)
print("falhas:", falhas)
