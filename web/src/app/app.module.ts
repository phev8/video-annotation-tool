import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppComponent } from './app.component';
import { AppRouting } from './app.routing';
import { LayoutModule } from './layout/layout.module';
import { ProjectsModule } from './projects/projects.module';
import { EditorModule } from './editor/editor.module';
import { AuthModule } from './auth/auth.module';
import { ErrorInterceptor } from './auth/error.interceptor';
import { JwtInterceptor } from './auth/jwt.interceptor';
import { HotkeyModule } from 'angular2-hotkeys';
import { CanvasModule } from './canvas/canvas.module';
import {AlertService} from "./alert.service";


@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    HotkeyModule.forRoot({cheatSheetCloseEsc: true}),
    BrowserAnimationsModule,
    AppRouting,
    ClarityModule,
    AuthModule,
    LayoutModule,
    ProjectsModule,
    EditorModule,
    CanvasModule
  ],
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: JwtInterceptor, multi: true},
    {provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true},
    AlertService
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule {
}
