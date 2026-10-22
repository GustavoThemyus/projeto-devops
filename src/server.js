'use strict';

const { createApp, APP_VERSION } = require('./app');

const PORT = process.env.PORT || 3000;

createApp().listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`API de Tarefas v${APP_VERSION} escutando na porta ${PORT}`);
});
