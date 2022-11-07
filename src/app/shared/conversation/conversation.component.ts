import { AfterViewChecked, Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core';
import Pusher, { Channel, PresenceChannel } from 'pusher-js';
import { AuthService } from 'src/app/services/auth.service';
import { MessageService } from 'src/app/services/message.service';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-conversation',
  templateUrl: './conversation.component.html',
  styleUrls: ['./conversation.component.css']
})
export class ConversationComponent implements OnInit, AfterViewChecked {
  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  
  messages: any[] = [];
  closeConversation: boolean = true;
  openUserId!: number;
  privateChannels: {chanel: any, userId: number, chanelName: string}[] = [];
  privateChatIds: number[] = [];
  activeCount: number = 0;
  activeUserIds: string[] = [];
  expectedChatWith: any;
  opponentUserId!: number;
  users: any[] = [];
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
  sessionId!: number;

  constructor(private auth: AuthService, private messageService: MessageService, private userService: UserService) { }
  
  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  getProfilePhoto(myself: boolean): string {
    return myself ? '/assets/images/myself.svg' : '/assets/images/other.svg';
  }

  ngOnInit(): void {
    this.scrollToBottom();
    this.userService.getAllUsers().subscribe((res: any) => {
      this.users = (res as any[]).filter(x => x.id != this.userDetail.id);
    }, err => {
      console.log(err);
    });
    
    this.userDetail = this.auth.getUser();
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

    // this.activeCount = forum.members.count;
    // forum.members.each((member: any) => {
    //   this.activeUserIds = this.addToArray(this.activeUserIds, member.id);
    // });

    forum.bind(`new-message-to-${this.userDetail.id}`, (data: {fromUserId: number, message: string}) => {
      this.users.forEach(x => {
        if(x.id == data.fromUserId && this.opponentUserId != data.fromUserId) {
          x.newMessage = true;
          x.latestMessage = data.message;
        }
      })
    });

    forum.bind("pusher:subscription_succeeded", (members: any) => {
      //members = members.filter((x: any) => x.id != this.userDetail.id);
      console.log(members);
      // For example
      this.activeCount += members.count;
    
      members.each((member: any) => {
        // For example
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
      console.log("nnnnnnnnnnnnnnnnnnnnnnn");
      console.log(data);
      if( data.initiated_by === this.userDetail.id && this.opponentUserId == data.chat_with) {
        this.startPrivateChat( data.chat_with, data.channel_name );
      } else if (data.chat_with == this.userDetail.id) {
        this.privateChannels.push({chanel: null, userId: data.initiated_by, chanelName: data.channel_name});
        //this.startPrivateChat( data.initiated_by, data.channel_name );
      }

    } );
  }

  getCurrentTime(): string {
    let time = new Date();
    return time.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
  }

  startPrivateChat( withUserId: number, channelName: string ) {  
    let privateChannel = this.pusher.subscribe( channelName );
    this.privateChannels.push({chanel: privateChannel, userId: withUserId, chanelName: channelName});
    this.subscribeToRequestedChanel(privateChannel);
  }

  sendMessage() {
    this.toggleEmojiPicker = false;
    if(this.messageContent.length == 0 && this.imageUrl == null) return;
    //this.botReplay(lastMessageId++);
    this.messageService.sendMessage(this.userDetail.id, this.opponentUserId, this.messageContent, this.sessionId, this.userDetail.name, this.ChannelName).subscribe(res => {
      console.log(res);
      this.nullMessageContent();
    }, err => {
      console.log(err);
      this.nullMessageContent();
    });
  }

  botReplay(lastMessageId: number){
    setTimeout(() => {
      this.conversation.messages.push(
        {id: lastMessageId++, body: 'I am seeing your message!', image: '', time: this.getCurrentTime(), me: false }
      );
      this.playSound();
    }, 1500);
  }

  nullMessageContent() {
    this.messageContent = '';
    this.imageUrl = null;
  }

  playSound() {
    let audio = new Audio();
    audio.src = "../../assets/audio/notification_bell.mp3";
    audio.load();
    audio.play();
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

  get ChannelName(): string {
    return this.privateChannels.find(x => x.userId == this.opponentUserId)?.chanelName as string;
  }

  subscribeToRequestedChanel(privateChannel: any){
    privateChannel.bind( 'message', (data: {fromUserId: number, toUserId: number, message: string, userName: string}) => {
      if(data) {
        let obj = {id: this.messages.length, body: data.message, userName: data.userName[0], time: '8.00 PM', me: data.fromUserId == this.userDetail.id};
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

  openConversation(user: any) {
    user.newMessage = false;
    user.latestMessage = null;
    let id = user.id;
    if(this.opponentUserId == id) return;
    this.closeConversation = true;
    if(this.opponentUserId) {
      let dto = this.privateChannels.find(x => x.userId == this.opponentUserId);
      if(dto) {
        this.pusher.unsubscribe(dto?.chanelName as string);
        dto?.chanel.unbind("message");
        dto?.chanel.unbind("user_typing");
        let index = this.privateChannels.indexOf(dto);
        this.privateChannels.splice(index, 1);
      }
    } 
    this.messages = [];
    this.opponentUserId = id;
    if(this.privateChannels.find(x => x.userId == id) != null) {
      this.opponentUserId = id;
      this.closeConversation = false;
      let chanelData = this.privateChannels.find(x => x.userId == id);
      let index = this.privateChannels.indexOf(chanelData as any);
      let privateChannel = this.pusher.subscribe( chanelData?.chanelName as string);
      this.privateChannels[index].chanel = privateChannel;
      this.subscribeToRequestedChanel(privateChannel);
      this.messageService.sessionMessages(this.userDetail.id, this.opponentUserId).subscribe(res => {
        if (res) {
          let filterMessages = (res.messages as any[]).filter(x => x.userid == this.userDetail.id);
          filterMessages.forEach(m => {
            const isMe = m.usertype == 0;
            this.messages.push(
              {id: m.mid, body: m.message, userName: m.uname[0], time: '8.00 PM', me: isMe}
            );
          });
          this.sessionId = res.id;
          this.closeConversation = false;
        }
      }, err => {
        console.log(err);
      })
    } else {
      this.messageService.requestSession(this.opponentUserId, this.userDetail.id, this.userDetail.id, this.opponentUserId).subscribe(res => {
        if (res) {
          let filterMessages = (res.messages as any[]).filter(x => x.userid == this.userDetail.id);
          filterMessages.forEach(m => {
            const isMe = m.usertype == 0;
            this.messages.push(
              {id: m.mid, body: m.message, userName: m.uname[0], time: '8.00 PM', me: isMe}
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

}
