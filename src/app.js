'use strict';

const express = require('express');
const tasks = require('./tasks');

const APP_VERSION = process.env.APP_VERSION || '1.0.0';

function createApp() {
  const app = express();

  app.use(express.json());

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      version: APP_VERSION,
      uptime: process.uptime(),
    });
  });

  app.get('/api/tasks', (req, res) => {
    const { done } = req.query;
    const filtro = done === undefined ? undefined : done === 'true';
    res.json({ data: tasks.list({ done: filtro }), stats: tasks.stats() });
  });

  app.get('/api/tasks/:id', (req, res, next) => {
    try {
      res.json({ data: tasks.get(req.params.id) });
    } catch (erro) {
      next(erro);
    }
  });

  app.post('/api/tasks', (req, res, next) => {
    try {
      res.status(201).json({ data: tasks.create(req.body) });
    } catch (erro) {
      next(erro);
    }
  });

  app.patch('/api/tasks/:id/complete', (req, res, next) => {
    try {
      res.json({ data: tasks.complete(req.params.id) });
    } catch (erro) {
      next(erro);
    }
  });

  app.delete('/api/tasks/:id', (req, res, next) => {
    try {
      tasks.remove(req.params.id);
      res.status(204).end();
    } catch (erro) {
      next(erro);
    }
  });

  app.use((req, res) => {
    res.status(404).json({ erro: 'Rota não encontrada' });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((erro, req, res, next) => {
    res.status(erro.status || 500).json({ erro: erro.message });
  });

  return app;
}

module.exports = { createApp, APP_VERSION };
