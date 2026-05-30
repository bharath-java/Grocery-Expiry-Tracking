export interface IGroceryProfile {
  name: string;
  emoji: string;
  shelfLife: {
    roomTemp: string;
    refrigerator: string;
    freezer: string;
  };
  storageMethod: string;
  spoilageSigns: string;
  freshnessTips: string;
  foodSafetyNotes: string;
}

export const GROCERY_KNOWLEDGE: Record<string, IGroceryProfile> = {
  onion: {
    name: 'Onions',
    emoji: '🧅',
    shelfLife: {
      roomTemp: 'Whole onions: 1–2 months in a cool, dry, ventilated place.',
      refrigerator: 'Cut onions: 7–10 days in the refrigerator.',
      freezer: 'Up to 8 months (chopped or cooked).'
    },
    storageMethod: 'Keep whole onions in a dry, dark, well-ventilated area. Keep away from potatoes as they emit mutual ripening gases.',
    spoilageSigns: 'Soft spots, mold growth, strong unpleasant sour odor, or excessive sprouting.',
    freshnessTips: 'Store onions in a mesh basket or wire bin to allow air circulation. Avoid sealing whole onions in plastic bags.',
    foodSafetyNotes: 'Check for black mold (Aspergillus niger) which can trigger respiratory allergies. Discard if rotten or decaying.'
  },
  onions: {
    name: 'Onions',
    emoji: '🧅',
    shelfLife: {
      roomTemp: 'Whole onions: 1–2 months in a cool, dry, ventilated place.',
      refrigerator: 'Cut onions: 7–10 days in the refrigerator.',
      freezer: 'Up to 8 months (chopped or cooked).'
    },
    storageMethod: 'Keep whole onions in a dry, dark, well-ventilated area. Keep away from potatoes as they emit mutual ripening gases.',
    spoilageSigns: 'Soft spots, mold growth, strong unpleasant sour odor, or excessive sprouting.',
    freshnessTips: 'Store onions in a mesh basket or wire bin to allow air circulation. Avoid sealing whole onions in plastic bags.',
    foodSafetyNotes: 'Check for black mold (Aspergillus niger) which can trigger respiratory allergies. Discard if rotten or decaying.'
  },
  milk: {
    name: 'Milk',
    emoji: '🥛',
    shelfLife: {
      roomTemp: 'Not recommended (spoils within 2 hours).',
      refrigerator: 'Opened: 5–7 days when refrigerated (3°C to 4°C).',
      freezer: 'Up to 3 months (freeze before expiry date; texture may separate slightly).'
    },
    storageMethod: 'Store deep inside main refrigerator shelves. Never store in door pockets to prevent temperature swings.',
    spoilageSigns: 'Sour smell or taste, lumpy or curdled texture, and yellowish discoloration.',
    freshnessTips: 'Keep the carton tightly capped to prevent absorbing other strong refrigerator food odors.',
    foodSafetyNotes: 'Pasteurization protects milk, but once opened, keep refrigerated strictly below 4°C.'
  },
  curd: {
    name: 'Curd (Yogurt)',
    emoji: '🥣',
    shelfLife: {
      roomTemp: '2–4 hours (spoils quickly in warm climates).',
      refrigerator: 'Opened: 7–10 days when refrigerated.',
      freezer: 'Not recommended (texture separates and becomes watery).'
    },
    storageMethod: 'Keep sealed in airtight containers on top or middle refrigerator shelves.',
    spoilageSigns: 'Visible green, black, or pink mold fuzz, bubbly watery texture, or extremely bitter sour smell.',
    freshnessTips: 'Always use a clean, dry spoon to scoop curd to avoid introducing bacterial growth.',
    foodSafetyNotes: 'Discard immediately if mold is present on any part of the yogurt. Do not consume.'
  },
  yogurt: {
    name: 'Curd (Yogurt)',
    emoji: '🥣',
    shelfLife: {
      roomTemp: '2–4 hours (spoils quickly in warm climates).',
      refrigerator: 'Opened: 7–10 days when refrigerated.',
      freezer: 'Not recommended (texture separates and becomes watery).'
    },
    storageMethod: 'Keep sealed in airtight containers on top or middle refrigerator shelves.',
    spoilageSigns: 'Visible green, black, or pink mold fuzz, bubbly watery texture, or extremely bitter sour smell.',
    freshnessTips: 'Always use a clean, dry spoon to scoop curd to avoid introducing bacterial growth.',
    foodSafetyNotes: 'Discard immediately if mold is present on any part of the yogurt. Do not consume.'
  },
  banana: {
    name: 'Bananas',
    emoji: '🍌',
    shelfLife: {
      roomTemp: '2–5 days (until ripe).',
      refrigerator: '5–7 days (skin turns black but pulp stays firm).',
      freezer: '2–3 months (peeled and stored in freezer bag).'
    },
    storageMethod: 'Hang on a banana tree or store separately from other fruits.',
    spoilageSigns: 'Extremely black mushy pulp, leaking liquid, or a fermented/vinegar smell.',
    freshnessTips: 'Wrap banana crowns tightly in plastic cling wrap to trap ethylene gas release.',
    foodSafetyNotes: 'Small brown spots are normal sugar accumulation, but discard if leaking juices or moldy.'
  },
  bananas: {
    name: 'Bananas',
    emoji: '🍌',
    shelfLife: {
      roomTemp: '2–5 days (until ripe).',
      refrigerator: '5–7 days (skin turns black but pulp stays firm).',
      freezer: '2–3 months (peeled and stored in freezer bag).'
    },
    storageMethod: 'Hang on a banana tree or store separately from other fruits.',
    spoilageSigns: 'Extremely black mushy pulp, leaking liquid, or a fermented/vinegar smell.',
    freshnessTips: 'Wrap banana crowns tightly in plastic cling wrap to trap ethylene gas release.',
    foodSafetyNotes: 'Small brown spots are normal sugar accumulation, but discard if leaking juices or moldy.'
  },
  chicken: {
    name: 'Chicken',
    emoji: '🍗',
    shelfLife: {
      roomTemp: 'Not recommended (do not leave out for more than 1 hour).',
      refrigerator: 'Raw: 1–2 days; Cooked: 3–4 days.',
      freezer: 'Raw cuts: 9–12 months; Cooked: 4 months.'
    },
    storageMethod: 'Store in a sealed, leak-proof container on the bottom shelf of the refrigerator.',
    spoilageSigns: 'Slimy texture, grey or green discoloration, or strong sour/ammonia odor.',
    freshnessTips: 'Keep original airtight packaging intact until cooking, or wrap tightly in freezer foil to prevent freezer burn.',
    foodSafetyNotes: 'Never wash raw chicken to avoid splashing Salmonella bacteria. Reheat cooked chicken to 75°C.'
  },
  mutton: {
    name: 'Mutton',
    emoji: '🍖',
    shelfLife: {
      roomTemp: 'Not recommended (spoilage happens quickly).',
      refrigerator: 'Raw: 3–5 days; Cooked: 3–4 days.',
      freezer: 'Raw cuts: 6–12 months; Cooked: 3 months.'
    },
    storageMethod: 'Keep stored in the coldest part of the refrigerator, preferably at the bottom.',
    spoilageSigns: 'Rancid, putrid smell, slimy sticky texture, or dark brown/green discoloration.',
    freshnessTips: 'Wrap tightly in heavy-duty aluminum foil or plastic wrap to prevent air exposure.',
    foodSafetyNotes: 'Cook to a safe internal temperature of 71°C. Always wash hands and utensils thoroughly.'
  },
  fish: {
    name: 'Fish',
    emoji: '🐟',
    shelfLife: {
      roomTemp: 'Not recommended.',
      refrigerator: 'Raw: 1–2 days; Cooked: 3–4 days.',
      freezer: 'Raw fish: 3–6 months.'
    },
    storageMethod: 'Store raw fish wrapped tightly on a bed of ice in the refrigerator bottom drawer.',
    spoilageSigns: 'Sour, ammonia-like, or overly "fishy" smell, slimy texture, or dull cloudy eyes.',
    freshnessTips: 'Rinse with cold water, pat dry with paper towels, and wrap tightly before storing.',
    foodSafetyNotes: 'Raw seafood is highly perishable. Ensure thorough cooking to 63°C to kill pathogens.'
  },
  prawns: {
    name: 'Prawns (Shrimp)',
    emoji: '🍤',
    shelfLife: {
      roomTemp: 'Not recommended.',
      refrigerator: 'Raw: 1–2 days; Cooked: 3–4 days.',
      freezer: 'Raw: 3–6 months.'
    },
    storageMethod: 'Seal raw prawns in airtight freezer bags on the bottom shelf of the fridge.',
    spoilageSigns: 'Unpleasant ammonia smell, soft mushy shell, black spots on shell, or dull look.',
    freshnessTips: 'Keep heads on until ready to prepare to retain fresh natural moisture.',
    foodSafetyNotes: 'Thaw safely in the refrigerator or under cold running water, never on the counter.'
  }
};

