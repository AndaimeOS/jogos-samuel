/**
 * No pacote do portal, cada espécie fica num arquivo só (`packs/p-<dex>.bin`).
 * O service worker devolve os caminhos originais (`assets/pokemon/<dex>/…`)
 * antes de qualquer sprite ser pedido. Em desenvolvimento os PNGs continuam soltos.
 */
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  const swUrl = new URL('sw.js', document.baseURI)
  const scope = new URL('./', document.baseURI)
  try {
    await navigator.serviceWorker.register(swUrl, { scope: scope.href })
    if (!navigator.serviceWorker.controller) {
      await new Promise<void>((resolve) => {
        const timer = setTimeout(resolve, 4000)
        navigator.serviceWorker.addEventListener(
          'controllerchange',
          () => {
            clearTimeout(timer)
            resolve()
          },
          { once: true },
        )
      })
    }
  } catch {
    // Sem o worker os sprites empacotados não abrem; o resto do jogo segue.
  }
}

export {}
