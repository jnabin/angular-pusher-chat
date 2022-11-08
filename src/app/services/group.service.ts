import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GroupService {
  api: string = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private auth: AuthService) { }

  getGroup(id: number): Observable<any>{ 
    return this.http.get(`${this.api}groups/${id}`);
  }

  getUsersByGroup(id: number): Observable<{userId: number, userName: string}[]>{ 
    return this.http.get<{userId: number, userName: string}[]>(`${this.api}usersByGroup/${id}`);
  }

  getGroupsByUser(id: number): Observable<{groupId: number, groupName: string}[]>{ 
    return this.http.get<{groupId: number, groupName: string}[]>(`${this.api}groupsByUser/${id}`);
  }

  allGroups(): Observable<any>{ 
    return this.http.get(`${this.api}groups`);
  }

  createGroup(fromUserId: number, userIds: number[], name: string): Observable<any>{ 
    return this.http.post(`${this.api}groups`, {
      userIds: userIds,
      name: name,
      fromUserId: fromUserId
    });
  }

  updateGroup(userIds: number[], name: string, isUpdateUsers: boolean, groupId: number) {
    return this.http.put(`${this.api}groups`, {
      userIds: userIds,
      name: name,
      groupId: groupId,
      isUpdateUsers: isUpdateUsers
    });
  }

  deleteGroup(id: number): Observable<any> {
    return this.http.delete(`${this.api}groups/${id}`);
  }
}
