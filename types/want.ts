export type SignalOperation = "create" | "agree" | "comment";

export type SignalTx = {
  txHash: string;
  op: SignalOperation;
  wantId: string;
  blockTime: number | null;
  lovelace: number;
};

export type WantComment = {
  txHash: string;
  wantId: string;
  text: string;
  blockTime: number | null;
  lovelace: number;
};

export type Want = {
  id: string;
  title: string;
  body: string;
  createdTxHash: string;
  createdAt: number | null;
  signalCount: number;
  adaSignaled: number;
  comments: WantComment[];
  recentSignals: SignalTx[];
};
