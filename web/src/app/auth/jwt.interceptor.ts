import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';


@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(private authenticationService: AuthService) {
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // add authorization header with jwt token if available
    const currentSession = this.authenticationService.currentSessionValue;
    if (currentSession && currentSession.user && currentSession.accessToken) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${currentSession.accessToken}`
        }
      });
    }

    return next.handle(request);
  }
}
