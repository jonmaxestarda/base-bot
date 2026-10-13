export default {
  name: 'eval',
  command: ['eval', '>'],
  category: 'owner',
  description: 'Ejecuta código JS (solo dueño).',
  owner: true,
  execute: async ({ m, sock, text }) => {
    if (!text) return m.reply('⚠️ Proporciona código para ejecutar.')
    try {
      let result = await eval(`(async () => { ${text} })()`)
      if (typeof result !== 'string') result = require('util').inspect(result)
      await m.reply(`✅ Resultado:\n\`\`\`${result}\`\`\``)
    } catch (error) {
      await m.reply(`❌ Error:\n\`\`\`${error.message}\`\`\``)
    }
  },
}
