import { useEffect, useState } from "react";
import {
  getStoredAuthToken,
  isTokenExpired,
  isStoredUserAdmin,
} from "../services/authSession";
import { getStudioApiBaseUrl } from "../services/apiConfig";

/**
 * React hook that returns true only if the user is authenticated with an admin role.
 * Initializes synchronously from the stored token to avoid layout shifts, validates
 * with the server /auth/me endpoint if available, and listens to storage/auth events.
 */
export function useIsAdmin(): boolean {
  const [isAdmin, setIsAdmin] = useState<boolean>(() => isStoredUserAdmin());

  useEffect(() => {
    let cancelled = false;

    const checkAdmin = () => {
      const admin = isStoredUserAdmin();
      if (!cancelled) {
        setIsAdmin(admin);
      }
    };

    checkAdmin();

    const token = getStoredAuthToken();
    if (token && !isTokenExpired(token)) {
      fetch(`${getStudioApiBaseUrl()}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data: { user?: { isAdmin?: boolean } } | null) => {
          if (!cancelled && data?.user) {
            setIsAdmin(Boolean(data.user.isAdmin));
          }
        })
        .catch(() => {
          // If offline or network error, retain the stored token evaluation
        });
    }

    const onStorage = (event: StorageEvent) => {
      if (!event.key || event.key === "clypra_auth_token") {
        checkAdmin();
      }
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("clypra-auth-refreshed", checkAdmin);

    return () => {
      cancelled = true;
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("clypra-auth-refreshed", checkAdmin);
    };
  }, []);

  return isAdmin;
}
