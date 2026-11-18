import type { Item } from '../lib/types'

export const SEED_ITEMS: Item[] = [
  {
    id: 'bb-001', title: 'Black Aquaflask Tumbler', category: 'Drinkware', building: 'CICS', spot: '2nd floor corridor bench',
    description: 'Black insulated Aquaflask tumbler with a carry handle and a small dent near the bottom. Silver lid, stainless steel interior.',
    date: '2026-11-10', status: 'Unclaimed', kind: 'tumbler', colors: ['#1c1c1f', '#8a8d93', '#c9ccd2'],
  },
  {
    id: 'bb-002', title: 'Pastel Blue Insulated Tumbler', category: 'Drinkware', building: 'Cafeteria', spot: 'Table near the rice counter',
    description: 'Light blue insulated tumbler with a flip straw lid and a sticker of a cat on the side. Water flask style.',
    date: '2026-11-12', status: 'Unclaimed', kind: 'tumbler', colors: ['#8fc3e6', '#f2f2f2', '#f7b6c8'],
  },
  {
    id: 'bb-003', title: 'Casio fx-991ES Scientific Calculator', category: 'Electronics', building: 'CEA', spot: 'Lobby, near the guard station',
    description: 'Black Casio scientific calculator fx-991ES Plus with a gray hard cover. Name label scratched off the back.',
    date: '2026-11-11', status: 'Unclaimed', kind: 'calculator', colors: ['#202226', '#9dbf9a', '#e8e8ea'],
  },
  {
    id: 'bb-004', title: 'White USB-C Phone Charger', category: 'Electronics', building: 'Library', spot: 'Outlet on 2nd floor study carrels',
    description: 'White 20W USB-C power adapter with a short braided cable still plugged in. Fast charger block.',
    date: '2026-11-09', status: 'Unclaimed', kind: 'charger', colors: ['#f4f4f2', '#2b2b2e', '#c9c9c4'],
  },
  {
    id: 'bb-005', title: 'Navy Blue Folding Umbrella', category: 'Accessories', building: 'CIT', spot: 'Umbrella stand at the entrance',
    description: 'Navy blue compact folding umbrella with a black plastic handle and a velcro strap. Automatic open button.',
    date: '2026-11-13', status: 'Unclaimed', kind: 'umbrella', colors: ['#1f3a73', '#16181d', '#8fa6d6'],
  },
  {
    id: 'bb-006', title: 'Red BatStateU ID Lanyard with Card', category: 'IDs & Keys', building: 'Gymnasium', spot: 'Bleachers, left side',
    description: 'Red lanyard with a BatStateU student ID card still attached and a metal clip. ID photo is of a male student.',
    date: '2026-11-08', status: 'Claimed', kind: 'lanyard', colors: ['#c0262d', '#f2f2f2', '#d9a21b'],
  },
  {
    id: 'bb-007', title: 'White Wireless Earbuds Case', category: 'Electronics', building: 'CICS', spot: 'Computer Lab 3 desk',
    description: 'White wireless earbuds in a small rounded charging case, Bluetooth, with a green LED. Case has scuff marks.',
    date: '2026-11-14', status: 'Unclaimed', kind: 'earbuds', colors: ['#f5f5f3', '#d6d6d1', '#3fb36b'],
  },
  {
    id: 'bb-008', title: 'Green Spiral Notebook', category: 'Stationery', building: 'Library', spot: 'Reading area, long table',
    description: 'Green spiral notebook with handwritten engineering notes inside, about 80 leaves and a white label on the cover.',
    date: '2026-11-07', status: 'Claimed', kind: 'notebook', colors: ['#2f7d4f', '#f6f3ea', '#c9d8ce'],
  },
  {
    id: 'bb-009', title: 'Red Flash Drive 32GB', category: 'Electronics', building: 'CEA', spot: 'Drafting room 204',
    description: 'Red USB flash drive 32GB with a metal connector and a keyring hole. Thumb drive with files for plates.',
    date: '2026-11-15', status: 'Unclaimed', kind: 'flashdrive', colors: ['#c62828', '#b9bcc2', '#1d1d1f'],
  },
  {
    id: 'bb-010', title: 'Brown Eyeglasses Case', category: 'Accessories', building: 'CIT', spot: 'Workshop bench',
    description: 'Brown hard shell eyeglasses case with a cleaning cloth inside and a metal clasp. Leather texture.',
    date: '2026-11-06', status: 'Claimed', kind: 'glasscase', colors: ['#7a4a2b', '#d9b48a', '#3b2616'],
  },
  {
    id: 'bb-011', title: 'Gray Pullover Hoodie', category: 'Apparel', building: 'Gymnasium', spot: 'Lockers, near court B',
    description: 'Gray pullover hoodie with a kangaroo pocket and white drawstrings. Size medium, left sleeve worn.',
    date: '2026-11-05', status: 'Claimed', kind: 'hoodie', colors: ['#8a8d93', '#f2f2f2', '#5d6068'],
  },
  {
    id: 'bb-012', title: 'Keys with Yellow Keychain', category: 'IDs & Keys', building: 'Cafeteria', spot: 'Counter by the cashier',
    description: 'Set of three keys on a steel ring with a yellow rubber tag keychain. Apartment key and a padlock key.',
    date: '2026-11-12', status: 'Claimed', kind: 'keys', colors: ['#f2c21b', '#b9bcc2', '#8a8d93'],
  },
  {
    id: 'bb-013', title: 'Beige Canvas Tote Bag', category: 'Bags', building: 'Library', spot: 'Under table at the entrance',
    description: 'Beige canvas tote bag with brown handles and a front pocket. Contains a folder and a pair of earphones.',
    date: '2026-11-10', status: 'Unclaimed', kind: 'tote', colors: ['#d8c7a3', '#7a4a2b', '#bda97f'],
  },
  {
    id: 'bb-014', title: 'Black Power Bank 10000mAh', category: 'Electronics', building: 'CEA', spot: 'Room 301, back row',
    description: 'Black portable power bank 10000mAh with four LED indicator lights and a USB-C port. Slim and rectangular.',
    date: '2026-11-13', status: 'Unclaimed', kind: 'powerbank', colors: ['#18181b', '#e0891d', '#5a5d66'],
  },
  {
    id: 'bb-015', title: 'Blue Notebook with Stickers', category: 'Stationery', building: 'CICS', spot: 'Room 105 desk',
    description: 'Blue ruled notebook with programming notes and laptop stickers on the cover. Spiral binding.',
    date: '2026-11-14', status: 'Claimed', kind: 'notebook', colors: ['#2a5db0', '#f6f3ea', '#f2c21b'],
  },
]

export interface DemoQuery {
  id: string
  label: string
  place: string
  description: string
  location: string
  category: string
  preset: string
}

export const DEMOS: DemoQuery[] = [
  { id: 'tumbler', label: 'Black Aquaflask', place: 'CICS', description: 'Lost my black insulated tumbler with a handle, I think a dent at the bottom. Aquaflask.', location: 'CICS', category: 'Drinkware', preset: 'bb-001' },
  { id: 'calculator', label: 'Casio fx-991ES', place: 'CEA', description: 'Black Casio scientific calculator with hard cover, left it after the exam.', location: 'CEA', category: 'Electronics', preset: 'bb-003' },
  { id: 'charger', label: 'Anker 20W Charger', place: 'Library', description: 'White Anker 20W USB-C phone charger with a short cable, left in an outlet at the study carrels.', location: 'Library', category: 'Electronics', preset: 'bb-004' },
  { id: 'umbrella', label: 'Navy Folding Umbrella', place: 'CIT', description: 'Navy blue folding umbrella with black handle and velcro strap.', location: 'CIT', category: 'Accessories', preset: 'bb-005' },
]
