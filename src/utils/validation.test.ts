import { describe, it, expect } from "vitest";
import { validateHomeserver, buildHomeserverUrl } from "./validation";

describe("validateHomeserver", () => {
  describe("valid inputs", () => {
    it("accepts valid domain names", () => {
      expect(validateHomeserver("matrix.org")).toBe("matrix.org");
      expect(validateHomeserver("my-server.example.com")).toBe("my-server.example.com");
      expect(validateHomeserver("sub.domain.co.uk")).toBe("sub.domain.co.uk");
    });

    it("accepts localhost", () => {
      expect(validateHomeserver("localhost")).toBe("localhost");
      expect(validateHomeserver("localhost:8008")).toBe("localhost:8008");
    });

    it("accepts IP addresses", () => {
      expect(validateHomeserver("192.168.1.1")).toBe("192.168.1.1");
      expect(validateHomeserver("192.168.1.1:8448")).toBe("192.168.1.1:8448");
    });

    it("accepts domains with ports", () => {
      expect(validateHomeserver("matrix.org:8448")).toBe("matrix.org:8448");
    });

    it("strips protocol prefixes", () => {
      expect(validateHomeserver("https://matrix.org")).toBe("matrix.org");
      expect(validateHomeserver("http://matrix.org")).toBe("matrix.org");
      expect(validateHomeserver("HTTPS://Matrix.ORG")).toBe("Matrix.ORG");
    });

    it("strips trailing slashes", () => {
      expect(validateHomeserver("matrix.org/")).toBe("matrix.org");
      expect(validateHomeserver("matrix.org///")).toBe("matrix.org");
    });

    it("trims whitespace", () => {
      expect(validateHomeserver("  matrix.org  ")).toBe("matrix.org");
      expect(validateHomeserver("\tmatrix.org\n")).toBe("matrix.org");
    });
  });

  describe("invalid inputs", () => {
    it("rejects empty input", () => {
      expect(validateHomeserver("")).toBeNull();
      expect(validateHomeserver("   ")).toBeNull();
    });

    it("rejects invalid hostnames", () => {
      expect(validateHomeserver("not a domain")).toBeNull();
      expect(validateHomeserver("-invalid.com")).toBeNull();
      expect(validateHomeserver("invalid-.com")).toBeNull();
    });

    it("rejects single-label domains (except localhost)", () => {
      expect(validateHomeserver("matrix")).toBeNull();
    });

    it("rejects javascript: protocol injection", () => {
      expect(validateHomeserver("javascript:alert(1)")).toBeNull();
    });

    it("rejects data: protocol injection", () => {
      expect(validateHomeserver("data:text/html,<script>")).toBeNull();
    });

    it("rejects HTML/script injection", () => {
      expect(validateHomeserver("<script>alert(1)</script>")).toBeNull();
      expect(validateHomeserver("matrix.org<script>")).toBeNull();
    });

    it("rejects path traversal attempts", () => {
      expect(validateHomeserver("matrix.org/../etc/passwd")).toBeNull();
    });

    it("rejects dangerous characters", () => {
      expect(validateHomeserver('matrix.org"')).toBeNull();
      expect(validateHomeserver("matrix.org'")).toBeNull();
      expect(validateHomeserver("matrix.org<")).toBeNull();
      expect(validateHomeserver("matrix.org>")).toBeNull();
      expect(validateHomeserver("matrix.org`")).toBeNull();
    });
  });
});

describe("buildHomeserverUrl", () => {
  it("prepends https:// to hostname", () => {
    expect(buildHomeserverUrl("matrix.org")).toBe("https://matrix.org");
  });

  it("works with ports", () => {
    expect(buildHomeserverUrl("localhost:8008")).toBe("https://localhost:8008");
  });

  it("works with IP addresses", () => {
    expect(buildHomeserverUrl("192.168.1.1:8448")).toBe("https://192.168.1.1:8448");
  });
});
