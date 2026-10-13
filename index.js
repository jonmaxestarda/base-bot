import Client from '@itsliaaa/starcore'
import { settings } from './config/settings.js'
import { PluginManager } from './lib/pluginManager.js'
import { createMessageHandler } from './lib/messageHandler.js'

console.log(`🚀 Iniciando ${settings.botName}...`)

const client = new Client({
  auth: {
    name: settings.session.name,
    pairingCode: settings.session.pairingCode,
    phoneNumber: settings.session.phoneNumber,
    type: settings.database.type, // 0 = 'json' | 1 = 'sqlite'
  },
})

// --- Conexión / Pairing ---
client.on('connect', (ctx) => {
  switch (ctx.type) {
    case 'pairing':
      console.log('🔗 Código de emparejamiento:', ctx.prettyCode ?? ctx.asciiQr)
      break
    case 'close':
      console.error('🔌 Conexión cerrada:', ctx.reason)
      break
  }
})

client.on('ready', async ({ store }) => {
  console.log(`✅ ${settings.botName} está listo y conectado.`)

  // Cargar/guardar store periódicamente
  store.readFromFile()
  setInterval(async () => {
    try {
      await store.writeToFile()
    } catch (error) {
      console.error('❌ Error guardando store:', error)
    }
  }, 600_000)

  // --- Inicializar sistema de plugins/middleware ---
  const pluginManager = new PluginManager(client, {
    pluginsPath: settings.plugins.path,
    watch: settings.plugins.watch,
  })
  await pluginManager.loadAll()

  // Guardamos referencia global para que los plugins puedan acceder al menú, etc.
  client.pluginManager = pluginManager

  // --- Conectar el handler central de mensajes ---
  const handleMessage = createMessageHandler(client, pluginManager)
  client.on('message', handleMessage)
})

process.on('unhandledRejection', (err) => {
  console.error('❌ [UnhandledRejection]', err)
})

process.on('uncaughtException', (err) => {
  console.error('❌ [UncaughtException]', err)
})
