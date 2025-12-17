import { promisify } from 'node:util';
import {
  pipeline,
  type PipelineDestination,
  type PipelineSource,
} from 'node:stream';
import { InternalServerErrorException } from '@nestjs/common';

async function asyncPipeline({
  source,
  destination,
}: {
  source: PipelineSource<any>;
  destination: PipelineDestination<typeof source, any>;
}) {
  return promisify(pipeline)(source, destination).catch((error) => {
    throw new InternalServerErrorException(
      `Stream Pipeline Failed: ${(error as Error).message}`,
    );
  });
}

export default asyncPipeline;
