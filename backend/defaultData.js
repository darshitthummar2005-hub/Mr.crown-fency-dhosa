const DEFAULT_DOSAS = [
  {
    id: 'd1',
    name: 'Masala Dosa',
    category: 'Classic',
    description: 'Golden crispy dosa stuffed with spiced potato masala, served with coconut chutney and hot sambar.',
    price: 90,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/43/Masala_dosa_01.jpg/960px-Masala_dosa_01.jpg',
    badge: 'Bestseller',
    available: true
  },
  {
    id: 'd2',
    name: 'Ghee Roast Dosa',
    category: 'Classic',
    description: 'Paper-thin dosa roasted in pure ghee with a fiery red chutney spread and a buttery finish.',
    price: 110,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/15/Ghee_roast_05.jpg/960px-Ghee_roast_05.jpg',
    available: true
  },
  {
    id: 'd3',
    name: 'Mysore Masala Dosa',
    category: 'Classic',
    description: 'Spicy red garlic chutney slathered on a crisp dosa with classic masala potato filling.',
    price: 120,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/Mysore_masala_dosa_in_Mysuru%2C_July_2013.jpg/960px-Mysore_masala_dosa_in_Mysuru%2C_July_2013.jpg',
    available: true
  },
  {
    id: 'd4',
    name: 'Cheese Burst Dosa',
    category: 'Cheese Burst',
    description: 'Loaded with molten cheddar and mozzarella that bursts out with every single bite.',
    price: 150,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/Cheese_dosa.jpg/960px-Cheese_dosa.jpg',
    badge: 'Bestseller',
    available: true
  },
  {
    id: 'd5',
    name: 'Triple Cheese Dosa',
    category: 'Cheese Burst',
    description: 'A triple layer of cheese, herbs and butter for the ultimate cheesy indulgence.',
    price: 180,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b1/Mysore_Cheese_dosa.jpg/960px-Mysore_Cheese_dosa.jpg',
    available: true
  },
  {
    id: 'd6',
    name: 'Schezwan Dosa',
    category: 'Indo-Chinese',
    description: 'Spicy schezwan dosa tossed with noodles, crunchy capsicum and fiery schezwan sauce.',
    price: 140,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Schezwan_masala_dosa.jpg/960px-Schezwan_masala_dosa.jpg',
    badge: 'Spicy',
    available: true
  },
  {
    id: 'd7',
    name: 'Spring Roll Dosa',
    category: 'Indo-Chinese',
    description: 'Crunchy veg spring rolls fused into a golden dosa, served with sweet and sour dip.',
    price: 155,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/Ch%E1%BA%A3_gi%C3%B2_%28Vietnamese_Spring_Rolls%29_-_12.jpg/960px-Ch%E1%BA%A3_gi%C3%B2_%28Vietnamese_Spring_Rolls%29_-_12.jpg',
    available: true
  },
  {
    id: 'd8',
    name: 'Paneer Butter Dosa',
    category: 'Paneer Special',
    description: 'Soft paneer cubes simmered in rich butter masala, wrapped in a crisp golden dosa.',
    price: 160,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/42/Paneer_dosa_at_Marksmen%2C_Hazratganj%2C_Lucknow_%282025-08-02%29.jpg/960px-Paneer_dosa_at_Marksmen%2C_Hazratganj%2C_Lucknow_%282025-08-02%29.jpg',
    available: true
  },
  {
    id: 'd9',
    name: 'Paneer Tikka Dosa',
    category: 'Paneer Special',
    description: 'Smoky paneer tikka chunks with tangy mint chutney tucked inside a crunchy dosa.',
    price: 175,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/eb/PANEER_MASALA_DOSA_-_Mini_MADRAS_2026-05-03.jpg/960px-PANEER_MASALA_DOSA_-_Mini_MADRAS_2026-05-03.jpg',
    badge: 'Spicy',
    available: true
  },
  {
    id: 'd10',
    name: 'Chocolate Dosa',
    category: 'Sweet',
    description: 'A dessert dosa drizzled with molten chocolate, roasted nuts and a dusting of cocoa.',
    price: 120,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0f/Chocolate_dosa_by_pradeep_chamaria.jpg/960px-Chocolate_dosa_by_pradeep_chamaria.jpg',
    badge: 'New',
    available: true
  },
  {
    id: 'd11',
    name: 'Choco-Banana Dosa',
    category: 'Sweet',
    description: 'Fresh banana slices with silky chocolate sauce and a scoop of vanilla ice cream.',
    price: 130,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Masala_Dosa_in_Banana_Leaf_with_Chutney.jpg/960px-Masala_Dosa_in_Banana_Leaf_with_Chutney.jpg',
    badge: 'New',
    available: true
  },
  {
    id: 'd12',
    name: 'Crown Special Royale',
    category: 'Special',
    description: 'Our signature dosa loaded with paneer, cheese, veggies and a royal golden finish.',
    price: 220,
    imageUrl: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Butter_Dosa_served_with_coconut_chutney_and_sambhar.jpg/960px-Butter_Dosa_served_with_coconut_chutney_and_sambhar.jpg',
    badge: 'Bestseller',
    available: true
  }
];

module.exports = { DEFAULT_DOSAS };
