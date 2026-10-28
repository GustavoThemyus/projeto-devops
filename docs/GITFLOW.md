# Gitflow neste projeto

## As branches

| Branch | Vida | Origem | Destino | Workflow |
|--------|------|--------|---------|----------|
| `main` | permanente | - | - | CI + **CD** |
| `develop` | permanente | `main` | - | CI |
| `feature/*` | temporária | `develop` | `develop` | CI |
| `release/*` | temporária | `develop` | `main` **e** `develop` | CI |
| `hotfix/*` | temporária | `main` | `main` **e** `develop` | CI |
| tag `v*.*.*` | - | `main` | - | **CD** (GHCR + Release + Pages) |

Regra prática: **só a `main` entrega**. Toda a integração acontece na `develop`,
e nenhuma branch de trabalho vive mais do que o necessário.

## O grafo deste repositório

```
main      ──●──────────────────────●────────────────●──  v1.0.0, v1.0.1
             \                    /                /
release       \            ●────●                 /
               \          /                      /
develop     ────●────●───●────────●─────────────●───────
                 \    \           \            /
feature           ●    ●           ●          /
hotfix                                       ●
```

Para ver o grafo real:

```bash
git log --graph --oneline --all --decorate
```

## Comandos de cada fluxo

### Feature

```bash
git checkout develop
git pull
git checkout -b feature/nome-da-feature
# ... código + testes ...
git add -A && git commit -m "feat: descrição curta"
git push -u origin feature/nome-da-feature
# abrir Pull Request para develop, esperar o CI ficar verde, e fazer o merge
```

### Release

```bash
git checkout develop && git pull
git checkout -b release/1.1.0
npm version 1.1.0 --no-git-tag-version
# atualizar o CHANGELOG.md
git commit -am "chore(release): prepara a versão 1.1.0"
git push -u origin release/1.1.0

# depois do CI verde, fechar a release:
git checkout main && git merge --no-ff release/1.1.0 -m "release: versão 1.1.0"
git tag -a v1.1.0 -m "Versão 1.1.0"
git push origin main --follow-tags            # <- dispara o CD

git checkout develop && git merge --no-ff release/1.1.0 -m "chore: traz a 1.1.0 de volta para develop"
git push origin develop
git branch -d release/1.1.0
```

### Hotfix

```bash
git checkout main && git pull
git checkout -b hotfix/descricao-do-bug
# ... correção + teste que reproduz o bug ...
git commit -am "fix: descrição da correção"

git checkout main && git merge --no-ff hotfix/descricao-do-bug -m "hotfix: descrição"
git tag -a v1.0.2 -m "Versão 1.0.2"
git push origin main --follow-tags            # <- dispara o CD

git checkout develop && git merge --no-ff hotfix/descricao-do-bug -m "chore: traz o hotfix para develop"
git push origin develop
```

## Convenção de mensagens de commit

[Conventional Commits](https://www.conventionalcommits.org/pt-br/), porque o job
`github-release` usa `--generate-notes` e as mensagens viram as notas da Release.

| Prefixo | Uso |
|---------|-----|
| `feat:` | nova funcionalidade |
| `fix:` | correção de bug |
| `test:` | apenas testes |
| `docs:` | apenas documentação |
| `ci:` | mudanças na esteira |
| `chore:` | manutenção, versão, dependências |
