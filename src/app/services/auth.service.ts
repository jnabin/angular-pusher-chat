import { HttpClient, HttpRequest } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  api: string = `${environment.baseUrl}`;
  cachedRequests: Array<HttpRequest<any>> = [];

  constructor(private http: HttpClient) { }

  signUp(user: {name: string, password: string}): Observable<{id: number, name: string}> {
    return this.http.post<{id: number, name: string}>(`${this.api}users`, user);
  }

  login(user: {name: string, password: string}): Observable<{name: string, id: number, accessToken: string, refreshToken: string, expiresIn: Date}>{
    return this.http.post<{name: string, id: number, accessToken: string, refreshToken: string, expiresIn: Date}>(`${this.api}login`, user);
  }

  getToken(){
    return localStorage.getItem('token_chat');
  }
  saveToken(token: string){
    localStorage.removeItem('token_chat');
    localStorage.setItem('token_chat', token);
  }
  getRefreshToken(){
    return localStorage.getItem('refreshToken_chat');
  }
  saveRefreshToken(token: string){
    localStorage.removeItem('refreshToken_chat');
    return localStorage.setItem('refreshToken_chat', token);
  }

  public getUser(): any {
    const user = localStorage.getItem('user_info');
    if (user) {
      return JSON.parse(user);
    }

    return {};
  }

  public collectFailedRequest(request: any): void {
    this.cachedRequests.push(request);
  }

  public retryFailedRequests(): void {
    // retry the requests. this method can
    // be called after the token is refreshed
  }
}
