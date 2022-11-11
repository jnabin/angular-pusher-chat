import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { AuthService } from './auth.service';
import { map, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  api: string = `${environment.baseUrl}`;

  constructor(private http: HttpClient, private auth: AuthService) { }

  sendMessage(fromUserId: number, toUserId: number, message: string, sessionId: number, username: string, chanelName: string, groupChatId: number, isReply: boolean, parentMessageId: any): Observable<any>{
    let messageType = '';
    if(isReply) {
      messageType = 'reply';
    } else {
      parentMessageId = null;
    }
    
    return this.http.post(`${this.api}messages`, {
      fromUserId: fromUserId,
      toUserId: toUserId,
      message: message,
      sessionId: sessionId,
      username: username,
      chanelName: chanelName,
      groupChatId: groupChatId,
      messageType: messageType,
      parentMessageId: parentMessageId
    });
  }

  publishUserTyping(username: string, fromUserId:number, user_one_id: number, user_two_id: number, chanelName: string): Observable<any>{
    //console.log(chanelName);
    return this.http.post(`${this.api}userTyping`, {
      username: username,
      fromUserId: fromUserId,
      user_one_id: user_one_id,
      user_two_id: user_two_id,
      chanelName: chanelName
    });
  }

  requestSession(toUserId: number, fromUserId:number, user_one_id: number, user_two_id: number): Observable<any>{
    return this.http.post(`${this.api}sessions`, {
      to_user_id: toUserId,
      from_user_id: fromUserId,
      user_one_id: user_one_id,
      user_two_id: user_two_id
    }).pipe( map((res: any) => {
      (res.messages as any[]).forEach(m => {
        let date = new Date(m.time);
        m.time = date;
        m.date = `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`;
        m.rawTime = `${date.getMonth()}/${date.getDate()}/${date.getFullYear()} ${this.getTimeWithPmAM(date)}`
      });
      return res;
    }));
  }

  sessionMessages(user_one_id: number, user_two_id: number): Observable<any>{
    return this.http.post(`${this.api}sessionMessages`, {
      user_one_id: user_one_id,
      user_two_id: user_two_id
    }).pipe( map((res: any) => {
      (res.messages as any[]).forEach(m => {
        let date = new Date(m.time);
        m.time = date;
        m.date = `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`;
        m.rawTime = `${date.getMonth()}/${date.getDate()}/${date.getFullYear()} ${this.getTimeWithPmAM(date)}`;
      });
      return res;
    }));
  }

  groupMessages(groupId: number): Observable<{messages: any[]}>{
    return this.http.post<{messages: any}>(`${this.api}groupMessages`, {
      groupId: groupId,
    }).pipe( map((res: any) => {
      (res.messages as any[]).forEach(m => {
        let date = new Date(m.time);
        m.time = date;
        m.date = `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`;
        m.rawTime = `${date.getMonth()}/${date.getDate()}/${date.getFullYear()} ${this.getTimeWithPmAM(date)}`
      });
      return res;
    }));
  }

  groupMessagesWithChannel(groupId: number, userIds: number[], fromUserId: number): Observable<{messages: any[]}>{
    return this.http.post<{messages: any}>(`${this.api}groupMessagesWithChannel`, {
      groupId: groupId,
      userIds: userIds,
      fromUserId: fromUserId
    });
  }

  getTimeWithPmAM(date: Date){
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
