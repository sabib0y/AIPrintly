/**
 * Logout Route
 *
 * Handles user logout by destroying the session and redirecting to home.
 * Only accepts POST requests to prevent CSRF attacks via GET.
 */

import { redirect, type ActionFunctionArgs } from 'react-router';
import { getSession, destroySession } from '~/services/session.server';

export async function action({ request }: ActionFunctionArgs) {
  const session = await getSession(request);
  const header = await destroySession(session);

  return redirect('/', {
    headers: {
      'Set-Cookie': header,
    },
  });
}

export async function loader() {
  // GET requests should redirect to home
  return redirect('/');
}
