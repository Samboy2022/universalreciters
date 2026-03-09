import { useEffect } from "react";
import { useCMSSettings } from "@/hooks/useCMSSettings";

/**
 * Injects dynamic SEO meta tags and CSS theme variables from CMS settings.
 * Mount once near the root of the app.
 */
const SeoAndThemeManager = () => {
  const { data: cms } = useCMSSettings();

  // Update document title + meta tags
  useEffect(() => {
    if (!cms) return;

    // Title
    if (cms.seo_title) document.title = cms.seo_title;

    // Meta description
    let metaDesc = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.name = "description";
      document.head.appendChild(metaDesc);
    }
    if (cms.seo_description) metaDesc.content = cms.seo_description;

    // OG title
    let ogTitle = document.querySelector<HTMLMetaElement>('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement("meta");
      ogTitle.setAttribute("property", "og:title");
      document.head.appendChild(ogTitle);
    }
    if (cms.seo_title) ogTitle.content = cms.seo_title;

    // OG description
    let ogDesc = document.querySelector<HTMLMetaElement>('meta[property="og:description"]');
    if (!ogDesc) {
      ogDesc = document.createElement("meta");
      ogDesc.setAttribute("property", "og:description");
      document.head.appendChild(ogDesc);
    }
    if (cms.seo_description) ogDesc.content = cms.seo_description;

    // OG image
    if (cms.seo_og_image) {
      let ogImage = document.querySelector<HTMLMetaElement>('meta[property="og:image"]');
      if (!ogImage) {
        ogImage = document.createElement("meta");
        ogImage.setAttribute("property", "og:image");
        document.head.appendChild(ogImage);
      }
      ogImage.content = cms.seo_og_image;
    }
  }, [cms?.seo_title, cms?.seo_description, cms?.seo_og_image]);

  // Apply CSS custom properties for dynamic theming
  useEffect(() => {
    if (!cms) return;

    const root = document.documentElement;

    if (cms.theme_primary_hsl) {
      root.style.setProperty("--primary", cms.theme_primary_hsl);
    }
    if (cms.theme_accent_hsl) {
      root.style.setProperty("--accent", cms.theme_accent_hsl);
    }
  }, [cms?.theme_primary_hsl, cms?.theme_accent_hsl]);

  return null;
};

export default SeoAndThemeManager;
