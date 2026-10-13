const LINK_REGEX = /(https?:\/\/|chat\.whatsapp\.com)/i

export default {
  name: 'antilink',
  middleware: true,
  execute: async ({ m, sock }) => {
    if (!m.isGroup) return
    if (!m.text || !LINK_REGEX.test(m.text)) return

    // Evita borrar mensajes del propio bot o de administradores si lo deseas:
    try {
      const metadata = await sock.groupMetadata(m.chat)
      const participant = metadata.participants.find((p) => p.id === m.sender)
      const isAdmin = participant?.admin === 'admin' || participant?.admin === 'superadmin'
      if (isAdmin) return // los admins pueden enviar links

      await sock.sendMessage(m.chat, { delete: m.key })
      await m.reply('🚫 No se permiten enlaces en este grupo.')
    } catch (error) {
      console.error('❌ [antilink] Error:', error)
    }
  },
}
