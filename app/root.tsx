import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Layout as AppLayout } from "~/components/layout";
import { getSession, getUserIdFromSession } from "~/services/session.server";
import { prisma } from "~/services/prisma.server";
import { getCart } from "~/services/cart.server";

export const links: Route.LinksFunction = () => [
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap",
  },
];

export async function loader({ request }: Route.LoaderArgs) {
  const session = await getSession(request);
  const sessionId = session.get('id');
  const userId = await getUserIdFromSession(request);

  let user = null;
  let cartItemCount = 0;

  // Get user data if authenticated
  if (userId) {
    const dbUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true },
    });
    if (dbUser) {
      user = {
        name: dbUser.email.split('@')[0], // Use email prefix as name
        email: dbUser.email,
      };
    }
  }

  // Get cart count
  if (sessionId) {
    try {
      const cart = await getCart(sessionId);
      cartItemCount = cart.itemCount;
    } catch {
      // Ignore cart errors
    }
  }

  return {
    isAuthenticated: !!userId,
    user,
    cartItemCount,
  };
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const { isAuthenticated, user, cartItemCount } = useLoaderData<typeof loader>();

  return (
    <AppLayout
      headerProps={{
        isAuthenticated,
        user,
        cartItemCount,
      }}
    >
      <Outlet />
    </AppLayout>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
