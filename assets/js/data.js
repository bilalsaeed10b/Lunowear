/* ============================================================
   Luna — Mock product catalog (dummy data + placeholder images)
   Images use picsum.photos with fixed seeds so each product is
   stable across reloads. Swap `img()` for real photos later.
   ============================================================ */
(function () {
  // Deterministic placeholder image URL from a seed string.
  const img = (seed) => `https://picsum.photos/seed/luna-${seed}/640/854`;

  const COLORS = {
    black: { name: 'Black', hex: '#1a1a1a' },
    white: { name: 'White', hex: '#f2f2f2' },
    stone: { name: 'Stone', hex: '#cdc3b4' },
    navy: { name: 'Navy', hex: '#26314d' },
    olive: { name: 'Olive', hex: '#6f7457' },
    grey: { name: 'Grey', hex: '#9aa0a6' },
    blue: { name: 'Sky', hex: '#a9c3d6' },
    brown: { name: 'Brown', hex: '#7a5a44' },
    sand: { name: 'Sand', hex: '#d9cbb0' },
  };

  const SIZES_TOP = ['S', 'M', 'L', 'XL', 'XXL'];
  const SIZES_BOTTOM = ['S', 'M', 'L', 'XL', 'XXL'];
  const SIZES_SHOE = ['S', 'M', 'L', 'XL', 'XXL'];
  const SIZES_ONE = ['S', 'M', 'L', 'XL', 'XXL'];

  // name, category slug, fit, dept, price, compareAt(optional), colors, sizes, badge
  const RAW = [
    ['Color Block Raglan T-Shirt', 'tshirts', 'Regular Fit', 'MEN', 1490, 2490, ['white', 'black', 'blue'], SIZES_TOP, 'sale'],
    ['Essential Crew Neck Tee', 'tshirts', 'Regular Fit', 'MEN', 1290, null, ['white', 'black', 'stone'], SIZES_TOP, null],
    ['Oversized Boxy Tee', 'tshirts', 'Oversized', 'MEN', 1690, 2290, ['stone', 'olive', 'black'], SIZES_TOP, 'sale'],
    ['Heavyweight Pocket Tee', 'tshirts', 'Relaxed Fit', 'MEN', 1590, null, ['navy', 'grey'], SIZES_TOP, 'new'],
    ['Textured Cuban Collar Shirt', 'shirts', 'Relaxed Fit', 'MEN', 2990, null, ['black', 'stone'], SIZES_TOP, 'new'],
    ['Striped Resort Shirt', 'shirts', 'Regular Fit', 'MEN', 2490, 3490, ['blue', 'white'], SIZES_TOP, 'sale'],
    ['Linen Blend Overshirt', 'shirts', 'Boxy Fit', 'MEN', 3490, null, ['olive', 'sand'], SIZES_TOP, null],
    ['Corduroy Utility Shirt', 'shirts', 'Regular Fit', 'MEN', 3290, null, ['brown', 'navy'], SIZES_TOP, null],
    ['Piqué Polo Shirt', 'polos', 'Regular Fit', 'MEN', 1990, null, ['navy', 'white', 'olive'], SIZES_TOP, null],
    ['Zip Placket Knit Polo', 'polos', 'Slim Fit', 'MEN', 2290, 2990, ['stone', 'black'], SIZES_TOP, 'sale'],
    ['Ribbed Collar Polo', 'polos', 'Regular Fit', 'MEN', 1890, null, ['grey', 'navy'], SIZES_TOP, null],
    ['Cargo Utility Shorts', 'shorts', 'Relaxed Fit', 'MEN', 2190, null, ['black', 'olive', 'sand'], SIZES_BOTTOM, 'new'],
    ['Denim Carpenter Shorts', 'shorts', 'Loose Fit', 'MEN', 2490, 3290, ['blue'], SIZES_BOTTOM, 'sale'],
    ['Jersey Sweat Shorts', 'shorts', 'Regular Fit', 'MEN', 1690, null, ['grey', 'black', 'navy'], SIZES_BOTTOM, null],
    ['Wide Leg Baggy Jeans', 'jeans', 'Baggy Fit', 'MEN', 3990, null, ['blue'], SIZES_BOTTOM, 'new'],
    ['Straight Fit Rigid Jeans', 'jeans', 'Straight Fit', 'MEN', 3490, 4490, ['navy', 'black'], SIZES_BOTTOM, 'sale'],
    ['Tapered Stretch Jeans', 'jeans', 'Tapered Fit', 'MEN', 3290, null, ['blue', 'black'], SIZES_BOTTOM, null],
    ['Pleated Wide Trousers', 'trousers', 'Relaxed Fit', 'MEN', 3290, null, ['stone', 'black', 'olive'], SIZES_BOTTOM, null],
    ['Drawcord Tapered Pants', 'trousers', 'Tapered Fit', 'MEN', 2790, 3590, ['navy', 'grey'], SIZES_BOTTOM, 'sale'],
    ['Utility Cargo Trousers', 'trousers', 'Loose Fit', 'MEN', 3490, null, ['olive', 'black'], SIZES_BOTTOM, 'new'],
    ['Performance Training Tee', 'activewear', 'Athletic Fit', 'MEN', 1790, null, ['black', 'grey'], SIZES_TOP, null],
    ['Tech Fleece Zip Hoodie', 'activewear', 'Regular Fit', 'MEN', 4290, 5490, ['grey', 'black'], SIZES_TOP, 'sale'],
    ['Running Joggers', 'activewear', 'Slim Fit', 'MEN', 2990, null, ['navy', 'black'], SIZES_BOTTOM, null],
    ['Low Top Court Sneakers', 'footwear', 'Regular', 'MEN', 4990, null, ['white', 'black'], SIZES_SHOE, 'new'],
    ['Suede Chunky Trainers', 'footwear', 'Regular', 'MEN', 5490, 6990, ['stone', 'grey'], SIZES_SHOE, 'sale'],
    ['Slip-On Canvas Shoes', 'footwear', 'Regular', 'MEN', 3290, null, ['black', 'white'], SIZES_SHOE, null],
    ['Woven Leather Belt', 'accessories', 'One Size', 'MEN', 1490, null, ['brown', 'black'], SIZES_ONE, null],
    ['Ribbed Beanie', 'accessories', 'One Size', 'MEN', 990, 1490, ['black', 'grey', 'olive'], SIZES_ONE, 'sale'],
    ['Canvas Crossbody Bag', 'accessories', 'One Size', 'MEN', 2290, null, ['black', 'sand'], SIZES_ONE, 'new'],
    ['Structured Baseball Cap', 'accessories', 'One Size', 'MEN', 1290, null, ['navy', 'stone', 'black'], SIZES_ONE, null],
  ];

  // A few "sold out" items for the feature grids (indices chosen to
  // surface in the New In / Best Sellers rows).
  const SOLD_OUT = new Set([4, 9, 11, 18]);

  const products = RAW.map((r, i) => {
    const [name, category, fit, dept, price, compareAt, colorKeys, sizes, badge] = r;
    const id = `f${2000 + i}`;
    return {
      id,
      name,
      category,
      fit,
      dept,
      subtitle: `${fit} | ${dept}`,
      price,
      compareAt: compareAt || null,
      discount: compareAt ? Math.round((1 - price / compareAt) * 100) : 0,
      colors: colorKeys.map((k) => COLORS[k]),
      sizes,
      badge,
      soldOut: SOLD_OUT.has(i),
      images: [img(`${id}a`), img(`${id}b`), img(`${id}c`), img(`${id}d`)],
    };
  });

  const categories = [
    { slug: 'all', label: 'All' },
    { slug: 'tshirts', label: 'T-Shirts' },
    { slug: 'shirts', label: 'Shirts' },
    { slug: 'polos', label: 'Polos' },
    { slug: 'shorts', label: 'Shorts' },
    { slug: 'jeans', label: 'Jeans' },
    { slug: 'trousers', label: 'Trousers' },
    { slug: 'activewear', label: 'Activewear' },
    { slug: 'footwear', label: 'Footwear' },
    { slug: 'accessories', label: 'Accessories' },
  ];

  window.LUNA = window.LUNA || {};
  window.LUNA.products = products;
  window.LUNA.categories = categories;
  window.LUNA.formatPrice = (n) => 'PKR ' + n.toLocaleString('en-PK');
  window.LUNA.getProduct = (id) => products.find((p) => p.id === id);
})();
