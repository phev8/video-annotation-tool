import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ClarityModule } from '@clr/angular';
import { HttpClientModule } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { FileUploadComponent } from './file-upload/file-upload.component';
import { UploadService } from './upload.service';
import { FormsModule } from '@angular/forms';

@NgModule({
  declarations: [ FileUploadComponent ],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    ClarityModule,
    HttpClientModule,
    FormsModule
  ],
  entryComponents: [ FileUploadComponent ],
  exports: [ FileUploadComponent ],
  providers: [ UploadService ]
})
export class UploadModule {
}
