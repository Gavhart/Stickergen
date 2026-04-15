export interface Profile {
  id: string
  username: string | null
  avatar_url: string | null
  plan: 'free' | 'pro'
  stripe_customer_id: string | null
  stripe_subscription_id: string | null
  ai_uses_today: number
  ai_uses_reset_at: string
  created_at: string
  updated_at: string
}

export interface Ingredient {
  amount: string
  unit: string
  item: string
}

export interface Nutrition {
  calories: number
  protein: string
  carbs: string
  fat: string
  fiber?: string
  sodium?: string
}

export interface Recipe {
  id: string
  user_id: string
  title: string
  description: string | null
  ingredients: Ingredient[]
  steps: string[]
  servings: number
  prep_time: number | null
  cook_time: number | null
  tags: string[]
  image_url: string | null
  is_public: boolean
  source: 'manual' | 'ai'
  nutrition: Nutrition | null
  created_at: string
  updated_at: string
  profiles?: { username: string | null; avatar_url: string | null }
  saves_count?: number
  likes_count?: number
  is_saved?: boolean
  is_liked?: boolean
}

export const FREE_AI_LIMIT = 5

export const PLAN_FEATURES = {
  free: {
    label: 'Free',
    price: '$0',
    aiLimit: FREE_AI_LIMIT,
    features: [
      `${FREE_AI_LIMIT} AI recipe generations per day`,
      'Access to community feed',
      'Save & organize recipes',
      'Recipe scaling',
      'All recipes public',
    ],
  },
  pro: {
    label: 'Pro',
    price: '$4.99',
    aiLimit: Infinity,
    features: [
      'Unlimited AI recipe generations',
      'AI nutrition analysis per recipe',
      'Private recipes',
      'Access to community feed',
      'Save & organize recipes',
      'Recipe scaling',
    ],
  },
}

export const RECIPE_TAGS = [
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert',
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free',
  'quick', 'meal-prep', 'comfort food', 'healthy',
  'spicy', 'italian', 'mexican', 'asian', 'american',
]

export const CUISINE_SUGGESTIONS = [
  'pasta carbonara', 'chicken tikka masala', 'beef tacos',
  'mushroom risotto', 'greek salad', 'banana bread',
  'tom yum soup', 'shakshuka', 'fish and chips',
  'veggie stir fry', 'lemon garlic salmon', 'chocolate lava cake',
]
