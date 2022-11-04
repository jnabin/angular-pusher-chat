import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../material/material.module';
import { FormsModule } from '@angular/forms';
import { LoaderComponent } from './loader/loader.component';
import { ConversationComponent } from './conversation/conversation.component';
import { ChatSidebarComponent } from './chat-sidebar/chat-sidebar.component';
import { PickerModule } from '@ctrl/ngx-emoji-mart';



@NgModule({
  declarations: [
    LoaderComponent,
    ConversationComponent,
    ChatSidebarComponent
  ],
  imports: [
    CommonModule,
    FormsModule,
    PickerModule
  ],
  exports: [
    LoaderComponent,
    ConversationComponent,
    ChatSidebarComponent
  ]
})
export class SharedModule { }
