import { readdirSync, watch as fsWatch } from 'fs'
import { join, resolve, extname } from 'path'
import { pathToFileURL } from 'url'

/**
 * PluginManager
 * ------------------------------------------------------------------
 * Cada archivo dentro de /plugins exporta un objeto (o "default export")
 * con esta forma:
 *
 * export default {
 *   name: 'ping',              // nombre único del plugin
 *   command: ['ping', 'p'],    // comando(s) que disparan execute() (opcional)
 *   category: 'general',       // para el menú automático (opcional)
 *   description: 'Responde pong',
 *   middleware: false,         // true = se ejecuta en CADA mensaje, sin importar el comando
 *   owner: false,               // true = solo el dueño puede usarlo
 *   group: false,               // true = solo funciona en grupos
 *   private: false,             // true = solo funciona en chat privado
 *   admin: false,               // true = solo admins del grupo
 *   execute: async (ctx) => { ... }
 * }
 *
 * `ctx` siempre contiene: { client, sock, m, args, text, body, command, prefix, isOwner }
 * ------------------------------------------------------------------
 */
export class PluginManager {
  constructor(client, { pluginsPath = './plugins', watch = true } = {}) {
    this.client = client
    this.pluginsPath = resolve(pluginsPath)
    this.watch = watch
    this.commands = new Map()   // commandName -> plugin
    this.middlewares = []        // plugins con middleware: true
    this.plugins = new Map()     // name -> plugin (todos)
  }

  async loadAll() {
    this.commands.clear()
    this.middlewares = []
    this.plugins.clear()

    const files = readdirSync(this.pluginsPath).filter(
      (f) => extname(f) === '.js'
    )

    for (const file of files) {
      await this.loadFile(file)
    }

    console.log(
      `🧩 [PluginManager] ${this.plugins.size} plugin(s) cargado(s), ${this.commands.size} comando(s), ${this.middlewares.length} middleware(s)`
    )

    if (this.watch) this._watchDirectory()
  }

  async loadFile(file) {
    try {
      const fullPath = join(this.pluginsPath, file)
      // Cache-busting para permitir hot-reload real
      const url = pathToFileURL(fullPath).href + `?update=${Date.now()}`
      const mod = await import(url)
      const plugin = mod.default ?? mod

      if (!plugin || !plugin.name) {
        console.warn(`⚠️ [PluginManager] "${file}" no exporta un plugin válido (falta "name"), se omite.`)
        return
      }

      this.plugins.set(plugin.name, plugin)

      if (plugin.middleware) {
        this.middlewares.push(plugin)
      }

      if (plugin.command) {
        const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
        for (const c of cmds) {
          this.commands.set(c.toLowerCase(), plugin)
        }
      }

      console.log(`✅ [PluginManager] Cargado: ${plugin.name} (${file})`)
    } catch (error) {
      console.error(`❌ [PluginManager] Error cargando "${file}":`, error)
    }
  }

  _watchDirectory() {
    fsWatch(this.pluginsPath, async (eventType, filename) => {
      if (!filename || extname(filename) !== '.js') return
      console.log(`🔄 [PluginManager] Cambio detectado en "${filename}", recargando...`)
      await this.loadFile(filename)
      this._rebuildIndexes()
    })
  }

  _rebuildIndexes() {
    this.commands.clear()
    this.middlewares = []
    for (const plugin of this.plugins.values()) {
      if (plugin.middleware) this.middlewares.push(plugin)
      if (plugin.command) {
        const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command]
        for (const c of cmds) this.commands.set(c.toLowerCase(), plugin)
      }
    }
  }

  getMenu() {
    const byCategory = {}
    for (const plugin of this.plugins.values()) {
      if (!plugin.command) continue
      const cat = plugin.category || 'general'
      byCategory[cat] ??= []
      byCategory[cat].push(plugin)
    }
    return byCategory
  }
}

export default PluginManager
