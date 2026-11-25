# Anamnese NutriPro

PWA **offline-first** de Anamnese Nutricional Clínica e Solicitação de Exames. Zero-build (HTML5 + CSS3 + JavaScript ES Modules puros), sem backend, sem CDN. Todos os dados ficam no `localStorage` do navegador.

## Recursos

- 9 abas: Identificação, História Clínica, Gastrointestinal (Escala de Bristol com 7 SVGs + Modo Paciente em tela cheia), Rotina, Comportamento/Hidratação/Frequência, Recordatório 24h, Antropometria (IMC, variação ponderal, RCQ, RCE, CMB, Σ4DC, histórico), Exames (registro longitudinal com ~40 exames + gerador de solicitação com combos) e Diagnóstico/Conduta/Evolução.
- Autosave a cada alteração, progresso por aba, vários pacientes, retorno/duplicação, busca.
- Backup/restauração em JSON, paciente exemplo, modo claro/escuro.
- Copiar resumo para prontuário (campos vazios omitidos).
- Impressão A4 separada: Anamnese e Solicitação de Exames (`body.print-mode-anamnese` / `body.print-mode-exames`).
- Configurações do profissional/clínica aplicadas nos cabeçalhos e rodapés.

## Estrutura

```
index.html  manifest.json  sw.js  README.md
css/styles.css  css/print.css
js/state.js  js/calculations.js  js/bristol.js  js/exams-data.js  js/export.js  js/app.js
icons/
```

## Publicar no GitHub Pages

1. Suba o conteúdo desta pasta na raiz da branch `main`.
2. Em **Settings → Pages**, escolha *Deploy from a branch* → `main` / `/ (root)`.
3. Acesse `https://<usuario>.github.io/<repositorio>/` e instale pelo navegador ("Instalar app").

Todos os caminhos são relativos, então funciona em subpastas do GitHub Pages.

## Testar localmente

Módulos ES e Service Worker exigem HTTP (não `file://`):

```
python -m http.server 8080
```

Abra `http://localhost:8080`.

## Atualizações e cache

O Service Worker usa **Network-First com fallback para cache**: online, sempre busca a versão mais nova; offline, usa o cache. Ao adicionar arquivos, inclua-os em `ASSETS` no `sw.js` e incremente `CACHE`.

## Observações clínicas

- IMC: adulto 20–59 anos (OMS), idoso ≥ 60 (Lipschitz); < 20 anos exibe alerta para Escore-Z/Curvas OMS.
- RCQ de risco: ≥ 0,90 (M) / ≥ 0,85 (F). RCE de risco: ≥ 0,50. CC: aumentada ≥ 94/80 cm, muito aumentada ≥ 102/88 cm (M/F).
- CMB = CB − 0,314 × DT(mm). Meta hídrica = 35 ml/kg. Alerta de sarcopenia: idoso com CP ≤ 33 (F) / 34 (M) cm.
- Ferramenta de apoio: não substitui o julgamento clínico do profissional.

## Privacidade

Nenhum dado é enviado a servidores. Faça backups periódicos (Exportar Backup) — limpar os dados do navegador apaga as fichas.
