export default {
  name: 'ping',
  command: ['ping', 'p'],
  category: 'general',
  description: 'Verifica si el bot está activo y muestra la latencia.',
  execute: async ({ m }) => {
    const start = Date.now()
    const sent = await m.reply('🏓 Calculando...')
    const latency = Date.now() - start
    await sent // por si tu versión de reply retorna una promesa con el mensaje enviado
    await m.reply(`🏓 Pong! Latencia: ${latency}ms`)
  },
}
