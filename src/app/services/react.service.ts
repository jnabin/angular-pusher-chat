import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReactService {
  api: string = `${environment.baseUrl}`;

  constructor(private http: HttpClient) { }

  reactMessage(messageId: number, userId: number, channelName: string, reactContent: string): Observable<any> {
    return this.http.post(`${this.api}reacts`, {
      messageId: messageId,
      userId: userId,
      reactContent: reactContent,
      channelName: channelName
    });
  }
}
