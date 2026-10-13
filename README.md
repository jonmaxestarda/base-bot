# ✨ StarBot — Bot de WhatsApp con `@itsliaaa/starcore`

Bot base construido sobre [`@itsliaaa/starcore`](https://www.npmjs.com/package/@itsliaaa/starcore), con un **sistema de plugins + middleware** que te permite agregar funciones nuevas creando un solo archivo, sin tocar el core del bot.

---

## 📁 Estructura del proyecto

```
starcore-bot/
├── index.js                 # Punto de entrada: inicializa el cliente y conecta todo
├── package.json
├── .env.example
├── config/
│   └── settings.js          # Toda la configuración del bot en un solo lugar
├── lib/
│   ├── pluginManager.js     # Carga, indexa y recarga en caliente los plugins
│   └── messageHandler.js    # Middleware central: procesa cada mensaje entrante
├── plugins/                 # 👉 AQUÍ agregas toda nueva funcionalidad
│   ├── ping.js
│   ├── menu.js
│   ├── eval.js
│   ├── _logger.middleware.js
│   └── _antilink.middleware.js
└── database/
    └── database.json        # Se genera automáticamente
```

---

## 🚀 Instalación y arranque

```bash
npm install
cp .env.example .env
```

Edita `config/settings.js`:
- `session.phoneNumber`: tu número con código de país (solo números).
- `ownerNumbers`: tu JID (`numero@s.whatsapp.net`) para comandos de dueño.

Luego:

```bash
npm start
# o, para reinicio automático al editar index.js/lib:
npm run dev
```

Al iniciar por primera vez, la consola imprimirá un **código de emparejamiento** (`pairingCode: true` en `settings.js`). Ingrésalo en WhatsApp → Dispositivos vinculados → Vincular con número de teléfono.

---

## 🧩 Cómo funciona el sistema de plugins

Cada archivo `.js` dentro de `/plugins` exporta **un objeto** con esta forma:

```javascript
export default {
  name: 'nombreUnico',        // obligatorio
  command: ['saludo', 's'],   // alias que activan el comando (opcional)
  category: 'general',        // agrupa en el /menu (opcional)
  description: 'Descripción corta',
  middleware: false,          // true = se ejecuta en TODOS los mensajes
  owner: false,               // true = solo el dueño del bot
  group: false,                // true = solo en grupos
  private: false,              // true = solo en chat privado
  admin: false,                // true = solo admins del grupo
  execute: async (ctx) => {
    // tu lógica aquí
  },
}
```

### El objeto `ctx` que recibe `execute()`

| Propiedad | Descripción |
|---|---|
| `client`   | La instancia de `Client` de starcore |
| `sock`     | El socket crudo de Baileys (`client.sock`) — acceso a TODAS las funciones Baileys/starcore |
| `m`        | El mensaje normalizado (`m.reply()`, `m.react()`, `m.text`, `m.sender`, `m.isGroup`, etc.) |
| `body`     | Texto completo del mensaje |
| `command`  | El comando detectado (sin prefijo), en minúsculas |
| `args`     | Array de palabras después del comando |
| `text`     | `args` unidos en un solo string |
| `prefix`   | El prefijo usado (`.`, `#`, `/`, `!`) |
| `isOwner`  | Booleano, si el remitente está en `ownerNumbers` |

**No necesitas reimportar nada de Baileys/starcore dentro de un plugin para enviar mensajes** — todo vive en `ctx.sock` y `ctx.m`, tal como describe la documentación original de `starcore` (`sendText`, `sendMedia`, `sendPoll`, `sendInteractive`, etc.)

### Middlewares (`middleware: true`)

Un middleware se ejecuta en **cada mensaje recibido**, tenga o no un comando. Úsalo para:
- Logging
- Anti-link / anti-spam
- Contadores de actividad / XP
- Auto-respuestas basadas en palabras clave (sin comando explícito)
- Guardar historial en la base de datos

Mira `plugins/_logger.middleware.js` y `plugins/_antilink.middleware.js` como ejemplos reales.

> 💡 Convención: nombra tus middlewares con el patrón `_nombre.middleware.js` para distinguirlos visualmente de los comandos — es solo convención, el sistema los detecta por la propiedad `middleware: true`, no por el nombre del archivo.

### Recarga en caliente (hot-reload)

Con `plugins.watch = true` en `settings.js`, cualquier cambio guardado en un archivo dentro de `/plugins` se recarga automáticamente **sin reiniciar el bot**. Ideal durante desarrollo.

---

## ➕ Cómo agregar un comando nuevo (ejemplo paso a paso)

Crea `plugins/saludo.js`:

```javascript
export default {
  name: 'saludo',
  command: ['saludo', 'hola'],
  category: 'diversión',
  description: 'El bot te saluda',
  execute: async ({ m, args }) => {
    const nombre = args[0] || 'amigo'
    await m.reply(`👋 ¡Hola, ${nombre}!`)
  },
}
```

Guarda el archivo. Si el bot está corriendo con `watch: true`, ya puedes escribir `.saludo Carlos` en WhatsApp y responderá al instante. No necesitas reiniciar nada ni registrar el comando en ningún otro lugar.

---

## 🖼️ Ejemplo usando funciones avanzadas de starcore (media, polls, interactivos)

```javascript
export default {
  name: 'encuesta',
  command: 'encuesta',
  category: 'utilidades',
  description: 'Crea una encuesta rápida',
  execute: async ({ m, sock, args, text }) => {
    if (!text) return m.reply('⚠️ Uso: .encuesta ¿Pregunta?')
    await sock.sendPoll(m.chat, ['✅ Sí', '❌ No'], m, {
      name: text,
      selectableCount: 1,
    })
  },
}
```

```javascript
export default {
  name: 'sticker',
  command: ['sticker', 's'],
  category: 'utilidades',
  description: 'Convierte una imagen citada en sticker',
  execute: async ({ m, sock }) => {
    if (!m.quoted) return m.reply('⚠️ Responde a una imagen con .sticker')
    // Asumiendo que descargas el buffer de la media citada con tus propias utilidades
    // const buffer = await downloadMediaMessage(m.quoted, ...)
    // await sock.sendSticker(m.chat, buffer, m, { packName: 'StarBot', packPublisher: 'Tú' })
    await m.reply('🧩 Implementa la descarga de media según tu versión de Baileys y listo.')
  },
}
```

---

## 🗄️ Base de datos

El proyecto usa el backend `json` por defecto (`Database.json`). Para cambiar a SQLite:

1. Instala la dependencia peer: `npm install better-sqlite3@>=13.0.0`
2. Cambia `database.type` a `'sqlite'` en `config/settings.js`.
3. Pasa `type: 1` (sqlite) al crear el `Client` en `index.js` si tu versión de starcore lo requiere numérico (revisa el comentario `// 0 = 'json' | 1 = 'sqlite'` en la doc original).

Para leer/escribir datos propios desde un plugin:

```javascript
import { Database } from '@itsliaaa/starcore'

const db = await Database.json('./database/misdatos.json')
const data = await db.read()
data.contador = (data.contador || 0) + 1
await db.write(data)
```

---

## 🛡️ Sistema de permisos (declarativo)

En vez de escribir `if` repetidos en cada plugin, declara flags en el objeto exportado y el `messageHandler.js` los valida automáticamente **antes** de llamar a `execute()`:

```javascript
export default {
  name: 'kick',
  command: 'kick',
  admin: true,   // requiere ser admin del grupo
  group: true,   // solo funciona en grupos
  execute: async ({ m, sock, args }) => {
    // Si llegamos aquí, ya se validó que es grupo y que el remitente es admin
  },
}
```

| Flag | Efecto |
|---|---|
| `owner: true`   | Solo los números en `settings.ownerNumbers` pueden usarlo |
| `group: true`   | Solo funciona si `m.isGroup === true` |
| `private: true` | Solo funciona si `m.isGroup === false` |
| `admin: true`   | Solo administradores del grupo (verificado vía `sock.groupMetadata`) |

---

## 📣 Eventos disponibles (referencia rápida)

Todos estos eventos de `client.on(...)` (capa starcore) y `sock.ev.on(...)` (capa Baileys cruda) siguen disponibles si necesitas escuchar algo que no pase por el sistema de comandos — por ejemplo, para construir un plugin de bienvenida a nuevos miembros:

```javascript
// Puedes registrar esto dentro de index.js o en un plugin especial que
// reciba `client` y se auto-registre al cargar (ver sección "Extender el core" abajo)
client.on('group.add', (ctx) => {
  // alguien se unió al grupo
})
```

Eventos útiles de alto nivel (vía `client.on`):
`prepare`, `connect`, `ready`, `message`, `message.edit`, `message.delete`, `message.stub`, `poll`, `status`, `group.add`, `group.promote`, `group.demote`, `group.remove`, `group.request`, `group.update`, `label.update`, `caller`, `presence`.

Eventos crudos de Baileys (vía `sock.ev.on`): `connection.update`, `creds.update`, `messages.upsert`, `messages.reaction`, `group-participants.update`, `call`, y muchos más (ver la documentación original de starcore).

---

## 🧱 Extender el core (más allá de comandos/middlewares)

Si necesitas lógica que no encaja como "comando" ni "middleware por mensaje" (p. ej. reaccionar a que alguien se une a un grupo, o correr una tarea programada), crea un archivo en `/plugins` con una propiedad especial `onLoad(client)` y actívalo manualmente en `index.js`, o simplemente escucha el evento directamente dentro de `index.js` después de `pluginManager.loadAll()`. Dos caminos:

**Opción A — rápido, dentro de index.js:**
```javascript
client.on('group.add', async (ctx) => {
  await ctx.sock.sendText(ctx.chat, '👋 ¡Bienvenido al grupo!', ctx)
})
```

**Opción B — como plugin con auto-registro (recomendado si watch:true):**
```javascript
// plugins/_welcome.feature.js
export default {
  name: 'welcome',
  middleware: false,
  command: null,
  onLoad: (client) => {
    client.on('group.add', async (ctx) => {
      await ctx.sock.sendText(ctx.chat, '👋 ¡Bienvenido!', ctx)
    })
  },
}
```
Y en `lib/pluginManager.js`, dentro de `loadFile()`, después de `this.plugins.set(...)`, agrega:
```javascript
if (typeof plugin.onLoad === 'function') plugin.onLoad(this.client)
```
(Nota: con hot-reload esto puede registrar el listener más de una vez si editas el archivo repetidamente; para producción estable, desactiva `watch` o añade lógica para remover listeners previos.)

---

## 🔧 Configuración avanzada de starcore disponible

Todo esto se configura en el primer argumento del `Client` (`config/settings.js` → `index.js`), según la documentación original:

```javascript
{
  auth: {
    customCode: 'STARBOT',
    maxRestart: 5,
  },
  linkPreview: {
    enabled: true,
    fetchTimeoutMs: 100,
    thumbnailWidth: 192,
    uploadHqThumbnail: true,
  },
  isBotMessageId: (id) => id.includes('3EB0'),
  messageIdPrefix: 'STARBOT',
  updatePresence: true,
  updateProtoOnStartup: true,
  newsletterAnnotation: {
    newsletterJid: '...@newsletter',
    newsletterName: 'StarBot',
    contentType: 1,
  },
}
```

El segundo argumento del `Client` (o de `Extend()` si usas el socket crudo) es la configuración nativa del socket de Baileys (`shouldIgnoreJid`, etc.).

---

## 🗺️ Roadmap sugerido para crecer el bot

1. **Base de datos de usuarios/grupos**: un middleware que, en cada mensaje, incremente XP/mensajes contados y guarde en `Database`.
2. **Sistema de niveles**: comando `.level` que lea esos datos.
3. **Moderación**: `kick`, `promote`, `demote`, `setwelcome`, `antilink` (ya incluido), `antispam`.
4. **Descargas**: plugins que usen `Request` (incluido en starcore) para scrapers/APIs externas.
5. **Panel owner**: comandos `admin: true` / `owner: true` para broadcast, restart, estadísticas.
6. **Tests de plugins**: ya que cada plugin es un módulo aislado con `execute(ctx)`, puedes escribir tests unitarios simulando `ctx`.

---

## 📚 Referencias

- Documentación original de `@itsliaaa/starcore`: https://www.npmjs.com/package/@itsliaaa/starcore
- Repositorio: https://github.com/itsliaaa/starcore
- Bot de referencia (`@itsliaaa/starseed`): https://github.com/itsliaaa/starseed

---

**Créditos**: este scaffold usa `@itsliaaa/starcore`, creado y mantenido por [Lia Wynn](https://github.com/itsliaaa). Por favor no remuevas los créditos originales del paquete.
