import { LabelI } from './../interfaces/labels';
import { Injectable } from '@angular/core';
import { AmplifyDataService } from './amplify-data.service';

@Injectable({
  providedIn: 'root'
})
export class LabelsService {

  constructor(private amplifyData: AmplifyDataService) { }

  labelsList$ = this.amplifyData.labels$;

  async add(labelObj: LabelI) {
    return this.amplifyData.addLabel(labelObj);
  }

  delete(id: string) {
    this.amplifyData.deleteLabel(id);
  }

  update(object: LabelI, id: string) {
    if (id) {
      const payload = { ...object, id };
      this.amplifyData.updateLabel(payload);
    }
  }

}


