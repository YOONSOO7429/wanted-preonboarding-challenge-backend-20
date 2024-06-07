import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { HttpExceptionFilter } from './middlewares/http-Exception.filter';
import { APP_FILTER } from '@nestjs/core';
import { ProductModule } from './product/product.module';
import { AuthMiddleware } from './middlewares/auth.middleware';
import { JwtService } from '@nestjs/jwt';
import { OrderModule } from './order/order.module';
import { SignInMiddleware } from './middlewares/signIn.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        type: 'mysql',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        // synchronize: false,
      }),
      inject: [ConfigService],
    }),
    UserModule,
    ProductModule,
    OrderModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    JwtService,
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(AuthMiddleware).forRoutes(
      // product
      { path: 'product', method: RequestMethod.POST },
      { path: 'product/:productId', method: RequestMethod.PUT },
      // order
      { path: 'order/:productId', method: RequestMethod.POST },
      { path: 'order/purchasedList', method: RequestMethod.GET },
      { path: 'order/reservedList', method: RequestMethod.GET },
      { path: 'order/:productId', method: RequestMethod.PUT },
    );

    consumer
      .apply(SignInMiddleware)
      .forRoutes({ path: 'product/:productId', method: RequestMethod.GET });
  }
}
