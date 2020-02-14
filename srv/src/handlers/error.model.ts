export class ErrorModel {
  constructor(public errorCode: string,
              public errorMessage: string,
              public metaInfo?: string,
  ) {
  }
}
