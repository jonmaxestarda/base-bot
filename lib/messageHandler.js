import { settings } from '../config/settings.js'

/**
 * createMessageHandler
 * ------------------------------------------------------------------
 * Devuelve una función que se conecta directamente a client.on('message', ...).
 * Se encarga de:
 *   1) Correr TODOS los middlewares registrados (ej: anti-link, logger, auto-read).
 *   2) Resolver el comando según los prefijos configurados.
 *   3) Validar permisos (owner / group / private / admin).
 *   4) Ejecutar el plugin correspondiente con manejo de errores centralizado.
 * ------------------------------------------------------------------
 */
export function createMessageHandler(client, pluginManager) {
  return async function handleMessage(ctxRaw) {
    const { m } = ctxRaw
    if (!m || m.fromMe) return

    const sock = client.sock
    const prefixes = settings.prefixes
    const body = m.text || ''

    const usedPrefix = prefixes.find((p) => body.startsWith(p))
    const withoutPrefix = usedPrefix ? body.slice(usedPrefix.length) : body
    const [rawCommand, ...rest] = withoutPrefix.trim().split(/\s+/)
    const command = (rawCommand || '').toLowerCase()
    const args = rest
    const text = args.join(' ')
    const isOwner = settings.ownerNumbers.includes(m.sender)

    const ctx = {
      client,
      sock,
      m,
      body,
      command,
      args,
      text,
      prefix: usedPrefix,
      isOwner,
    }

    // 1) Middlewares: corren siempre, con o sin comando
    for (const mw of pluginManager.middlewares) {
      try {
        await mw.execute(ctx)
      } catch (error) {
        console.error(`❌ [Middleware:${mw.name}] Error:`, error)
      }
    }

    // Si no hay prefijo o no hay comando, no hay nada más que hacer
    if (!usedPrefix || !command) return

    const plugin = pluginManager.commands.get(command)
    if (!plugin) return

    // 2) Validación de permisos declarativa
    if (plugin.owner && !isOwner) {
      return m.reply('🚫 Este comando es solo para el dueño del bot.')
    }
    if (plugin.group && !m.isGroup) {
      return m.reply('🚫 Este comando solo funciona en grupos.')
    }
    if (plugin.private && m.isGroup) {
      return m.reply('🚫 Este comando solo funciona en chat privado.')
    }
    if (plugin.admin && m.isGroup) {
      try {
        const metadata = await sock.groupMetadata(m.chat)
        const participant = metadata.participants.find((p) => p.id === m.sender)
        const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin'
        if (!isAdmin) return m.reply('🚫 Este comando es solo para administradores del grupo.')
      } catch (error) {
        console.error('❌ [Permisos] Error verificando admin:', error)
      }
    }

    // 3) Ejecución con manejo de errores centralizado
    try {
      await plugin.execute(ctx)
    } catch (error) {
      console.error(`❌ [Comando:${plugin.name}] Error:`, error)
      m.reply(`❌ Ocurrió un error ejecutando *${command}*:\n\`\`\`${error.message}\`\`\``).catch(() => {})
    }
  }
}

export default createMessageHandler
