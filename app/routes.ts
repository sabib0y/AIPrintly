import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // ==========================================================================
  // Landing page
  // ==========================================================================
  index("routes/_index.tsx"),

  // ==========================================================================
  // Authentication routes
  // ==========================================================================
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),
  route("logout", "routes/logout.tsx"),

  // ==========================================================================
  // Account management
  // ==========================================================================
  route("account", "routes/account.tsx"),
  route("account/delete", "routes/account.delete.tsx"),

  // ==========================================================================
  // Products routes
  // ==========================================================================
  route("products", "routes/products.tsx"),
  route("products/:category", "routes/products.$category.tsx"),

  // ==========================================================================
  // Creation hub
  // ==========================================================================
  route("create", "routes/create.tsx"),
  route("create/upload", "routes/create.upload.tsx"),
  route("create/generate", "routes/create.generate.tsx"),

  // ==========================================================================
  // Product builder
  // ==========================================================================
  route("build/:productType", "routes/build.$productType.tsx"),
  route("build/storybook", "routes/build.storybook.tsx"),

  // ==========================================================================
  // Shopping cart
  // ==========================================================================
  route("cart", "routes/cart.tsx"),

  // ==========================================================================
  // Checkout
  // ==========================================================================
  route("checkout", "routes/checkout.tsx"),
  route("checkout/success", "routes/checkout.success.tsx"),
  route("checkout/cancelled", "routes/checkout.cancelled.tsx"),

  // ==========================================================================
  // Orders
  // ==========================================================================
  route("orders/:orderId", "routes/orders.$orderId.tsx"),

  // ==========================================================================
  // API Routes - Cart
  // ==========================================================================
  route("api/cart", "routes/api.cart.ts"),
  route("api/cart/add", "routes/api.cart.add.ts"),
  route("api/cart/items", "routes/api.cart.items.ts"),
  route("api/cart/items/:id", "routes/api.cart.items.$id.ts"),

  // ==========================================================================
  // API Routes - Products
  // ==========================================================================
  route("api/products", "routes/api.products.ts"),
  route("api/products/:id", "routes/api.products.$id.ts"),

  // ==========================================================================
  // API Routes - Assets
  // ==========================================================================
  route("api/assets/upload", "routes/api.assets.upload.ts"),

  // ==========================================================================
  // API Routes - AI Generation
  // ==========================================================================
  route("api/generate/image", "routes/api.generate.image.ts"),
  route("api/generate/image/:jobId", "routes/api.generate.image.$jobId.ts"),
  route("api/generate/story", "routes/api.generate.story.ts"),

  // ==========================================================================
  // API Routes - Credits
  // ==========================================================================
  route("api/credits", "routes/api.credits.ts"),

  // ==========================================================================
  // API Routes - Mockups
  // ==========================================================================
  route("api/mockups", "routes/api.mockups.ts"),

  // ==========================================================================
  // API Routes - Checkout
  // ==========================================================================
  route("api/checkout/create-session", "routes/api.checkout.create-session.ts"),

  // ==========================================================================
  // API Routes - Orders
  // ==========================================================================
  route("api/orders", "routes/api.orders.ts"),
  route("api/orders/:id", "routes/api.orders.$id.ts"),

  // ==========================================================================
  // API Routes - Webhooks
  // ==========================================================================
  route("api/webhooks/stripe", "routes/api.webhooks.stripe.ts"),
  route("api/webhooks/printful", "routes/api.webhooks.printful.ts"),
  route("api/webhooks/blurb", "routes/api.webhooks.blurb.ts"),

  // ==========================================================================
  // API Routes - Account
  // ==========================================================================
  route("api/account/delete", "routes/api.account.delete.ts"),

  // ==========================================================================
  // Catch-all 404
  // ==========================================================================
  route("*", "routes/$.tsx"),
] satisfies RouteConfig;
