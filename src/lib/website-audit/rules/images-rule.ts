import {
  createFinding,
  type AuditRule,
} from "../engine/types";
import {
  IMAGE_MISSING_ALT_HIGH_RATE,
  IMAGE_MISSING_ALT_LOW_RATE,
} from "../page-content";

export const imagesRule: AuditRule = {
  id: "images",
  category: "accessibility",
  title: "Image alternative text",

  evaluate({ pageData }) {
    const images = pageData.images;
    const total = images?.total ?? pageData.imageCount;
    const missingAltAttribute =
      images?.missingAltAttribute ?? pageData.imagesWithoutAlt;
    const suspiciousAlt = images?.suspiciousAlt ?? 0;

    if (total === 0) {
      return createFinding({
        id: "no-images",
        title: "No images were detected",
        description:
          "The page does not contain any standard image elements. Photos can help visitors understand the business, but they are not required on every page.",
        status: "warning",
        category: "content",
        scoreImpact: 2,
        priority: "low",
        businessImpact: "low",
        difficulty: "easy",
        estimatedFixMinutes: 30,
        quickWin: false,
        recommendation:
          "Add relevant photos where they would improve trust or clarity, such as completed work, the team, or the facility.",
      });
    }

    const findings = [];
    const missingRate = missingAltAttribute / total;

    if (missingAltAttribute === 0) {
      findings.push(
        createFinding({
          id: "image-alt-complete",
          title: "Images include alternative text attributes",
          description: `All ${total} detected images include an alt attribute. Empty alt can be appropriate for decorative images and is not treated as an SEO failure by itself.`,
          status: "pass",
          category: "accessibility",
          scoreImpact: 4,
        }),
      );
    } else if (missingRate >= IMAGE_MISSING_ALT_HIGH_RATE) {
      findings.push(
        createFinding({
          id: "images-missing-alt",
          title: "Many images are missing alternative text",
          description: `${missingAltAttribute} of ${total} images have no alt attribute (${Math.round(missingRate * 100)}%). That can make the page less accessible and give search engines less context for important photos.`,
          status: "warning",
          category: "accessibility",
          scoreImpact: 4,
          priority: "medium",
          businessImpact: "medium",
          difficulty: "easy",
          estimatedFixMinutes: 30,
          quickWin: false,
          recommendation:
            "Add a short description to meaningful photos. Decorative images can use an empty alt attribute, but every image should still have the attribute itself.",
        }),
      );
    } else if (missingRate >= IMAGE_MISSING_ALT_LOW_RATE) {
      findings.push(
        createFinding({
          id: "images-missing-alt",
          title: "Some images are missing alternative text",
          description: `${missingAltAttribute} of ${total} images have no alt attribute (${Math.round(missingRate * 100)}%). Empty alt is acceptable for decorative images; a missing attribute is the clearer issue.`,
          status: "warning",
          category: "accessibility",
          scoreImpact: 3,
          priority: "medium",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 20,
          quickWin: true,
          recommendation:
            "Add alt attributes to remaining images. Describe the photo when it communicates something useful; use empty alt when the image is purely decorative.",
        }),
      );
    } else {
      findings.push(
        createFinding({
          id: "images-missing-alt",
          title: "A small number of images are missing alternative text",
          description: `${missingAltAttribute} of ${total} images have no alt attribute. This is a limited issue and is not treated as a page-wide accessibility failure.`,
          status: "warning",
          category: "accessibility",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 10,
          quickWin: true,
          recommendation:
            "Add an alt attribute to the remaining images so every image is explicitly labeled or marked decorative.",
        }),
      );
    }

    if (
      missingRate < IMAGE_MISSING_ALT_HIGH_RATE &&
      (suspiciousAlt >= 2 ||
        (suspiciousAlt > 0 && total <= 3))
    ) {
      findings.push(
        createFinding({
          id: "images-suspicious-alt",
          title: "Some image descriptions look like filenames",
          description: `${suspiciousAlt} image ${suspiciousAlt === 1 ? "alt uses" : "alts use"} filename-style text such as IMG_2938.jpg. That is rarely useful for visitors or search engines.`,
          status: "warning",
          category: "accessibility",
          scoreImpact: 2,
          priority: "low",
          businessImpact: "low",
          difficulty: "easy",
          estimatedFixMinutes: 15,
          quickWin: true,
          recommendation:
            "Replace filename-style alt text with a short description of what the photo shows, or use empty alt if the image is decorative.",
        }),
      );
    }

    return findings;
  },
};
