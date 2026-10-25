# Changelog

Formato baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.1.0/)
e versionamento [SemVer](https://semver.org/lang/pt-BR/).

## [Não publicado]

## [1.0.0] — 2026-10-27

### Adicionado

- API REST de tarefas: listagem com filtro por status, busca por id, criação,
  conclusão e remoção.
- Endpoint `/health` com status, versão e uptime.
- Suíte de testes com Jest e supertest, cobertura mínima de 70%.
- `Dockerfile` multi-stage com usuário não-root e `HEALTHCHECK`.
- Workflow de CI: `lint` → (`test` ∥ `security`) → `build` com smoke test do container.
- Workflow de CD: publicação da imagem no GHCR, criação da Release e deploy no GitHub Pages.
- Página estática publicada no GitHub Pages.
