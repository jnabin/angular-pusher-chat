import { HttpEventType, HttpResponse } from '@angular/common/http';
import { AfterViewChecked, AfterViewInit, Component, ElementRef, Input, OnInit, QueryList, TemplateRef, ViewChild, ViewChildren } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import Pusher, { Channel, PresenceChannel } from 'pusher-js';
import { AuthService } from 'src/app/services/auth.service';
import { GroupService } from 'src/app/services/group.service';
import { MessageService } from 'src/app/services/message.service';
import { UploadFileService } from 'src/app/services/upload-file.service';
import { UserService } from 'src/app/services/user.service';
import { environment } from 'src/environments/environment';
import { EmojiService } from '@ctrl/ngx-emoji-mart/ngx-emoji';
import { ReactService } from 'src/app/services/react.service';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit, AfterViewInit {
  private myScrollContainer!: ElementRef;
  @ViewChild('scrollMe') set content(content: ElementRef) {
    if(content) { 
        this.myScrollContainer = content;
    }
  }
  @ViewChildren('messageList') messageList!: QueryList<any>;
  @ViewChild('playAudio') private playAudio!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  
  messages: any[] = [];
  replying = false;
  replyUserName = '';
  title = '';
  progress = 0;
  uploadMessage = '';
  replyMessage = '';
  replyMessageUrl = '';
  parentMessageId = 0;
  groupChatDialogRef!: MatDialogRef<any>;
  newGroupChat!: {name: string, users: any[]}; 
  closeConversation: boolean = true;
  openUserId!: number;
  privateChannels: {chanel: any, userId: number, chanelName: string, groupIds: number[], groupId: number}[] = [];
  privateChatIds: number[] = [];
  activeCount: number = 0;
  activeUserIds: string[] = [];
  expectedChatWith: any;
  //set = 'twitter';
  opponentUserId!: number;
  opponentChat!: any;
  users: any[] = [];
  conversations: any[] = []
  @Input() fromConversation: boolean = false;
  @Input() conversation: any = {
    name: '',
    messages: this.messages,
    time: '',
    latestMessage: '',
    latestMessageRead: true,
    status: true,
    photo: '',
    isSelected: false
  };
  userDetail!: {name: string, id: number};
  messageContent: string = '';
  toggleEmojiPicker: boolean = false;
  imageUrl: any;
  clearTimerId: any
  pusher!: Pusher;
  sessionId!: any;

  constructor(private auth: AuthService, 
              private messageService: MessageService, 
              private userService: UserService,
              private groupService: GroupService,
              private matDialog: MatDialog,
              private uploadService: UploadFileService,
              private reactService: ReactService) { }
  
  ngAfterViewInit(): void {
    this.scrollToBottom();
    this.messageList.changes.subscribe(res => {
      this.scrollToBottom();
    });
  }

  getProfilePhoto(myself: boolean): string {
    return myself ? '/assets/images/myself.svg' : '/assets/images/other.svg';
  }

  ngOnInit(): void {
    this.userDetail = this.auth.getUser();
    this.scrollToBottom();
    this.groupService.getGroupsByUser(this.userDetail.id).subscribe(res => {
      res.forEach(group => {
        this.conversations.push({
          name: group.groupName,
          id: group.groupId,
          isGroup: true
        })
      })
    }, err => {
      console.log(err);
    });
    this.userService.getUsersWithLatestMessage(this.userDetail.id).subscribe((res: any) => {
      this.users = (res as any[]).filter(x => x.id != this.userDetail.id);
      this.users.forEach(user => {
        let fileMessage =  user.fromUserId == this.userDetail.id ? 'you sent file' : 'attachment'; 
        this.conversations.push({
          name: user.name,
          id: user.id,
          isGroup: false,
          latestMessage: user.content?.length == 0 ? fileMessage : user.content,
          time: user.time,
        });
      })
    }, err => {
      console.log(err);
    });
  
    Pusher.logToConsole = true;
    this.pusher = new Pusher('7836396d54cdb2c2bcdd', {
      cluster: 'ap2',
      userAuthentication: {
        endpoint: "http://localhost:3000/pusher/user-auth",
        transport: "ajax",
        params: {
          user_id: this.auth.getUser().id,
          name: this.auth.getUser().name
        },
      },
      channelAuthorization: {
        endpoint: "http://localhost:3000/pusher/auth",
        transport: "ajax",
        params: {
          user_id: this.userDetail.id,
          name: this.userDetail.name
        },
      }
    });
    this.pusher.signin();

    const notifications = this.pusher.subscribe(`private-notifications-${this.userDetail.id}`);
    const forum: PresenceChannel = this.pusher.subscribe( 'presence-forum' ) as PresenceChannel;

    forum.bind(`new-message-to-${this.userDetail.id}`, (data: {fromUserId: number, message: string, isGroup: boolean, groupId: number}) => {
      if(!data.isGroup) {
        this.conversations.forEach(x => {
          if(x.id == data.fromUserId && !x.isGroup) {
            x.newMessage = true;
            let user = this.users.find(x => x.id == data.fromUserId);
            x.latestMessage = data.message.length == 0 ? `${user.name} has sent file` : data.message;
            this.playAudio.nativeElement.click();
          }
        })
      }
    });

    forum.bind(`group-new-message`, (data: {fromUserId: number, message: string, isGroup: boolean, groupId: number}) => {
      if(data.isGroup) {
        this.conversations.forEach(x => {
          if(x.id == data.groupId && x.isGroup && 
            this.userDetail.id != data.fromUserId) {
            x.newMessage = true;
            let user = this.users.find(x => x.id == data.fromUserId);
            x.latestMessage = data.message.length == 0 ? `${user.name} has sent file` : data.message;
            this.playAudio.nativeElement.click();
          }
        })
      }
    });

    forum.bind("pusher:subscription_succeeded", (members: any) => {
      this.activeCount += members.count;
    
      members.each((member: any) => {
        this.activeUserIds = this.addToArray(this.activeUserIds, member.id);
      });
    });

    forum.bind("pusher:member_added", (member: any) => {
      this.activeCount += 1;
      this.activeUserIds = this.addToArray(this.activeUserIds, member.id);
    });

    forum.bind("pusher:member_removed", (member: any) => {
      if(this.activeCount > 0) this.activeCount -= 1;
      this.activeUserIds = this.removeFromArray(this.activeUserIds, member.id);
    });

    notifications.bind( 'one-to-one-chat-request', (data: any) => {
      if( data.initiated_by === this.userDetail.id && this.opponentUserId == data.chat_with) {
        this.startPrivateChat( data.chat_with, data.channel_name );
      } else if (data.chat_with == this.userDetail.id) {
        this.privateChannels.push({chanel: null, groupId: 0, groupIds: [], userId: data.initiated_by, chanelName: data.channel_name});
        //this.startPrivateChat( data.initiated_by, data.channel_name );
      }
    });

    notifications.bind('group-chat-request', (data: any) => {
      if( data.initiated_by === this.userDetail.id) {
        this.startPrivateGroupChat( data.chat_with, data.channel_name, data.groupId );
      } else if ((data.chat_with_ids as any[]).includes(this.userDetail.id)) {
        if(data.newGroup) this.conversations.push({name: data.groupName, id: data.groupId, isGroup: true, newGroup: true}); 
        this.privateChannels.push({chanel: null, groupId: data.groupId, groupIds: data.chat_with_ids, userId: 0, chanelName: data.channel_name});
        //this.startPrivateChat( data.initiated_by, data.channel_name );
      }
    });
  }

  getCurrentTime(): string {
    let time = new Date();
    return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  }

  startPrivateChat( withUserId: number, channelName: string ) {  
    let privateChannel = this.pusher.subscribe( channelName );
    this.privateChannels.push({chanel: privateChannel, groupId: 0, groupIds: [], userId: withUserId, chanelName: channelName});
    this.subscribeToRequestedChanel(privateChannel);
  }

  startPrivateGroupChat( withUserIds: number[], channelName: string, groupId: number ) {  
    let privateChannel = this.pusher.subscribe( channelName );
    this.privateChannels.push({chanel: privateChannel, groupId: groupId, groupIds: withUserIds, userId: 0, chanelName: channelName});
    this.subscribeToRequestedChanel(privateChannel);
  }

  sendMessage(fileUrl = '') {
    if(fileUrl.length > 0) this.messageContent = '';
    this.toggleEmojiPicker = false;
    if(this.messageContent.length == 0 && this.imageUrl == null) return;
    //this.botReplay(lastMessageId++);
    this.messageService.sendMessage(
      this.userDetail.id, 
      this.opponentUserId, 
      this.messageContent, 
      this.sessionId, 
      this.userDetail.name, 
      this.ChannelName,
      this.replying,
      this.parentMessageId,
      fileUrl,
      this.opponentChat.isGroup).subscribe(res => {
      this.nullMessageContent();
    }, err => {
      console.log(err);
      this.nullMessageContent();
    });
  }

  editMessage() {
    this.toggleEmojiPicker = false;
    if(this.messageContent.length == 0 && this.imageUrl == null) return;

    this.messageService.updateMessage(this.parentMessageId, this.messageContent, this.ChannelName).subscribe(res => {
      
      this.nullMessageContent();
    }, err => {
      console.log(err);
      this.nullMessageContent();
    })
  }

  nullMessageContent() {
    this.nullReplyMessage();
    this.messageContent = '';
    this.imageUrl = null;
  }

  playSound() {
    let audio = new Audio();
    audio.src = "../../assets/audio/notification_bell.mp3";
    audio.load();
    //audio.play();
  }


  triggerFunction(event: any) {
    if (event.ctrlKey && event.key === 'Enter') {
      let text: any = document.getElementById("textarea1");
      text.value += '\n';
      this.messageContent += '\n';
    } else if (event.key === 'Enter') {
      event.preventDefault();
      if(this.title == 'Editing') {
        this.editMessage();
      } else {
        this.sendMessage();
      }
    }
  }

  addEmoji(event: any) {
    this.publishTyping();
    this.messageContent += event.emoji.native;
  }

  reactMessage(messageId: number, event: any) {
    this.reactService.reactMessage(messageId, this.userDetail.id, this.ChannelName, event.emoji.native).subscribe(res => {
      console.log(res);
    }, err => {
      console.log(err);
    })
  }

  fileSelect(event: any) {
    this.toggleEmojiPicker = false;
    if(!event.target.files[0] || event.target.files[0].length == 0) {
			return;
		}
    this.uploadFile(event.target.files[0]);
    var reader = new FileReader();
		reader.readAsDataURL(event.target.files[0]);

		reader.onload = (_event) => {
			this.imageUrl = reader.result;
      //this.sendMessage();
		}
  }

  uploadFile(file: File) {
    this.uploadService.upload(file).subscribe(
      (event: any) => {
        if (event.type === HttpEventType.UploadProgress) {
          this.progress = Math.round(100 * event.loaded / event.total);
        } else if (event instanceof HttpResponse) {
          this.uploadMessage = event.body.message;
          //this.fileInfos = this.uploadService.getFiles();
          this.sendMessage(`${environment.baseUrl}files/${event.body.fileName}`);
        }
      },
      (err: any) => {
        console.log(err);
        this.progress = 0;
  
        if (err.error && err.error.message) {
          this.uploadMessage = err.error.message;
        } else {
          this.uploadMessage = 'Could not upload the file!';
        }
  
      });
  
  }

  publishTyping(){
    this.messageService.publishUserTyping(this.userDetail.name, this.userDetail.id, this.userDetail.id, this.opponentUserId, this.ChannelName ).subscribe(res => {
      //todo...
    }, err => {
      console.log(err);
    });
  }

  getTimeWithPmAM(date: Date){
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  getRawDate(date: Date) {
    return `${date.getMonth()}/${date.getDate()}/${date.getFullYear()} ${this.getTimeWithPmAM(date)}`;
  }

  getOnlyDate(date: Date) {
    return `${date.getMonth()}/${date.getDate()}/${date.getFullYear()}`;
  }

  get ChannelName(): string {
    return this.opponentChat.isGroup ? this.privateChannels.find(x => x.groupId == this.opponentUserId)?.chanelName as string : 
    this.privateChannels.find(x => x.userId == this.opponentUserId)?.chanelName as string;
  }

  subscribeToRequestedChanel(privateChannel: any){
    privateChannel.bind( 'message', (data: any) => {
      if(data) {
        let parentMessage = data.messageType == 'reply' ? this.messages.find(x => x.id == data.parentMessageId) : null;
        let obj = {
          id: data.messageId, 
          body: data.message, 
          userName: data.userName[0], 
          date: this.getOnlyDate(new Date()), 
          time: new Date(), 
          rawTime: this.getRawDate(new Date()), 
          me: data.fromUserId == this.userDetail.id,
          isReply: data.messageType == 'reply',
          parentMessageId: data.parentMessageId,
          parentMessage: data.messageType == 'reply' ? parentMessage.body : '',
          parentMessageUrl: data.messageType == 'reply' ? parentMessage.fileUrl : '',
          parentMessageUser: data.messageType == 'reply' ? parentMessage.userName : '',
          isEdited: false,
          fileUrl: data.fileUrl,
          isImage: this.isImageTypeUrl(data.fileUrl),
          isParentImage: data.messageType == 'reply' ? this.isImageTypeUrl(parentMessage.fileUrl) : false
        };
        this.messages = this.addToArray(this.messages, obj);
      }
    });

    privateChannel.bind('edit-message', (data: any) => {
      let message = this.messages.find(x => x.id == data.mid);
      message.isEdited = true;
      message.body = data.updatedMessage;
    });

    privateChannel.bind( 'user_typing', (data: {username: string, userId: number}) => {
      if(data.userId !== this.userDetail.id) {
        (document.getElementById('typing-indicator') as any).innerHTML = data.username + ' is typing...';

        clearTimeout(this.clearTimerId);
        this.clearTimerId = setTimeout(function () {
          (document.getElementById('typing-indicator') as any).innerHTML = '';
        }, 900);
      }

    });

    privateChannel.bind('react-message', (data: any) => {
      if(data.userId == this.userDetail.id) {
        data.userName = this.userDetail.name;
      } else {
        let user = this.users.find((u: any) => u.id == data.userId);
        data.userName = user?.name;
      }
      this.messages.forEach(m => {
        if(m.id == data.messageId) {
          if(m.reacts) {
            m.reacts.push(data);
          } else {
            m.reacts = [data];
          }
        }
      })
    });

  }

  unsubscribeChannel(dto: any) {
    if(dto.chanel == null) return;
    this.pusher.unsubscribe(dto?.chanelName as string);
    dto?.chanel.unbind("message");
    dto?.chanel.unbind("user_typing");
    dto?.chanel.unbind("edit-message");
    dto?.chanel.unbind("react-message");
    let index = this.privateChannels.indexOf(dto);
    this.privateChannels.splice(index, 1);
  }

  subscribeToOpenedConversation(data: any, isgroup: boolean) {
    let id = data.id;
    this.opponentUserId = id;
    this.opponentChat = data;
    this.closeConversation = false;
    let chanelData = isgroup ? this.privateChannels.find(x => x.groupId == id && x.userId == 0) : 
                                this.privateChannels.find(x => x.userId == id && x.groupId == 0);
    let index = this.privateChannels.indexOf(chanelData as any);
    let privateChannel = this.pusher.subscribe( chanelData?.chanelName as string);
    this.privateChannels[index].chanel = privateChannel;
    this.subscribeToRequestedChanel(privateChannel);
  }

  // subscribeManually(data:any) {
  //   let channelName = data.isGroup ? `private-group-chat-${data.id}` : `private-chat-${data.id}-${this.userDetail.id}`;
  //   let privateChannel = this.pusher.subscribe(channelName);
  //   this.privateChannels.push({chanel: privateChannel, groupId: data.isGroup ? data.id : 0, groupIds: [], userId: data.isGroup ? 0 : data.id, chanelName: channelName});
  //   this.subscribeToRequestedChanel(privateChannel);
  // }

  openConversation(user: any) {
    user.newMessage = false;
    user.newGroup = false;
    let id = user.id;
    if(this.opponentUserId == id && this.opponentChat.isGroup == user.isGroup) return;
    this.closeConversation = true;
    this.checkExistingOpenChat();
    this.messages = [];
    this.opponentUserId = id;
    this.opponentChat = user;
    // if (this.privateChannels.length == 0) {
    //   this.subscribeManually(user);
    // }
    if(this.privateChannels.find(x => x.userId == id && x.groupId == 0) != null) {
      this.subscribeToOpenedConversation(user, false);
      this.messageService.sessionMessages(this.userDetail.id, this.opponentUserId).subscribe(res => {
        if (res) {
          let filterMessages = (res.messages as any[]).filter(x => x.userid == this.userDetail.id);
          filterMessages.forEach(m => {
            const isMe = m.usertype == 0;
            this.insertMessage(m, isMe, filterMessages);
          });
          this.sessionId = res.id;
          this.closeConversation = false;
        }
      }, err => {
        console.log(err);
      })
    } 
    else if((this.privateChannels.find(x => x.groupId == id && x.userId == 0) != null)) {
      this.sessionId = null;
      this.subscribeToOpenedConversation(user, true);
      this.messageService.groupMessages(this.opponentUserId).subscribe(res => {
        if (res) {
          res.messages.forEach(m => {
            const isMe = m.userId == this.userDetail.id;
            this.insertMessage(m, isMe, res.messages);
          });

          this.closeConversation = false;
        }
      }, err => {
        console.log(err);
      })
    } 
    else if(this.opponentChat.isGroup) {
      this.sessionId = null;
      let userIds: number[] = [];
      this.groupService.getUsersByGroup(this.opponentUserId).subscribe((res) => {
        userIds = res.map(x => x.userId);
        this.messageService.groupMessagesWithChannel(this.opponentUserId, userIds, this.userDetail.id).subscribe(res => {
          if (res) {
            res.messages.forEach(m => {
              const isMe = m.userId == this.userDetail.id;
              this.insertMessage(m, isMe, res.messages);
            });
  
            this.closeConversation = false;
          }
        }, err => {
          console.log(err);
        })
      }, err => {
        console.log(err);
      })
    }
    else {
      this.messageService.requestSession(this.opponentUserId, this.userDetail.id, this.userDetail.id, this.opponentUserId).subscribe(res => {
        if (res) {
          let filterMessages = (res.messages as any[]).filter(x => x.userid == this.userDetail.id);
          filterMessages.forEach(m => {
            const isMe = m.usertype == 0;
            this.insertMessage(m, isMe, filterMessages);
          });
          this.sessionId = res.id;
          this.closeConversation = false;
        }
      }, err => {
        console.log(err);
      })
    }
  }

  private addToArray(arr: any[], item: any): any[] {
    let copy = [];

    for (let a of arr) {
        copy.push(a);
    }
    copy.push(item);
    return copy;
  }

  private removeFromArray(arr: any[], item: any): any[] {
    let copy = [];

    for (let a of arr) {
        copy.push(a);
    }

    let index = copy.indexOf(item);
    copy.splice(index , 1);

    return copy;
  }

  scrollToBottom(): void {
    try {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
    } catch(err) {
      console.log(err);
     }                 
  }

  openGroupForm(template: TemplateRef<any>){
    this.users.forEach(user => user.isSelected = false);
    this.newGroupChat = {name: '', users: [...this.users, {name: this.userDetail.name, id: this.userDetail.id, isSelected: true, disable: true}]};
    this.groupChatDialogRef = this.matDialog.open(template, {
      width: '600px',
      data: { groupChat: this.newGroupChat },
    })
  }

  checkExistingOpenChat(){
    if(this.opponentUserId) {
      let dto = this.privateChannels.find(x => x.userId == this.opponentUserId && x.groupId == 0);
      let groupdto = this.privateChannels.find(x => x.groupId == this.opponentUserId && x.userId == 0);
      if (dto)  this.unsubscribeChannel(dto);
      if (groupdto) this.unsubscribeChannel(groupdto);
    } 
  }

  createGroupChat() {
    const userIds = this.newGroupChat.users.filter(x => x.isSelected).map(x => x.id);
    this.groupService.createGroup(this.userDetail.id, userIds, this.newGroupChat.name).subscribe(res => {
    this.checkExistingOpenChat();
    const name = this.newGroupChat.name;
    this.groupChatDialogRef.close();
    this.opponentUserId = res; 
    this.opponentChat = {name: name, id: res, isGroup: true}
    this.messages = [];
    this.sessionId = null;
    this.closeConversation = false;
    this.conversations.push({name: name, id: res, isGroup: true});
    }, err => {
      console.log(err);
    });
  }

  isSameGroupUsers(a: number[], b: number[]): boolean {
    if (a.length != this.clearTimerId.length) return false;

    for (var i = 0; i < a.length; ++i) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  replayProcess(data: any, title: string){
    this.replying = true;
    this.replyMessage = data.body;
    this.replyMessageUrl = data.fileUrl;
    this.replyUserName = data.userName;
    this.parentMessageId = data.id;
    this.title = title;
    this.messageInput.nativeElement.focus();
    if(title == 'Editing') {
      this.messageContent = data.body;
    }
  }

  nullReplyMessage(){
    this.replying = false;
    this.replyMessage = '';
    this.replyUserName = '';
    this.replyMessageUrl = '';
    this.parentMessageId = 0;
    this.title = '';
    this.messageContent = '';
  }

  insertMessage(data: any, isMe: boolean, messageList: any[]) {
    let mObj = this.getMessageObj(data, isMe, messageList)
    this.messages.push(mObj);
  }

  getMessageObj(data: any, isMe: boolean, messageList: any[]) {
    let parentMessage = data.messageType == 'reply' ? messageList.find(x => x.mid == data.parentMessageId) : null;
    if(data.reacts) {
      data.reacts.forEach((r: any) => {
        if(this.userDetail.id == r.user_id) {
          r.userName = this.userDetail.name;
        } else {
          r.userName = this.users.find((u: any) => u.id == r.user_id)?.name;
        }
      });
    }
    return {
      id: data.mid, 
      body: data.message, 
      userName: data.uname, 
      time: data.time, 
      me: isMe, 
      rawTime: data.rawTime, 
      date: data.date,
      isReply: data.messageType == 'reply',
      parentMessageId: data.parentMessageId,
      parentMessage: data.messageType == 'reply' ? parentMessage.message : '',
      parentMessageUrl: data.messageType == 'reply' ? parentMessage.fileUrl : '',
      parentMessageUser: data.messageType == 'reply' ? parentMessage.uname : '',
      isEdited: data.isEdited == '1',
      fileUrl: data.fileUrl,
      isImage: this.isImageTypeUrl(data.fileUrl),
      reacts : data.reacts,
      isParentImage: data.messageType == 'reply' ? this.isImageTypeUrl(parentMessage.fileUrl) : false
    };
  }


  isImageTypeUrl(url: string): boolean {
    return url != null && url.length >= 5 && 
          (
            url.slice(-5).toLowerCase().includes('.png') || 
            url.slice(-5).toLowerCase().includes('.jpg') || 
            url.slice(-5).toLowerCase().includes('.jpeg') || 
            url.slice(-5).toLowerCase().includes('.gif')
          );
  }


  scrollTo(id: string) {
    const element =document.getElementById(id);
    element?.scrollIntoView({behavior: "smooth", block: "end", inline: "nearest"});
  }

}
