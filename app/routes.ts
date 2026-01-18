import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  // Landing page
  index("routes/_index.tsx"),

  // Authentication routes
  route("login", "routes/login.tsx"),
  route("register", "routes/register.tsx"),

  // Products routes
  route("products", "routes/products.tsx"),
  route("products/:category", "routes/products.$category.tsx"),

  // Creation hub
  route("create", "routes/create.tsx"),

  // Shopping cart
  route("cart", "routes/cart.tsx"),
] satisfies RouteConfig;
