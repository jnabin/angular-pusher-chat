import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  api: string = `${environment.baseUrl}`;

  constructor(private http: HttpClient) { }

  getAllUsers(){
    return this.http.get(`${this.api}users`);
  }

  getUsersWithLatestMessage(forUserId: number){
    return this.http.get(`${this.api}usersWithLatestMessage/${forUserId}`);
  }

}
