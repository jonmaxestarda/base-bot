/**
 * Middleware de ejemplo: registra en consola cada mensaje recibido.
 * El prefijo "_" en el nombre de archivo es solo una convención visual
 * para distinguir middlewares de comandos normales; no tiene efecto funcional.
 */
export default {
  name: 'logger',
  middleware: true,
  execute: async ({ m }) => {
    const from = m.isGroup ? `grupo ${m.chat}` : 'privado'
    console.log(`📩 [${from}] ${m.pushName || m.sender}: ${m.text || '(sin texto)'}`)
  },
}
