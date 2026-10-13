export const settings = {
  botName: 'StarBot',
  prefixes: ['.', '#', '/', '!'],
  ownerNumbers: ['6281111111111@s.whatsapp.net'], // Reemplaza con tu(s) número(s) de dueño
  session: {
    name: 'session',
    pairingCode: true,
    phoneNumber: '6281111111111', // Tu número con código de país, sin + ni espacios
  },
  database: {
    type: 'json', // 'json' | 'sqlite'
    path: './database/database.json',
  },
  plugins: {
    path: './plugins',
    watch: true, // recarga en caliente al editar archivos en /plugins
  },
}

export default settings
