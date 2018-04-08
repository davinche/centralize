export interface ILabel {
  [key: string]: any;
}

export interface IMessage {
  logLevel: number;
  labels: ILabel;
  value: any;
  timestamp?: Date;
}

export interface ILogLevels {
  [key: string]: number;
}

export interface ISender {
  send(IMessage);
}

export interface IReceiver {
  (msg: IMessage);
}
