import { QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider } from "react-router-dom";
import { Toaster } from "sonner";
import { router } from "./app/router";
import { studioQueryClient } from "./services/queryClient";

export default function RootApp() {
  return (
    <QueryClientProvider client={studioQueryClient}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "var(--studio-panel)",
            border: "1px solid var(--studio-border)",
            color: "var(--studio-text)",
            fontFamily: "inherit",
            fontSize: "12px",
          },
        }}
      />
    </QueryClientProvider>
  );
}
