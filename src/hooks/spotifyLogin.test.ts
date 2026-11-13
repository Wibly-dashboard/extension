import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createCodeChallenge } from "./spotifyLogin";

describe("createCodeChallenge", () => {
  it.each(["dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWhOEjXk", "a".repeat(43), "x_-Y".repeat(32)])(
    "code_verifier %s 의 S256 code_challenge(base64url, 패딩 없음)를 만든다",
    async (verifier) => {
      const expected = createHash("sha256").update(verifier).digest("base64url");

      await expect(createCodeChallenge(verifier)).resolves.toBe(expected);
    },
  );
});
