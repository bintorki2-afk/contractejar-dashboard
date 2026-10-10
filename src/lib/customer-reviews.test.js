import { describe, expect, it } from "vitest";
import {
  buildReviewPayload,
  extractCustomerReviews,
  extractReviewsSettings,
  moveReviewIds,
  reviewsSummaryPreview,
} from "./customer-reviews";

describe("customer reviews (D7)", () => {
  it("extracts and sorts reviews by sort_order from the admin payload", () => {
    const res = {
      data: {
        success: true,
        data: {
          summary: { enabled: true, average: 4.7, count: 3000, label: "4.7 من 5 · أكثر من 3000 تقييم" },
          reviews: [
            { id: 2, name: "ب", text: "ت2", rating: 4, sort_order: 2, is_visible: 0 },
            { id: 1, name: "أ", text: "ت1", rating: "5", sort_order: 1, is_visible: 1, contract_type: "residential" },
          ],
        },
      },
    };
    const { summary, reviews } = extractCustomerReviews(res);
    expect(summary.label).toContain("4.7");
    expect(reviews.map((r) => r.id)).toEqual([1, 2]);
    expect(reviews[0]).toMatchObject({ rating: 5, is_visible: true, contract_type: "residential" });
    expect(reviews[1].is_visible).toBe(false);
  });

  it("settings fall back to 4.7 / 3000 / enabled", () => {
    expect(extractReviewsSettings({ data: { data: {} } })).toEqual({ reviews_enabled: true, reviews_average: 4.7, reviews_count: 3000 });
    expect(extractReviewsSettings({ data: { data: { reviews_enabled: "0", reviews_average: "4.5", reviews_count: "1200" } } })).toEqual({
      reviews_enabled: false,
      reviews_average: 4.5,
      reviews_count: 1200,
    });
  });

  it("preview text matches the site format", () => {
    expect(reviewsSummaryPreview({ reviews_average: 4.7, reviews_count: 3000 })).toBe("4.7 من 5 · أكثر من 3000 تقييم");
    expect(reviewsSummaryPreview({ reviews_average: 5, reviews_count: 10 })).toBe("5 من 5 · أكثر من 10 تقييم");
  });

  it("builds a clean payload (rating clamped, empty city/type → null)", () => {
    expect(buildReviewPayload({ name: " عبدالملك س. ", text: " ممتاز ", rating: 9, city: " ", contract_type: "", is_visible: false })).toEqual({
      name: "عبدالملك س.",
      text: "ممتاز",
      rating: 5,
      city: null,
      contract_type: null,
      is_visible: false,
    });
  });

  it("moves an id up/down for reorder", () => {
    const list = [{ id: 1 }, { id: 2 }, { id: 3 }];
    expect(moveReviewIds(list, 2, "up")).toEqual([2, 1, 3]);
    expect(moveReviewIds(list, 2, "down")).toEqual([1, 3, 2]);
    expect(moveReviewIds(list, 1, "up")).toBeNull();
  });
});
