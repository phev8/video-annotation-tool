import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';
import { config } from '../config';

declare const module: any;

const bootstrap = async () => {
  const app = await NestFactory.create(ApplicationModule);

  app.enableCors({ origin: config.origins });

  await app.listen(config.expressPort);

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
};

bootstrap()
  .then((() => {

      console.log(config);

    }),
    (reason) => {
      console.error(reason);
    });
