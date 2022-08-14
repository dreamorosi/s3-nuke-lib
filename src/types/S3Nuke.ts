import type { Logger } from "@aws-lambda-powertools/logger";
import type { Tracer } from "@aws-lambda-powertools/tracer";
import type { S3Client } from "@aws-sdk/client-s3";

type VersioningEnabled = "Enabled" | "Disabled" | "Detect";

type LoggerObject = Logger | Console;

type TracerObject = Tracer;

type S3NukeOptions = {
  versioningEnabled: VersioningEnabled;
  s3Client?: S3Client;
  logger?: Logger;
  tracer?: Tracer;
};

export type { VersioningEnabled, S3NukeOptions, LoggerObject, TracerObject };
