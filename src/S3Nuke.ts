import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
  DeleteBucketCommand,
  ListObjectVersionsCommand,
  _Object,
} from "@aws-sdk/client-s3";
import type {
  S3NukeOptions,
  VersioningEnabled,
  LoggerObject,
  TracerObject,
} from "./types";

class S3Nuke {
  private versioningEnabled: VersioningEnabled;
  private s3Client: S3Client;
  private logger: LoggerObject;
  private tracer?: TracerObject;
  private s3Bucket?: string;

  constructor(options: S3NukeOptions = { versioningEnabled: "Detect" }) {
    this.setOptions(options);
  }

  private setOptions = (options: S3NukeOptions) => {
    this.versioningEnabled = options.versioningEnabled;
    this.s3Client = options.s3Client || new S3Client({});
    this.logger = options.logger || console;
    this.tracer = options.tracer;
  };

  private async getObjectVersions(objectKey: string) {
    const params = {
      Bucket: this.s3Bucket,
      Prefix: objectKey,
    };
    const { Versions } = await this.s3Client.send(
      new ListObjectVersionsCommand(params)
    );
    return Versions;
  }

  private async getObjects(continuationToken?: string) {
    const { Contents, IsTruncated, NextContinuationToken, KeyCount } =
      await this.s3Client.send(
        new ListObjectsV2Command({
          Bucket: this.s3Bucket,
          MaxKeys: 2,
          ContinuationToken: continuationToken,
        })
      );

    if (KeyCount === 0 || Contents == undefined) {
      return {
        objects: [],
      };
    }

    let objects = (
      await Promise.all(
        Contents.map(
          async (object) => await this.getObjectVersions(object.Key as string)
        )
      )
    ).flat();

    if (IsTruncated && NextContinuationToken) {
      let { objects: subObjects } = await this.getObjects(
        NextContinuationToken
      );
      objects = objects.concat(subObjects);
    }

    return {
      objects,
    };
  }

  private async deleteObjects(objects: _Object[]) {
    const MAX_OBJECTS_PER_DELETE = 1000;
    for (let i = 0; i < objects.length; i += MAX_OBJECTS_PER_DELETE) {
      const objectsWindow = objects.slice(i, i + MAX_OBJECTS_PER_DELETE);

      await this.s3Client.send(
        new DeleteObjectsCommand({
          Bucket: this.s3Bucket,
          Delete: {
            Objects: objectsWindow.map((object) => ({
              Key: object.Key,
              VersionId: object.VersionId,
            })),
          },
          // BypassGovernanceRetention: true,
        })
      );
    }
  }

  public async run(s3Bucket: string) {
    this.s3Bucket = s3Bucket;
    const { objects } = await this.getObjects(s3Bucket);
    await this.deleteObjects(objects);
    this.logger.info(`Deleted ${objects.length} objects`);
    await this.s3Client.send(new DeleteBucketCommand({ Bucket: s3Bucket }));
    this.logger.info(`Deleted bucket ${s3Bucket}`);
  }
}

export { S3Nuke };
