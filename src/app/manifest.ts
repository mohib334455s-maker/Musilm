import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Muslim Store | مسلم استور — عمده و پرچون مواد خوراکی",
    short_name: "Muslim Store",
    description:
      "فروشگاه آنلاین مواد خوراکی عمده و پرچون در مزارشریف؛ قیمت روشن، محاسبه خودکار قیمت عمده، سبد ماهانه و تحویل همان روز.",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0F5132",
    lang: "fa",
    dir: "rtl",
    categories: ["shopping", "business"],
    icons: [
      {
        src: "/brand/logo-mark.png",
        sizes: "394x394",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/brand/favicon.png",
        sizes: "64x64",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
