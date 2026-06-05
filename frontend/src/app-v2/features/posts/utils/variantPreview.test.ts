import { describe, expect, it } from "vitest";
import { SocialPlatform } from "../../content-posts/content-posts.types";
import {
  buildVariantContentJson,
  getPreviewDefinitionForPlatform,
  parseVariantContentJson,
} from "./variantPreview";

describe("variantPreview", () => {
  it("parses text and title from JSON", () => {
    const json = JSON.stringify({
      text: "Hello world",
      title: "Headline",
      platform: SocialPlatform.LinkedIn,
    });
    expect(parseVariantContentJson(json)).toEqual({
      text: "Hello world",
      title: "Headline",
      slides: [],
    });
  });

  it("falls back to caption and raw string", () => {
    expect(parseVariantContentJson('{"caption":"IG caption"}').text).toBe("IG caption");
    expect(parseVariantContentJson("plain text").text).toBe("plain text");
  });

  it("builds variant JSON with optional title and image", () => {
    const json = buildVariantContentJson(
      "Body",
      SocialPlatform.Facebook,
      "Title",
      "https://cdn.example.com/x.png"
    );
    const parsed = JSON.parse(json) as {
      text: string;
      platform: string;
      title?: string;
      imageUrl?: string;
    };
    expect(parsed.text).toBe("Body");
    expect(parsed.platform).toBe(SocialPlatform.Facebook);
    expect(parsed.title).toBe("Title");
    expect(parsed.imageUrl).toBe("https://cdn.example.com/x.png");
  });

  it("maps platform to preview definition", () => {
    const def = getPreviewDefinitionForPlatform(SocialPlatform.Instagram);
    expect(def.platform).toBe(SocialPlatform.Instagram);
    expect(def.format).toBe("post");
  });
});
