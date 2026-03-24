const mongoose = require('mongoose')
require('dotenv').config()

const Product = require('./models/Product')

const products = [
  {
    name: 'Blanche',
    brand: 'Byredo',
    description: 'Ein puristisches, weißes Blumenparfum mit Noten von Aldehyden, Rose und Sandelholz. Zeitlos, clean, unvergesslich.',
    price: 189,
    sizes: [
      { ml: 50, price: 189, stock: 20 },
      { ml: 100, price: 249, stock: 15 },
    ],
    category: 'Damen',
    notes: { top: ['Aldehyde', 'Bergamotte'], heart: ['Rose', 'Veilchen'], base: ['Sandelholz', 'Moschus'] },
    images: ['https://placehold.co/600x800?text=Blanche'],
    featured: true,
  },
  {
    name: 'Oud Wood',
    brand: 'Tom Ford',
    description: 'Exotisches Oud-Holz trifft auf Rosenholz und Kardamom. Warm, rauchig, maskulin.',
    price: 220,
    sizes: [
      { ml: 50, price: 220, stock: 10 },
      { ml: 100, price: 310, stock: 8 },
    ],
    category: 'Herren',
    notes: { top: ['Kardamom', 'Szechuanpfeffer'], heart: ['Oud', 'Rosenholz'], base: ['Vanille', 'Amber'] },
    images: ['https://placehold.co/600x800?text=Oud+Wood'],
    featured: true,
  },
  {
    name: 'Santal 33',
    brand: 'Le Labo',
    description: 'Das bekannteste Sandelholzparfum der Welt. Cremig, warm, genderlos.',
    price: 210,
    sizes: [
      { ml: 50, price: 210, stock: 18 },
      { ml: 100, price: 295, stock: 12 },
    ],
    category: 'Unisex',
    notes: { top: ['Kardamom', 'Iris'], heart: ['Veilchen', 'Sandelholz'], base: ['Zedernholz', 'Leder', 'Moschus'] },
    images: ['https://placehold.co/600x800?text=Santal+33'],
    featured: true,
  },
  {
    name: 'Flowerbomb',
    brand: 'Viktor & Rolf',
    description: 'Explosiver floraler Duft — Jasmin, Rose und Patchouli in einem ikonischen Granatverschluss.',
    price: 135,
    sizes: [
      { ml: 30, price: 95, stock: 25 },
      { ml: 50, price: 135, stock: 20 },
      { ml: 100, price: 185, stock: 10 },
    ],
    category: 'Damen',
    notes: { top: ['Bergamotte', 'Tee'], heart: ['Jasmin', 'Rose', 'Freesie'], base: ['Patchouli', 'Moschus'] },
    images: ['https://placehold.co/600x800?text=Flowerbomb'],
    featured: false,
  },
  {
    name: 'Sauvage',
    brand: 'Dior',
    description: 'Frisch und rau wie eine weite Wüstenlandschaft. Der meistverkaufte Herrenduft der Welt.',
    price: 125,
    sizes: [
      { ml: 60, price: 125, stock: 30 },
      { ml: 100, price: 165, stock: 22 },
      { ml: 200, price: 220, stock: 8 },
    ],
    category: 'Herren',
    notes: { top: ['Bergamotte', 'Pfeffer'], heart: ['Lavendel', 'Iris'], base: ['Ambroxan', 'Zedernholz'] },
    images: ['https://placehold.co/600x800?text=Sauvage'],
    featured: true,
  },
  {
    name: 'Black Orchid',
    brand: 'Tom Ford',
    description: 'Dunkle, luxuriöse Blütenkomposition mit schwarzer Trüffel und Ylang Ylang.',
    price: 195,
    sizes: [
      { ml: 50, price: 195, stock: 12 },
      { ml: 100, price: 270, stock: 7 },
    ],
    category: 'Unisex',
    notes: { top: ['Schwarze Trüffel', 'Ylang Ylang'], heart: ['Schwarze Orchidee', 'Lotus'], base: ['Patchouli', 'Vanille', 'Sandelholz'] },
    images: ['https://placehold.co/600x800?text=Black+Orchid'],
    featured: false,
  },
  {
    name: 'Chance Eau Tendre',
    brand: 'Chanel',
    description: 'Blumig-frisch, verspielt und zeitgemäß. Grapefruit trifft auf Jasmin und weißen Moschus.',
    price: 145,
    sizes: [
      { ml: 50, price: 145, stock: 20 },
      { ml: 100, price: 195, stock: 14 },
    ],
    category: 'Damen',
    notes: { top: ['Grapefruit', 'Quitte'], heart: ['Jasmin', 'Iris'], base: ['Weißer Moschus', 'Zedernholz'] },
    images: ['https://placehold.co/600x800?text=Chance'],
    featured: false,
  },
  {
    name: 'Tobacco Vanille',
    brand: 'Tom Ford',
    description: 'Süßer Tabak, Gewürznelke und Vanille — reichhaltig und unwiderstehlich.',
    price: 235,
    sizes: [
      { ml: 50, price: 235, stock: 9 },
      { ml: 100, price: 325, stock: 5 },
    ],
    category: 'Unisex',
    notes: { top: ['Tabak', 'Gewürznelke'], heart: ['Tabakblüte', 'Jasmin'], base: ['Vanille', 'Kakaonibs', 'Trockenfrüchte'] },
    images: ['https://placehold.co/600x800?text=Tobacco+Vanille'],
    featured: true,
  },
]

async function seed() {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('✅ Verbunden mit MongoDB')

    await Product.deleteMany({})
    console.log('🗑️  Alte Produkte gelöscht')

    const inserted = await Product.insertMany(products)
    console.log(`🌱 ${inserted.length} Produkte eingefügt`)

    await mongoose.disconnect()
    console.log('✅ Fertig!')
    process.exit(0)
  } catch (err) {
    console.error('❌ Fehler:', err)
    process.exit(1)
  }
}

seed()
