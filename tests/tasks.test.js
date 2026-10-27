'use strict';

const tasks = require('../src/tasks');

beforeEach(() => tasks.reset());

describe('criação de tarefas', () => {
  test('cria uma tarefa com os valores padrão', () => {
    const tarefa = tasks.create({ title: 'Estudar pipelines' });

    expect(tarefa.id).toBe(1);
    expect(tarefa.title).toBe('Estudar pipelines');
    expect(tarefa.priority).toBe('media');
    expect(tarefa.done).toBe(false);
    expect(tarefa.createdAt).toEqual(expect.any(String));
  });

  test('incrementa o id a cada tarefa criada', () => {
    tasks.create({ title: 'Primeira' });
    const segunda = tasks.create({ title: 'Segunda' });

    expect(segunda.id).toBe(2);
    expect(tasks.list()).toHaveLength(2);
  });

  test('aceita as prioridades válidas', () => {
    tasks.PRIORIDADES.forEach((prioridade) => {
      expect(tasks.create({ title: `Tarefa ${prioridade}`, priority: prioridade }).priority)
        .toBe(prioridade);
    });
  });

  test('rejeita tarefa sem título', () => {
    expect(() => tasks.create({})).toThrow(tasks.ValidationError);
  });

  test('rejeita prioridade desconhecida', () => {
    expect(() => tasks.create({ title: 'X', priority: 'urgentissima' }))
      .toThrow(/Prioridade inválida/);
  });

  test('rejeita título acima de 120 caracteres', () => {
    expect(() => tasks.create({ title: 'a'.repeat(121) }))
      .toThrow(/no máximo 120 caracteres/);
  });
});

describe('consulta, conclusão e remoção', () => {
  test('busca uma tarefa pelo id', () => {
    const criada = tasks.create({ title: 'Buscar' });
    expect(tasks.get(criada.id)).toEqual(criada);
  });

  test('lança NotFoundError para id inexistente', () => {
    expect(() => tasks.get(99)).toThrow(tasks.NotFoundError);
  });

  test('marca a tarefa como concluída', () => {
    const criada = tasks.create({ title: 'Concluir' });
    expect(tasks.complete(criada.id).done).toBe(true);
  });

  test('filtra a listagem por status', () => {
    const feita = tasks.create({ title: 'Feita' });
    tasks.create({ title: 'Pendente' });
    tasks.complete(feita.id);

    expect(tasks.list({ done: true })).toHaveLength(1);
    expect(tasks.list({ done: false })).toHaveLength(1);
  });

  test('remove a tarefa da lista', () => {
    const criada = tasks.create({ title: 'Remover' });
    tasks.remove(criada.id);

    expect(tasks.list()).toHaveLength(0);
    expect(() => tasks.get(criada.id)).toThrow(tasks.NotFoundError);
  });

  test('resume o total de tarefas em stats', () => {
    const feita = tasks.create({ title: 'Feita' });
    tasks.create({ title: 'Pendente' });
    tasks.complete(feita.id);

    expect(tasks.stats()).toEqual({ total: 2, concluidas: 1, pendentes: 1 });
  });
});

// --- hotfix v1.0.1 ---
describe('normalização do título (hotfix v1.0.1)', () => {
  test('rejeita título composto apenas por espaços', () => {
    expect(() => tasks.create({ title: '   ' })).toThrow(tasks.ValidationError);
  });

  test('remove os espaços das pontas do título', () => {
    expect(tasks.create({ title: '  Com espaços  ' }).title).toBe('Com espaços');
  });
});
