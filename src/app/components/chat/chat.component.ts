import { Component, OnInit } from '@angular/core';
import { Conversations } from 'src/app/mock-conversation';

@Component({
  selector: 'app-chat',
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css']
})
export class ChatComponent implements OnInit {

  messages: any[] = [
    {id: 1, body: 'Ever wondered how some graphic', image: '', time: '8.00 PM', me: false},
    {id: 2, body: 'Freelance Design Tricks',image: '', time: '8.20 PM', me: true},
    {id: 3, body: `Successful businesses have many things
      	           in common, today we’ll look at the big
                   of recognition and how a digital`, image: '', time: '8.30 PM', me: false},
    {id: 4, body: 'Marketers advertisers usually focus their', image: '', time: '8.30 PM', me: false},
    {id: 5, body: 'Show can be a very effective method', image: '', time: '8.31 PM', me: true},
  ];

  conversation: any =  {
    name: '',
    messages: this.messages,
    time: '',
    latestMessage: '',
    latestMessageRead: true,
    status: true,
    photo: '',
    isSelected: false
  };
  conversations = Conversations;
  constructor() { }

  conversationClicked(value: any) {
    this.conversations.forEach(x => x.isSelected = false);
    value.isSelected = true;
    this.conversation = value;
  }

  ngOnInit(): void {
  }

}
