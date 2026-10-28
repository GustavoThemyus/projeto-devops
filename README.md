# Projeto DevOps: API de Tarefas com esteira CI/CD

[![CI](https://github.com/GustavoThemyus/projeto-devops/actions/workflows/ci.yml/badge.svg)](https://github.com/GustavoThemyus/projeto-devops/actions/workflows/ci.yml)
[![CD](https://github.com/GustavoThemyus/projeto-devops/actions/workflows/cd.yml/badge.svg)](https://github.com/GustavoThemyus/projeto-devops/actions/workflows/cd.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Trabalho da disciplina **Cultura e Práticas DevOps**, do Centro Universitário de João Pessoa (UNIPÊ),
Prof. Israel Cunha, Aula 07 (*Construindo uma Esteira / Pipeline*).

A aplicação é uma API REST simples. O foco do trabalho é a **pipeline**, o **Gitflow**
e o comportamento da esteira quando um estágio falha.

---

## A esteira

Dois workflows separados, para a distinção entre Integração Contínua e Entrega Contínua
ficar visível na aba **Actions**.

### `CI`: Integração Contínua (`.github/workflows/ci.yml`)

Dispara em `push` para `main`, `develop`, `feature/**`, `release/**`, `hotfix/**`
e em todo Pull Request para `main` ou `develop`.

```
                    ┌──────────────────────┐
                    │        lint          │   ESLint
                    │      (ESLint)        │
                    └──────────┬───────────┘
                               │
              ┌────────────────┴────────────────┐
              ▼                                 ▼
   ┌─────────────────────┐          ┌──────────────────────┐
   │        test         │          │       security       │
   │  Jest + cobertura   │          │  npm audit + varredura│
   │  Node 18 e Node 20  │          │  de segredos no código│
   └──────────┬──────────┘          └───────────┬──────────┘
              │                                 │
              └────────────────┬────────────────┘
                               ▼
                    ┌──────────────────────┐
                    │        build         │   docker build
                    │  imagem + smoke test │   + curl /health
                    └──────────────────────┘
```

- `test` e `security` rodam **em paralelo**. Um erro em um não derruba o outro,
  como nos slides 92 e 93.
- `build` tem `needs: [test, security]`. Se qualquer um dos dois falhar, o `build`
  aparece como **skipped** e a esteira para ali, como no slide 97.
- O job `resultado` fecha a execução com um resumo em tabela no Summary do run.

### `CD`: Entrega Contínua (`.github/workflows/cd.yml`)

Dispara em `push` para `main`, em tags `v*.*.*` e manualmente (`workflow_dispatch`).

| Job | O que faz |
|-----|-----------|
| `release` | Autentica no **GHCR**, calcula as tags da imagem e publica `ghcr.io/<usuário>/projeto-devops` |
| `github-release` | Só em tag `v*`: cria a **Release** no GitHub com as notas geradas automaticamente |
| `deploy-pages` | Publica `public/` no **GitHub Pages** |

Toda a autenticação usa o `GITHUB_TOKEN` que o próprio Actions injeta, então **não há
secret para cadastrar**. A versão da aplicação vem da variável de repositório `APP_VERSION`
(Settings → Secrets and variables → Actions → Variables) e, se ela não existir,
cai para a tag do git ou para o `package.json`.

---

## A aplicação

API REST de tarefas, em Node.js + Express, com store em memória.

| Método | Rota | Descrição |
|--------|------|-----------|
| `GET` | `/health` | Status, versão e uptime, usado pelo smoke test da pipeline |
| `GET` | `/api/tasks` | Lista as tarefas (aceita `?done=true` / `?done=false`) |
| `GET` | `/api/tasks/:id` | Busca uma tarefa |
| `POST` | `/api/tasks` | Cria uma tarefa (`{ "title": "...", "priority": "baixa\|media\|alta" }`) |
| `PATCH` | `/api/tasks/:id/complete` | Marca como concluída |
| `DELETE` | `/api/tasks/:id` | Remove a tarefa |

### Rodando localmente

```bash
npm install
npm start           # http://localhost:3000
```

```bash
npm run lint        # ESLint
npm test            # Jest
npm run test:coverage
```

### Rodando com Docker

```bash
docker build -t projeto-devops:local .
docker run --rm -p 3000:3000 projeto-devops:local
curl -s localhost:3000/health
```

### Consumindo a imagem publicada

```bash
docker pull ghcr.io/gustavothemyus/projeto-devops:latest
docker run --rm -p 3000:3000 ghcr.io/gustavothemyus/projeto-devops:latest
```

---

## Gitflow

```
main      ──●──────────────────────●────────────────●──  (tags: v1.0.0, v1.0.1)
             \                    /                /
release       \            ●────●                 /
               \          /                      /
develop     ────●────●───●────────●─────────────●───────
                 \    \           \            /
feature           ●    ●           ●          /
hotfix                                       ●
```

| Branch | Origem | Destino | Workflow disparado |
|--------|--------|---------|--------------------|
| `feature/*` | `develop` | `develop` | CI |
| `release/*` | `develop` | `main` + `develop` | CI |
| `hotfix/*` | `main` | `main` + `develop` | CI |
| `develop` | - | - | CI |
| `main` | - | - | CI + **CD** |
| tag `v*.*.*` | `main` | - | **CD** (imagem + Release + Pages) |

Detalhes e comandos em [`docs/GITFLOW.md`](docs/GITFLOW.md).

O roteiro da apresentação, com os comandos prontos para copiar e a demonstração
de uma stage falhando ao vivo, está em
[`docs/ROTEIRO-APRESENTACAO.md`](docs/ROTEIRO-APRESENTACAO.md).

---

## Estrutura

```
.
├── .github/
│   ├── workflows/ci.yml          # lint → test ∥ security → build
│   ├── workflows/cd.yml          # release (GHCR) → Release + Pages
│   └── pull_request_template.md
├── src/
│   ├── tasks.js                  # regra de negócio
│   ├── app.js                    # rotas Express
│   └── server.js                 # bootstrap
├── tests/
│   ├── tasks.test.js             # unitários
│   └── app.test.js               # integração HTTP (supertest)
├── public/index.html             # página publicada no GitHub Pages
├── docs/
│   ├── GITFLOW.md
│   └── ROTEIRO-APRESENTACAO.md
├── Dockerfile                    # multi-stage, usuário não-root, HEALTHCHECK
├── jest.config.js                # cobertura mínima de 70%
└── eslint.config.js
```

---

## Licença

MIT. Ver [LICENSE](LICENSE).
<!-- demonstracao em sala -->
