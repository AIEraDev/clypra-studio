import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";

export default function RootApp() {
  return <RouterProvider router={router} future={{ v7_startTransition: true }} />;
}
