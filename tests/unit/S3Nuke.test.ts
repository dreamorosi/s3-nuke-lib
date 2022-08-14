import { Console } from "console";
import { S3Client } from "@aws-sdk/client-s3";
import { S3Nuke } from "../../src";

describe("Class: S3Nuke", () => {
  const ENVIRONMENT_VARIABLES = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    process.env = { ...ENVIRONMENT_VARIABLES };
  });

  afterEach(() => {
    process.env = ENVIRONMENT_VARIABLES;
  });

  describe("Options", () => {
    test("when no options are passed, initializes with default options", () => {
      // Prepare
      const options = undefined;

      // Act
      const s3nuke = new S3Nuke(options);

      // Assert
      expect(s3nuke).toBeInstanceOf(S3Nuke);
      expect(s3nuke).toEqual(
        expect.objectContaining({
          versioningEnabled: "Detect",
          s3Client: S3Client,
          logger: Console,
          tracer: undefined,
        })
      );
    });
  });
});
