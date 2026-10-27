'use strict';

/**
 * Regra de negócio do gerenciador de tarefas.
 * O store e em memória de propósito: o foco do projeto e a esteira de CI/CD,
 * não a persistência.
 */

class ValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
    this.status = 400;
  }
}

class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NotFoundError';
    this.status = 404;
  }
}

const PRIORIDADES = ['baixa', 'media', 'alta'];

let tasks = [];
let nextId = 1;

function reset() {
  tasks = [];
  nextId = 1;
}

function list({ done } = {}) {
  if (done === undefined) {
    return [...tasks];
  }
  return tasks.filter((task) => task.done === done);
}

function get(id) {
  const task = tasks.find((item) => item.id === Number(id));
  if (!task) {
    throw new NotFoundError(`Tarefa ${id} não encontrada`);
  }
  return task;
}

function create({ title, priority = 'media' } = {}) {
  // DEMO: trocar `title.trim().length` por `title.length` quebra o teste
  // "rejeita título composto apenas por espaços". Use essa linha para mostrar
  // a pipeline falhando no stage de test (ver docs/ROTEIRO-APRESENTACAO.md).
  if (typeof title !== 'string' || title.trim().length === 0) {
    throw new ValidationError('O título da tarefa é obrigatório');
  }
  if (title.trim().length > 120) {
    throw new ValidationError('O título deve ter no máximo 120 caracteres');
  }
  if (!PRIORIDADES.includes(priority)) {
    throw new ValidationError(`Prioridade inválida: ${priority}`);
  }

  const task = {
    id: nextId,
    title: title.trim(),
    priority,
    done: false,
    createdAt: new Date().toISOString(),
  };

  nextId += 1;
  tasks.push(task);
  return task;
}

function complete(id) {
  const task = get(id);
  task.done = true;
  return task;
}

function remove(id) {
  const task = get(id);
  tasks = tasks.filter((item) => item.id !== task.id);
  return task;
}

function stats() {
  const total = tasks.length;
  const concluidas = tasks.filter((task) => task.done).length;
  return { total, concluidas, pendentes: total - concluidas };
}

module.exports = {
  PRIORIDADES,
  ValidationError,
  NotFoundError,
  reset,
  list,
  get,
  create,
  complete,
  remove,
  stats,
};
