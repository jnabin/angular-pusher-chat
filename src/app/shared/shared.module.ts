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



@NgModule({
  declarations: [
    LoaderComponent,
    ConversationComponent,
    ChatSidebarComponent,
    ReplyMessageComponent
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
    ReplyMessageComponent
  ]
})
export class SharedModule { }
