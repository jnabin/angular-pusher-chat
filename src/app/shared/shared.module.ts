import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { FormsModule } from '@angular/forms';
import { LoaderComponent } from './loader/loader.component';
import { ConversationComponent } from './conversation/conversation.component';
import { ChatSidebarComponent } from './chat-sidebar/chat-sidebar.component';
import { PickerModule } from '@ctrl/ngx-emoji-mart';
import { IconModule } from '@visurel/iconify-angular';
import { ReplyMessageComponent } from './reply-message/reply-message.component';
import { DirectMessageItemComponent } from './direct-message-item/direct-message-item.component';
import { ReplyMessageItemComponent } from './reply-message-item/reply-message-item.component';
import { ConversationHeaderComponent } from './conversation-header/conversation-header.component';
import { MessageReactComponent } from './message-react/message-react.component';



@NgModule({
  declarations: [
    LoaderComponent,
    ConversationComponent,
    ChatSidebarComponent,
    ReplyMessageComponent,
    DirectMessageItemComponent,
    ReplyMessageItemComponent,
    ConversationHeaderComponent,
    MessageReactComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PickerModule,
    MaterialModule,
    IconModule
  ],
  exports: [
    LoaderComponent,
    ConversationComponent,
    ChatSidebarComponent,
    MaterialModule,
    ReplyMessageComponent,
    ConversationHeaderComponent
  ]
})
export class SharedModule { }
