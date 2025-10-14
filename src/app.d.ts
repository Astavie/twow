// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export type Prompt = {
  prompt: string;
  nextquestion?: bool,
  multiplier?: number,
  image?: string;

  gimmick?: Gimmick,
  wordQuota?: number,
  correct?: string[] | number,
}

export type Gimmick = "words" | "guess" | 'number'

export type FillState = {
	state: "fill",
	partners: string[],
	prompt: string,
	gimmick?: Gimmick,

	wordQuota?: number,
	correct?: string[] | number,
}

export type WaitState = {
	state: "wait",
}

export type VoteState = {
	state: "vote",
	answers: string[],
	prompt: string,
}

export type State = WaitState | FillState | VoteState;

export type Medals = {
	gold: number,
	silver: number,
	bronze: number,
}

export type HelloMsg = {
	message: "hello",
	name: string,
};

export type FillMsg = {
	message: "fill",
	fill: string,
};

export type VoteMsg = {
	message: "vote",
	order: number[],
}

export type ClientMsg = HelloMsg | FillMsg | VoteMsg;

export type StatusMsg = {
	message: "status",
	medals: Medals,
	place?: number,
}

export type ChangeStateMsg = {
	message: "state",
} & State;

export type ServerMsg = HelloAckMsg | ChangeStateMsg;

export {};
