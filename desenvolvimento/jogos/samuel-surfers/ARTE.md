# Arte — Samuel Surfers

A v1 joga no estilo **Blocos**: modelos low-poly feitos em código (`src/modelos.js`),
cor sólida, no mesmo espírito do `GameScene.ts` do MetroDash. O estilo **Pixel**
(billboard com as folhas do Gerador) existe no menu e só carrega os PNG dele.
A escolha fica em `localStorage` na chave `samuel-surfers:estilo` (`blocos` ou `pixel`).
O padrão é `blocos`. Trocar de estilo descarta o outro: o 3D não pede PNG.
O Pixel usa as folhas dos personagens e dos obstáculos, e o cenário (trilhos,
árvores, postes e prédios) é o mesmo dos Blocos.

Os números abaixo estão em `src/config.ts` e `src/contrato-arte.ts`. Se este texto
divergir, vale o código.

## Respostas ao Gerador

### Folha pixel

1. **Billboard (A) ou low-poly (B)?** Os dois cabem no MetroDash. A v1 completa é o
   **B em código** (mais perto da demo e sem GLB). O **A** fica no botão Pixel:
   `THREE.Sprite`, `NearestFilter`, `alphaTest: 0.5`, sem mipmap. Samuel 32×48 vira
   2,27 × 3,4 unidades; o Doguinho, 1,7.

2. **Formato do corredor.** Uma folha horizontal por personagem, não um PNG por
   animação e não um atlas misturado com a UI.
   - `arte/personagens/samuel-costas.png` — 9 quadros de 32×48, nesta ordem:
     `parado_0`, `correr_0`, `correr_1`, `correr_2`, `correr_3`, `pular_0`,
     `rolar_0`, `rolar_1`, `tropecar_0`.
   - `arte/personagens/doguinho-costas.png` — 6 quadros de 24×24:
     `correr_0`, `correr_1`, `correr_2`, `correr_3`, `pular_0`, `tropecar_0`.
   Correr usa os quadros `correr_*` a 10 fps. O Doguinho não rola.

3. **Atlas.** Se for reempacotar, no máximo **512×512**, um atlas por tipo
   (personagens numa folha, obstáculos em outra, UI fora do WebGL). O código de
   hoje lê as folhas horizontais como estão. Elas não são potência de 2; funciona
   porque o wrap é clamp e o mipmap está desligado.

4. **32×48 e 24×24.** Sim. Quadros: Samuel corre em 4, pula em 1, rola em 2,
   tropeça em 1, parado em 1. Doguinho corre em 4, pula em 1, tropeça em 1.

5. **Escala.** A faixa (centro a centro) tem **3,1** unidades, como na demo.
   O modelo do Samuel tem cerca de 2 unidades e o pé em y = 0. Na pista ele entra
   com escala **1,15** (cerca de 2,3), não 1,7: a câmera ficou mais alta e mais
   atrás (`cameraY` 9,2, `cameraZ` −16, olhando para z = 22) para o obstáculo
   aparecer cerca de 1,5 s antes. O Doguinho continua à direita de quem corre
   para +z, em x − 1,9 e z − 0,8, com escala 1,05.

6. **Obstáculos.** No estilo Blocos, caixas e primitivos em código, cor sólida,
   sem PNG de face e sem glTF na hora de jogar. No estilo Pixel, a face usa o PNG
   do Gerador (`barreira-pular`, `barreira-rolar`, `cone`, `vagao`) num box com
   nearest. glTF não entra na v1.

7. **HUD e menu.** HTML/CSS por cima do canvas. Não ficam dentro do Three.js.

8. **Toque.** Os botões de faixa, pulo, rolagem, pausa e tela cheia têm **76 px CSS**
   nos dois sentidos. No iPad, 1 px CSS = 1 pt, então são 76 pt (o mínimo do portal
   é 44). O JOGAR é mais largo (168×76). A arte de 32 px e 24 px da folha pixel não
   é o botão: o botão é SVG nosso, desenhado no HTML.

9. **Trem em movimento.** Não entra na v1. O bondinho é um obstáculo parado:
   troca de faixa. Não precisa da versão de frente com faróis.

### Caminho 3D

1. **Código, não GLB.** Um arquivo, `src/modelos.js`, no jeito do `GameScene.ts`
   do MetroDash (primitivos, Lambert/Standard, `flatShading`). Sem Draco, sem
   meshopt, sem `GLTFLoader`. Os GLB da folha conferem com esse código e ficam de
   fora do pacote. O pedaço dos modelos sai com cerca de 6 KB gzip, em cima do
   three.js (cerca de 142 KB gzip), e só é baixado no estilo Blocos.

2. **Orçamento por quadro no iPad (gen 7).** Teto de **20 000 triângulos** e
   **120 draw calls**, sem sombra de mapa e com `pixelRatio` no máximo 1,25.
   Contas da folha: Samuel 496, Doguinho 168, bondinho 624, segmento 720.
   No WebKit com perfil de iPad, a corrida ficou em torno de **14 mil triângulos**
   e **76 chamadas**. Os dormentes são `InstancedMesh`. As moedas também.
   O miolo do segmento (trilhos, muro, poste, árvore, prédio) é fundido com
   `mergeGeometries`. A cidade de 68 prédios da prévia não entra; cada faixa leva
   poucos prédios já dentro da malha fundida.

3. **Animação.** Em código, girando grupos. Sem esqueleto e sem clip do glTF.
   Nomes: `corpo`, `cabeca`, `bracoE`, `bracoD`, `pernaE`, `pernaD`. No Doguinho,
   `corpo`, `pata0`…`pata3` e `rabo`. Poses: `parado`, `correr`, `pular`, `rolar`,
   `tropecar`. Rolar dobra os membros e desce o corpo; não é um clip.

4. **Cor sólida.** Sem atlas de 256 ou 512. Cada cor é um material Lambert ou
   Standard com `flatShading`, guardado por cor. Não há textura para filtrar.

5. **Escala.** Faixa de 3,1 confirmada. O pé continua em y = 0. Na pista a escala
   do Samuel é 1,15 (cerca de 2,3) e a câmera está mais alta e atrás, para a
   criança ver a pista. A faixa começa atrás da câmera (`pistaRecuo` −12), e um
   plano de pedra em y = −0,45 cobre o que sobra, para o chão chegar até a borda
   de baixo no retrato. O Doguinho fica à direita (x − 1,9, z − 0,8), escala 1,05.

6. **Sombra falsa.** Sim. Um disco escuro debaixo de cada um
   (`MeshBasicMaterial`, sem escrever profundidade). `shadowMap` fica desligado,
   como na demo.

7. **HUD.** HTML/CSS, 76 px nos dois sentidos. O teste de retrato mede
   esquerda, direita, pulo, rolagem, pausa e tela cheia com pelo menos 76×76.

8. **Trem em movimento.** Não. O bondinho parado é o obstáculo longo da v1.
