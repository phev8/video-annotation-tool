import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { ProjectsComponent } from './projects/projects.component';
import { EditorComponent } from './editor/editor.component';
import { AuthGuard } from './auth/auth.guard';
import { AuthComponent } from './auth/auth.component';


const appRoutes: Routes = [
  {path: '', redirectTo: '/projects', pathMatch: 'full'},
  {path: 'auth', component: AuthComponent},
  // { filename: 'register', component: LoginComponent },
  {path: 'projects', component: ProjectsComponent, canActivate: [ AuthGuard ]},
  {path: 'editor/:id', component: EditorComponent, canActivate: [ AuthGuard ]},
  {path: '**', redirectTo: ''}
];

@NgModule({
  imports: [ RouterModule.forRoot(
    appRoutes,
    {
      enableTracing: false
    }
  ) ],
  exports: [ RouterModule ]
})
export class AppRouting {
}
