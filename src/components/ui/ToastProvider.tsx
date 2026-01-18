import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  return (
    <Toaster
      position="top-center"
      toastOptions={{
        duration: 1800,
        style: {
          borderRadius: "16px",
          fontWeight: 900,
          padding: "12px 16px",
          background: "#0f172a",
          color: "#fff",
          boxShadow: "0 18px 50px rgba(0,0,0,0.25)",
        },
        success: {
          iconTheme: {
            primary: "#22c55e",
            secondary: "#0f172a",
          },
        },
        error: {
          iconTheme: {
            primary: "#ef4444",
            secondary: "#0f172a",
          },
        },
      }}
    />
  );
}
