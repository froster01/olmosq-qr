import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Olmosq Coffee",
    short_name: "Olmosq",
    description: "QR ordering and staff operations for Olmosq Coffee.",
    id: "/",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#faf8f3",
    theme_color: "#496f2c",
    icons: [
      {
        src: "/icons/olmosq-icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/olmosq-icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/olmosq-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
