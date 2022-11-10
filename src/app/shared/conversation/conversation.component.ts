import { AfterViewChecked, Component, ElementRef, Input, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import Pusher, { Channel, PresenceChannel } from 'pusher-js';
import { AuthService } from 'src/app/services/auth.service';
import { GroupService } from 'src/app/services/group.service';
import { MessageService } from 'src/app/services/message.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  @ViewChild('playAudio') private playAudio!: ElementRef;
  @ViewChild('messageInput') messageInput!: ElementRef;
  
  messages: any[] = [];
  replying = false;
  replyUserName = '';
  replyMessage = '';
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
              private matDialog: MatDialog) { }
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
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
    this.userService.getAllUsers().subscribe((res: any) => {
      this.users = (res as any[]).filter(x => x.id != this.userDetail.id);
      this.users.forEach(user => {
        this.conversations.push({
          name: user.name,
          id: user.id,
          isGroup: false
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
    console.log(`private-notifications-${this.userDetail.id}`);
    const forum: PresenceChannel = this.pusher.subscribe( 'presence-forum' ) as PresenceChannel;

    forum.bind(`new-message-to-${this.userDetail.id}`, (data: {fromUserId: number, message: string, isGroup: boolean, groupId: number}) => {
      if(!data.isGroup) {
        this.conversations.forEach(x => {
          if(x.id == data.fromUserId && !x.isGroup && this.opponentUserId != data.fromUserId) {
            x.newMessage = true;
            x.latestMessage = data.message;
            this.playAudio.nativeElement.click();
          }
        })
      }
    });

    forum.bind(`group-new-message`, (data: {fromUserId: number, message: string, isGroup: boolean, groupId: number}) => {
      if(data.isGroup) {
        console.log(this.conversations);
        this.conversations.forEach(x => {
          if(x.id == data.groupId && x.isGroup && this.userDetail.id != data.fromUserId && this.opponentUserId != data.groupId) {
            x.newMessage = true;
            x.latestMessage = data.message;
            this.playAudio.nativeElement.click();
          }
        })
      }
    });

    forum.bind("pusher:subscription_succeeded", (members: any) => {
      console.log(members);
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
        this.conversations.push({name: data.groupName, id: data.groupId, isGroup: true, newGroup: true});
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
    console.log(this.privateChannels);
    this.subscribeToRequestedChanel(privateChannel);
  }

  sendMessage() {
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
      this.opponentUserId,
      this.replying,
      this.parentMessageId).subscribe(res => {
      this.nullMessageContent();
    }, err => {
      console.log(err);
      this.nullMessageContent();
    });
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
      this.sendMessage();
    }
  }

  addEmoji(event: any) {
    this.publishTyping();
    this.messageContent += event.emoji.native;
  }

  fileSelect(event: any) {
    this.toggleEmojiPicker = false;
    if(!event.target.files[0] || event.target.files[0].length == 0) {
			return;
		}
    var reader = new FileReader();
		reader.readAsDataURL(event.target.files[0]);

		reader.onload = (_event) => {
			this.imageUrl = reader.result;
      this.sendMessage();
		}
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
    privateChannel.bind( 'message', (data: {fromUserId: number, toUserId: number, message: string, userName: string}) => {
      if(data) {
        let obj = {id: this.messages.length, body: data.message, userName: data.userName[0], date: this.getOnlyDate(new Date()), time: new Date(), rawTime: this.getRawDate(new Date()), me: data.fromUserId == this.userDetail.id};
        this.messages = this.addToArray(this.messages, obj);
        console.log(this.messages);
      }
    });

    privateChannel.bind( 'user_typing', (data: {username: string, userId: number}) => {

      if(data.userId !== this.userDetail.id) {
        (document.getElementById('typing-indicator') as any).innerHTML = data.username + ' is typing...';

        clearTimeout(this.clearTimerId);
        this.clearTimerId = setTimeout(function () {
          (document.getElementById('typing-indicator') as any).innerHTML = '';
        }, 900);
      }

    } );

  }

  unsubscribeChannel(dto: any) {
    this.pusher.unsubscribe(dto?.chanelName as string);
    dto?.chanel.unbind("message");
    dto?.chanel.unbind("user_typing");
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

  openConversation(user: any) {
    user.newMessage = false;
    user.newGroup = false;
    user.latestMessage = null;
    let id = user.id;
    if(this.opponentUserId == id && this.opponentChat.isGroup == user.isGroup) return;
    this.closeConversation = true;
    if(this.opponentUserId) {
      let dto = this.privateChannels.find(x => x.userId == this.opponentUserId && x.groupId == 0);
      let groupdto = this.privateChannels.find(x => x.groupId == this.opponentUserId && x.userId == 0);

      if (dto)  this.unsubscribeChannel(dto);
      if (groupdto) this.unsubscribeChannel(groupdto);
    } 
    this.messages = [];
    this.opponentUserId = id;
    this.opponentChat = user;

    if(this.privateChannels.find(x => x.userId == id && x.groupId == 0) != null) {
      this.subscribeToOpenedConversation(user, false);
      this.messageService.sessionMessages(this.userDetail.id, this.opponentUserId).subscribe(res => {
        if (res) {
          console.log(res);
          let filterMessages = (res.messages as any[]).filter(x => x.userid == this.userDetail.id);
          filterMessages.forEach(m => {
            const isMe = m.usertype == 0;
            this.messages.push(
              {id: m.mid, body: m.message, userName: m.uname, time: m.time, me: isMe, rawTime: m.rawTime}
            );
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
            this.messages.push(
              {id: m.mid, body: m.message, userName: m.uname, time: m.time, me: isMe, rawTime: m.rawTime, date: m.date}
            );
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
              this.messages.push(
                {id: m.mid, body: m.message, userName: m.uname, time: m.time, me: isMe, rawTime: m.rawTime, date: m.date}
              );
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
            this.messages.push(
              {id: m.mid, body: m.message, userName: m.uname, time: m.time, me: isMe, rawTime: m.rawTime, date: m.date}
            );
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
    } catch(err) { }                 
  }

  openGroupForm(template: TemplateRef<any>){
    this.users.forEach(user => user.isSelected = false);
    this.newGroupChat = {name: '', users: [...this.users, {name: this.userDetail.name, id: this.userDetail.id, isSelected: true}]};
    this.groupChatDialogRef = this.matDialog.open(template, {
      width: '600px',
      data: { groupChat: this.newGroupChat },
    })
  }

  createGroupChat() {
    const userIds = this.newGroupChat.users.filter(x => x.isSelected).map(x => x.id);
    this.groupService.createGroup(this.userDetail.id, userIds, this.newGroupChat.name).subscribe(res => {
      const name = this.newGroupChat.name;
      //this.newGroupChat = {name: '', users: []};
      this.groupChatDialogRef.close();
      this.opponentUserId = res; 
      this.opponentChat = {name: name, id: res, isGroup: true}
      this.closeConversation = false;
      this.conversations.push({name: name, id: res, isGroup: true});
      console.log(res);
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

  replayProcess(data: any){
    this.replying = true;
    this.replyMessage = data.message;
    this.replyUserName = data.name;
    this.parentMessageId = data.id;
    this.messageInput.nativeElement.focus();
  }

  nullReplyMessage(){
    this.replying = false;
    this.replyMessage = '';
    this.replyUserName = '';
    this.parentMessageId = 0;
  }

}
