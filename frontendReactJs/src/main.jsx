import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";

import "./index.css";

import App from "./App.jsx";
import store from "./store/store.js";
import Protected from "./components/Protected.jsx";

import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import TailorStudio from "./pages/TailorStudio.jsx";
import Pricing from "./pages/Pricing.jsx";
import Profile from "./pages/Profile.jsx";
import ResumeViewer from "./pages/ResumeViewer.jsx";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      {
        path: "/",
        element: <Landing />,
      },
      {
        path: "/pricing",
        element: <Pricing />,
      },
      {
        path: "/profile",
        element: (
          <Protected authentication={true}>
            <Profile />
          </Protected>
        ),
      },
      {
        path: "/login",
        element: (
          <Protected authentication={false}>
            <Login />
          </Protected>
        ),
      },
      {
        path: "/register",
        element: (
          <Protected authentication={false}>
            <Register />
          </Protected>
        ),
      },
      {
        path: "/forgot-password",
        element: (
          <Protected authentication={false}>
            <ForgotPassword />
          </Protected>
        ),
      },
      {
        path: "/dashboard",
        element: (
          <Protected authentication={true}>
            <Dashboard />
          </Protected>
        ),
      },
      {
        path: "/studio",
        element: (
          <Protected authentication={true}>
            <TailorStudio />
          </Protected>
        ),
      },
      {
        path: "/studio/:applicationId",
        element: (
          <Protected authentication={true}>
            <TailorStudio />
          </Protected>
        ),
      },
      {
        path: "/resume/:applicationId",
        element: (
          <Protected authentication={true}>
            <ResumeViewer />
          </Protected>
        ),
      },
      {
        path: "*",
        element: <Navigate to="/" replace />,
      },
    ],
  },
]);

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  </StrictMode>
);
