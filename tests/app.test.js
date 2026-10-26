'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const tasks = require('../src/tasks');

const app = createApp();

beforeEach(() => tasks.reset());

describe('GET /health', () => {
  test('responde 200 com o status da aplicação', async () => {
    const resposta = await request(app).get('/health');

    expect(resposta.status).toBe(200);
    expect(resposta.body.status).toBe('ok');
    expect(resposta.body.version).toEqual(expect.any(String));
  });
});

describe('/api/tasks', () => {
  test('lista vazia quando não há tarefas', async () => {
    const resposta = await request(app).get('/api/tasks');

    expect(resposta.status).toBe(200);
    expect(resposta.body.data).toEqual([]);
    expect(resposta.body.stats.total).toBe(0);
  });

  test('cria uma tarefa e devolve 201', async () => {
    const resposta = await request(app)
      .post('/api/tasks')
      .send({ title: 'Apresentar a pipeline', priority: 'alta' });

    expect(resposta.status).toBe(201);
    expect(resposta.body.data).toMatchObject({
      id: 1,
      title: 'Apresentar a pipeline',
      priority: 'alta',
      done: false,
    });
  });

  test('devolve 400 para payload inválido', async () => {
    const resposta = await request(app).post('/api/tasks').send({ title: '' });

    expect(resposta.status).toBe(400);
    expect(resposta.body.erro).toMatch(/obrigatório/);
  });

  test('busca uma tarefa pelo id', async () => {
    const criada = tasks.create({ title: 'Buscar' });
    const resposta = await request(app).get(`/api/tasks/${criada.id}`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.data.title).toBe('Buscar');
  });

  test('devolve 404 para tarefa inexistente', async () => {
    const resposta = await request(app).get('/api/tasks/404');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toMatch(/não encontrada/);
  });

  test('conclui uma tarefa via PATCH', async () => {
    const criada = tasks.create({ title: 'Concluir' });
    const resposta = await request(app).patch(`/api/tasks/${criada.id}/complete`);

    expect(resposta.status).toBe(200);
    expect(resposta.body.data.done).toBe(true);
  });

  test('remove uma tarefa via DELETE', async () => {
    const criada = tasks.create({ title: 'Remover' });

    expect((await request(app).delete(`/api/tasks/${criada.id}`)).status).toBe(204);
    expect(tasks.list()).toHaveLength(0);
  });

  test('filtra a listagem pelo parâmetro done', async () => {
    const feita = tasks.create({ title: 'Feita' });
    tasks.create({ title: 'Pendente' });
    tasks.complete(feita.id);

    const resposta = await request(app).get('/api/tasks?done=true');

    expect(resposta.body.data).toHaveLength(1);
    expect(resposta.body.data[0].title).toBe('Feita');
  });
});

describe('rotas desconhecidas', () => {
  test('devolve 404 com mensagem padrão', async () => {
    const resposta = await request(app).get('/rota/que/nao/existe');

    expect(resposta.status).toBe(404);
    expect(resposta.body.erro).toBe('Rota não encontrada');
  });
});
