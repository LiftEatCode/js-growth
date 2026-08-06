import {
    createFinding,
    type AuditRule,
  } from "../engine/types";
  
  export const imagesRule: AuditRule = {
    id: "images",
    category: "accessibility",
    title: "Image alternative text",
  
    evaluate({ pageData }) {
      if (pageData.imageCount === 0) {
        return createFinding({
          id: "no-images",
          title: "No images were detected",
          description:
            "The page does not contain any standard image elements.",
          status: "warning",
          category: "content",
          scoreImpact: 2,
          recommendation:
            "Consider adding relevant, optimized imagery where it would improve clarity, trust, or engagement.",
        });
      }
  
      if (pageData.imagesWithoutAlt === 0) {
        return createFinding({
          id: "image-alt-complete",
          title: "Images include alternative text",
          description: `All ${pageData.imageCount} detected images include alt attributes.`,
          status: "pass",
          category: "accessibility",
          scoreImpact: 6,
        });
      }
  
      const missingPercentage =
        pageData.imagesWithoutAlt / pageData.imageCount;
  
      return createFinding({
        id: "images-missing-alt",
        title: "Some images are missing alternative text",
        description: `${pageData.imagesWithoutAlt} of ${pageData.imageCount} images have missing or empty alt attributes.`,
        status:
          missingPercentage >= 0.5 ? "fail" : "warning",
        category: "accessibility",
        scoreImpact: 6,
        recommendation:
          "Add descriptive alt text to meaningful images. Decorative images may use an empty alt attribute when intentional.",
      });
    },
  };