/**
 * 106 Supported Grocery Products Keywords
 */
export const RECOGNIZED_PRODUCTS = new Set([
  'onion', 'onions', 'tomato', 'tomatoes', 'potato', 'potatoes', 'carrot', 'carrots', 'cabbage', 'cabbages',
  'cauliflower', 'cauliflowers', 'broccoli', 'spinach', 'beetroot', 'beetroots', 'radish', 'radishes', 'brinjal', 'brinjals',
  'okra', 'okras', 'pumpkin', 'pumpkins', 'cucumber', 'cucumbers', 'capsicum', 'capsicums', 'green chilli', 'green chillies',
  'garlic', 'ginger', 'corn', 'peas', 'beans', 'mushroom', 'mushrooms', 'sweet potato', 'sweet potatoes', 'bottle gourd',
  'bottle gourds', 'bitter gourd', 'bitter gourds', 'ridge gourd', 'ridge gourds', 'drumstick', 'drumsticks', 'lettuce',
  'mint', 'coriander', 'apple', 'apples', 'banana', 'bananas', 'mango', 'mangoes', 'orange', 'oranges', 'grapes',
  'watermelon', 'watermelons', 'papaya', 'papayas', 'pineapple', 'pineapples', 'guava', 'guavas', 'pomegranate', 'pomegranates',
  'kiwi', 'kiwis', 'pear', 'pears', 'strawberry', 'strawberries', 'blueberry', 'blueberries', 'coconut', 'coconuts',
  'lemon', 'lemons', 'milk', 'curd', 'yogurt', 'butter', 'cheese', 'paneer', 'cream', 'ghee', 'ice cream',
  'chicken', 'chicken breast', 'chicken curry cut', 'mutton', 'lamb', 'goat meat', 'beef', 'pork', 'turkey', 'duck',
  'fish', 'rohu', 'katla', 'salmon', 'tuna', 'sardine', 'mackerel', 'prawns', 'shrimp', 'crab', 'lobster',
  'chicken eggs', 'duck eggs', 'quail eggs', 'rice', 'basmati rice', 'brown rice', 'wheat', 'ragi', 'jowar', 'bajra', 'oats',
  'toor dal', 'urad dal', 'moong dal', 'chana dal', 'masoor dal', 'rajma', 'chickpeas', 'turmeric', 'chilli powder',
  'coriander powder', 'garam masala', 'pepper', 'cumin', 'bread', 'biscuits', 'noodles', 'pasta', 'cereals', 'snacks'
]);

/**
 * Format profile into the exact requested layout string
 */
export function formatGroceryProfile(profile: IGroceryProfile): string {
  return `${profile.emoji} ${profile.name}

Shelf Life:
* Room temperature: ${profile.shelfLife.roomTemp}
* Refrigerator: ${profile.shelfLife.refrigerator}
* Freezer: ${profile.shelfLife.freezer}

Storage Method:
* ${profile.storageMethod}

Spoilage Signs:
* ${profile.spoilageSigns}

Freshness Tips:
* ${profile.freshnessTips}

Food Safety Notes:
* ${profile.foodSafetyNotes}`;
}
