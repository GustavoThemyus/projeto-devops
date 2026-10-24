# Roteiro da apresentação

Tempo total: **8 a 12 minutos**. Todos os comandos estão prontos para copiar e colar.

> **Antes de começar**
> - Duas abas abertas: a aba **Actions** do repositório e a **página do Pages**.
> - Um terminal já dentro da pasta do projeto, com `git status` limpo.
> - A esteira leva ~1 a 2 minutos por execução. Dispare o passo 3 **antes** de
>   começar a falar sobre a arquitetura, para que a pipeline esteja rodando enquanto
>   você explica.

---

## 1. Abertura — o repositório e o Gitflow (1 min)

Mostre o grafo de branches já construído:

```bash
git log --graph --oneline --all --decorate | head -30
```

```bash
git branch -a && git tag
```

**O que dizer:** `main` é produção e só recebe merge via `release/` ou `hotfix/`;
`develop` é a branch de integração; o histórico já tem duas versões entregues
(`v1.0.0` e `v1.0.1`), sendo a segunda um hotfix.

---

## 2. A esteira no papel (1 min)

Abra `.github/workflows/ci.yml` e aponte três coisas:

1. O gatilho `on:` — a esteira roda em toda branch do Gitflow e em todo Pull Request.
2. `needs:` — `test` e `security` dependem de `lint`, e rodam **em paralelo** entre si.
3. `build` tem `needs: [test, security]` — **é aqui que a pipeline para se algo falhar.**

Depois abra `.github/workflows/cd.yml` e mostre que ele só dispara de `main` e de tags.

---

## 3. Gitflow ao vivo — criando uma feature (2 min)

```bash
git checkout develop
git checkout -b feature/exportar-tarefas
```

### Código para colar

**Em `src/tasks.js`** — adicione a função antes do `module.exports`:

```js
function toCsv() {
  const cabecalho = 'id,titulo,prioridade,concluida';
  const linhas = tasks.map(
    (task) => `${task.id},"${task.title.replace(/"/g, '""')}",${task.priority},${task.done}`,
  );
  return [cabecalho, ...linhas].join('\n');
}
```

E inclua `toCsv` na lista do `module.exports`.

**Em `src/app.js`** — a rota precisa vir **antes** de `/api/tasks/:id`,
senão o Express trata `export` como um id (bom ponto para comentar em voz alta):

```js
  app.get('/api/tasks/export', (req, res) => {
    res.type('text/csv').send(tasks.toCsv());
  });
```

**Em `tests/app.test.js`** — adicione no fim do arquivo:

```js
describe('GET /api/tasks/export', () => {
  test('exporta as tarefas em CSV', async () => {
    tasks.create({ title: 'Exportar' });

    const resposta = await request(app).get('/api/tasks/export');

    expect(resposta.status).toBe(200);
    expect(resposta.headers['content-type']).toMatch(/text\/csv/);
    expect(resposta.text).toContain('id,titulo,prioridade,concluida');
    expect(resposta.text).toContain('Exportar');
  });
});
```

### Enviar

```bash
npm test
git add -A
git commit -m "feat: exporta a lista de tarefas em CSV"
git push -u origin feature/exportar-tarefas
```

Vá para a aba **Actions**: a esteira já está rodando na branch de feature.
Enquanto roda, abra o Pull Request para `develop` e mostre os checks aparecendo no PR.

---

## 4. O ponto alto — quebrando a esteira de propósito (3 min)

> Este é o comportamento do slide 97: *"o pipeline é parado por qualquer erro em
> alguma das stages"*.

Em `src/tasks.js`, localize a linha marcada com o comentário `// DEMO:` e **remova o
`.trim()`**:

```bash
sed -i 's/typeof title !== .string. || title.trim().length === 0/typeof title !== '"'"'string'"'"' || title.length === 0/' src/tasks.js
grep -n "title.length === 0" src/tasks.js
```

Confirme que o teste quebra localmente antes de subir:

```bash
npm test          # deve falhar em "rejeita título composto apenas por espaços"
```

```bash
git commit -am "fix: simplifica a validação de título"
git push
```

**Na aba Actions, mostre:**

- `lint` ✅ verde
- `test` ❌ vermelho — e abra o log para mostrar a mensagem do Jest
- `security` ✅ verde — **o erro no `test` não derrubou o `security`**, eles são independentes
- `build` ⏭️ **skipped** — a stage de deploy nunca chegou a existir
- No PR: o merge fica **bloqueado**

**A frase da apresentação:** *"o código quebrado não chegou nem perto de virar
imagem Docker — a esteira barrou antes."*

### Desfazendo

```bash
git revert --no-edit HEAD
git push
```

A esteira roda de novo e volta a ficar verde. Agora o PR pode ser mesclado.

---

## 5. Merge da feature e fechamento da release (3 min)

Mescle o Pull Request pela interface do GitHub (botão **Merge pull request**),
ou pelo terminal:

```bash
git checkout develop
git merge --no-ff feature/exportar-tarefas -m "feat: exporta a lista de tarefas em CSV"
git push origin develop
```

Abra a branch de release:

```bash
git checkout -b release/1.1.0
npm version 1.1.0 --no-git-tag-version
git commit -am "chore(release): prepara a versão 1.1.0"
git push -u origin release/1.1.0
```

Feche a release na `main` e crie a tag — **é a tag que dispara a entrega**:

```bash
git checkout main
git merge --no-ff release/1.1.0 -m "release: versão 1.1.0"
git tag -a v1.1.0 -m "Versão 1.1.0 - exportação em CSV"
git push origin main --follow-tags
```

E traga a release de volta para a `develop` (passo que muita gente esquece):

```bash
git checkout develop
git merge --no-ff release/1.1.0 -m "chore: traz a 1.1.0 de volta para develop"
git push origin develop
git branch -d release/1.1.0
```

---

## 6. A entrega acontecendo (2 min)

Na aba **Actions**, agora rodando o workflow **CD**:

| Onde olhar | O que mostrar |
|------------|---------------|
| Job `release` | O `docker build` e o push para o GHCR |
| Aba **Packages** do repositório | A imagem `projeto-devops` com as tags `1.1.0`, `1.1`, `latest` |
| Aba **Releases** | A Release `v1.1.0` criada automaticamente, com as notas geradas dos commits |
| Página do **GitHub Pages** | Atualizada pelo job `deploy-pages` |

Se quiser fechar com chave de ouro, rode a imagem publicada na frente da turma:

```bash
docker run --rm -p 3000:3000 ghcr.io/SEU-USUARIO/projeto-devops:1.1.0
```

```bash
curl -s localhost:3000/health
```

---

## 7. Fechamento (30 s)

Volte para a aba **Actions** e mostre o histórico completo de execuções: as verdes,
a vermelha da demonstração e a entrega final. Depois, o grafo:

```bash
git log --graph --oneline --all --decorate | head -40
```

**Fechamento:** *"a esteira roda em toda branch, barra o que não passa nos testes,
e só o que chega na `main` com uma tag de versão vira imagem publicada e deploy."*

---

## Se algo der errado na hora

| Problema | Saída |
|----------|-------|
| A esteira está demorando | Mostre um run **anterior** já concluído — o histórico conta a mesma história |
| Sem internet | `npm test` e `docker build -t projeto-devops:local .` rodam offline; mostre o YAML e explique |
| O job de Pages falha | Em **Settings → Pages**, *Source* precisa estar em **GitHub Actions** |
| O push da imagem falha com 403 | Em **Settings → Actions → General**, marque *Read and write permissions* |
| Esqueceu de reverter a quebra | `git revert --no-edit HEAD && git push` |
