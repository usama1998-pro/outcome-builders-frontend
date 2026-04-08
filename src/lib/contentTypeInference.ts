/**
 * Heuristic match: infer best content type slug from conversation text (user + assistant).
 * Used when creating content from chat; user can override in the picker.
 */

const SLUG_KEYWORDS: Record<string, readonly string[]> = {
    brand_script: [
        "brandscript",
        "storybrand",
        "7-part",
        "seven part",
        "character",
        "guide",
        "call to action",
        "brand script",
    ],
    tagline: ["tagline", "tag line", "slogan", "catchphrase", "catch phrase"],
    product_service_name: [
        "product name",
        "service name",
        "name for",
        "naming",
        "what should we call",
    ],
    product_service_descriptions: [
        "product description",
        "service description",
        "describe the product",
        "features and benefits",
        "overview",
    ],
    packaging_copy: ["packaging", "package copy", "label copy", "front panel"],
    website_wireframe: [
        "landing page",
        "wireframe",
        "website",
        "hero section",
        "above the fold",
        "homepage",
    ],
    lead_generator_ideas: [
        "lead magnet",
        "lead generator",
        "free download",
        "opt-in",
        "checklist idea",
    ],
    lead_generating_pdf: ["pdf", "e-book", "ebook", "guide pdf", "downloadable guide"],
    domain_name_suggestions: ["domain", "url", "website name", ".com"],
    sales_email: ["sales email", "cold email", "email sequence", "outreach email"],
    sales_talking_points: ["talking points", "sales script", "pitch", "objection"],
    one_liner: ["one-liner", "one liner", "elevator pitch", "what we do in one sentence"],
    video_scripts: ["video script", "youtube", "reel", "tiktok", "vsl", "on camera"],
    social_post_captions: ["social post", "instagram", "linkedin post", "caption", "hashtag", "stop the scroll"],
    brand_product_story: ["brand story", "about us", "our story", "storybrand", "origin story"],
    nurture_emails: ["nurture", "drip campaign", "email series", "follow-up email", "newsletter sequence"],
};

export function inferContentTypeId(text: string): string {
    const lower = text.toLowerCase();
    let bestSlug = "brand_script";
    let bestScore = 0;

    for (const [slug, keywords] of Object.entries(SLUG_KEYWORDS)) {
        let score = 0;
        for (const kw of keywords) {
            if (lower.includes(kw)) score += kw.length;
        }
        if (score > bestScore) {
            bestScore = score;
            bestSlug = slug;
        }
    }

    return bestSlug;
}
