import { settings } from '../config/settings.js'

export default {
  name: 'menu',
  command: ['menu', 'help'],
  category: 'general',
  description: 'Muestra la lista de comandos disponibles.',
  execute: async ({ m, client, prefix }) => {
    const byCategory = client.pluginManager.getMenu()
    let text = `✨ *${settings.botName}* - Menú de comandos\n\n`

    for (const [category, plugins] of Object.entries(byCategory)) {
      text += `📂 *${category.toUpperCase()}*\n`
      for (const plugin of plugins) {
        const cmds = Array.isArray(plugin.command) ? plugin.command[0] : plugin.command
        text += `  ${prefix || settings.prefixes[0]}${cmds} - ${plugin.description || 'Sin descripción'}\n`
      }
      text += '\n'
    }

    await m.reply(text.trim())
  },
}
