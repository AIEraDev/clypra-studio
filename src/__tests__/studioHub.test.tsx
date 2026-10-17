import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { StudioHub, standardDestinations, adminDestinations } from "../components/StudioHub";
import { AUTH_TOKEN_KEY } from "../services/authSession";
import { AdminRoute } from "../app/routeShell";

function createMockJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = btoa(JSON.stringify(payload));
  return `${header}.${body}.mockSignature`;
}

describe("StudioHub Single List & Admin-Only Visibility", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("renders all 11 standard workspaces in a single list for unauthenticated users", () => {
    render(
      <MemoryRouter>
        <StudioHub />
      </MemoryRouter>
    );

    // Title and hub structure
    expect(screen.getByText("Choose a workspace")).toBeInTheDocument();
    expect(screen.getByText("Studio destinations")).toBeInTheDocument();

    // Verify all 11 standard workspaces are rendered
    for (const destination of standardDestinations) {
      expect(screen.getByText(destination.label)).toBeInTheDocument();
    }
    expect(standardDestinations).toHaveLength(11);

    // Verify no admin destinations (including Animation Lab) are rendered
    for (const adminDest of adminDestinations) {
      expect(screen.queryByText(adminDest.label)).not.toBeInTheDocument();
    }
    expect(screen.queryByText("Animation Lab")).not.toBeInTheDocument();

    // Verify admin badge is not displayed
    expect(screen.queryByTestId("admin-badge")).not.toBeInTheDocument();
  });

  it("renders all 11 standard workspaces and hides admin workspaces for non-admin logged-in users", () => {
    const regularUserToken = createMockJwt({
      id: 42,
      username: "creator",
      email: "creator@example.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem(AUTH_TOKEN_KEY, regularUserToken);

    render(
      <MemoryRouter>
        <StudioHub />
      </MemoryRouter>
    );

    // Standard workspaces present
    expect(screen.getByText("Text Effects Lab")).toBeInTheDocument();
    expect(screen.getByText("Transition Lab")).toBeInTheDocument();
    expect(screen.getByText("Audio Library")).toBeInTheDocument();

    // Admin workspaces absent (including Animation Lab)
    expect(screen.queryByText("Animation Lab")).not.toBeInTheDocument();
    expect(screen.queryByText("Motion Graphics Studio")).not.toBeInTheDocument();
    expect(screen.queryByText("Performance Intelligence")).not.toBeInTheDocument();
    expect(screen.queryByText("Program Preview Performance")).not.toBeInTheDocument();
    expect(screen.queryByText("Admin Console")).not.toBeInTheDocument();
    expect(screen.queryByTestId("admin-badge")).not.toBeInTheDocument();
  });

  it("renders all 18 workspaces in a single list when user is logged in as admin", () => {
    const adminToken = createMockJwt({
      id: 1,
      username: "superadmin",
      email: "admin@clypra.com",
      isAdmin: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem(AUTH_TOKEN_KEY, adminToken);

    render(
      <MemoryRouter>
        <StudioHub />
      </MemoryRouter>
    );

    // Admin session badge is visible
    expect(screen.getByTestId("admin-badge")).toBeInTheDocument();
    expect(screen.getByText("Admin Session")).toBeInTheDocument();

    // Verify all 11 standard workspaces are present
    for (const destination of standardDestinations) {
      expect(screen.getByText(destination.label)).toBeInTheDocument();
    }

    // Verify all 7 admin destinations are present in the unified list (including Animation Lab)
    for (const adminDest of adminDestinations) {
      expect(screen.getByText(adminDest.label)).toBeInTheDocument();
    }
    expect(screen.getByText("Animation Lab")).toBeInTheDocument();

    expect(standardDestinations).toHaveLength(11);
    expect(adminDestinations).toHaveLength(7);
    expect(screen.getByText("18 available · shared native pipeline")).toBeInTheDocument();
  });

  it("filters workspaces in real-time using the search input", () => {
    const adminToken = createMockJwt({
      id: 1,
      username: "superadmin",
      email: "admin@clypra.com",
      isAdmin: true,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem(AUTH_TOKEN_KEY, adminToken);

    render(
      <MemoryRouter>
        <StudioHub />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("Filter workspaces…");

    // Filter by "text"
    fireEvent.change(searchInput, { target: { value: "text" } });
    expect(screen.getByText("Text Effects Lab")).toBeInTheDocument();
    expect(screen.getByText("Text Templates")).toBeInTheDocument();
    expect(screen.getByText("Text Performance")).toBeInTheDocument();
    expect(screen.queryByText("Audio Library")).not.toBeInTheDocument();
    expect(screen.queryByText("Sticker Lab")).not.toBeInTheDocument();

    // Clear filter button
    const clearBtn = screen.getByLabelText("Clear filter");
    fireEvent.click(clearBtn);
    expect(screen.getByText("Audio Library")).toBeInTheDocument();
    expect(screen.getByText("Sticker Lab")).toBeInTheDocument();
  });

  it("shows an empty state when search matches no workspaces", () => {
    render(
      <MemoryRouter>
        <StudioHub />
      </MemoryRouter>
    );

    const searchInput = screen.getByPlaceholderText("Filter workspaces…");
    fireEvent.change(searchInput, { target: { value: "xyznonexistent" } });

    expect(screen.getByText("No workspaces found")).toBeInTheDocument();
    const clearButtons = screen.getAllByRole("button", { name: "Clear filter" });
    expect(clearButtons.length).toBeGreaterThanOrEqual(1);

    // Clearing restores the standard list
    fireEvent.click(clearButtons[0]);
    expect(screen.getByText("Text Effects Lab")).toBeInTheDocument();
  });

  it("protects AdminRoute so non-admin users cannot access admin pages", async () => {
    // Non-admin user token
    const creatorToken = createMockJwt({
      id: 99,
      username: "creator",
      email: "creator@clypra.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem(AUTH_TOKEN_KEY, creatorToken);

    // Mock /auth/me returning non-admin user
    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: 99,
          username: "creator",
          email: "creator@clypra.com",
          createdAt: "2026-01-01",
          isAdmin: false,
        },
      }),
    } as Response);

    render(
      <MemoryRouter initialEntries={["/studio/admin"]}>
        <Routes>
          <Route
            path="/studio/admin"
            element={
              <AdminRoute label="Admin Console">
                <div data-testid="admin-secret-content">Secret Admin Area</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    // Admin content must NOT be shown
    expect(screen.queryByTestId("admin-secret-content")).not.toBeInTheDocument();
    // Access denied message is shown
    expect(await screen.findByText("Admin access denied")).toBeInTheDocument();
  });

  it("protects Animation Lab under AdminRoute so non-admin creators receive access denied", async () => {
    const creatorToken = createMockJwt({
      id: 99,
      username: "creator",
      email: "creator@clypra.com",
      isAdmin: false,
      exp: Math.floor(Date.now() / 1000) + 3600,
    });
    localStorage.setItem(AUTH_TOKEN_KEY, creatorToken);

    vi.spyOn(globalThis, "fetch").mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        user: {
          id: 99,
          username: "creator",
          email: "creator@clypra.com",
          createdAt: "2026-01-01",
          isAdmin: false,
        },
      }),
    } as Response);

    render(
      <MemoryRouter initialEntries={["/studio/animation-lab"]}>
        <Routes>
          <Route
            path="/studio/animation-lab"
            element={
              <AdminRoute label="the Animation Lab">
                <div data-testid="animation-lab-content">Animation Lab Admin Area</div>
              </AdminRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.queryByTestId("animation-lab-content")).not.toBeInTheDocument();
    expect(await screen.findByText("Admin access denied")).toBeInTheDocument();
  });
});

