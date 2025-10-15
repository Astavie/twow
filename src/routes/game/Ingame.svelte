<script lang="ts">
	import { Jumper } from 'svelte-loading-spinners';
	import { type DataConnection } from 'peerjs';
	import Name from '../../Name.svelte';

  let { conn, name }: { conn: DataConnection, name: string } = $props();
  let medals: Medals = $state({
    gold: 0,
    silver: 0,
    bronze: 0,
  });

  let place: number | undefined = $state(undefined);
  let state: State = $state({ state: "wait" });
  let sending: bool = $state(false);

  // for state = 'fill'
  let filled: string = $state("");
  let wordCounter: number = $derived(filled.trim().length === 0 ? 0 : filled.trim().split(/\s+/).length);

  // for state = 'vote'
  let merger: Generator<[number, number], number[], boolean> | undefined = $state(undefined);
  let currentCompare: [number, number] | undefined = $state(undefined);

  const shuffle = function(xs) {
    return xs.slice(0).sort(function() {
      return .5 - Math.random();
    });
  };

  function* mergeSort() {
    const order = shuffle(state.answers.map((_, i) => i));
    const backing = [...order];
    yield* splitMerge(order, 0, order.length, backing);
    return order;
  }

  function* splitMerge(backing: number[], begin: number, end: number, order: number[]) {
    if (end - begin <= 1) {
      return;
    }
    const middle = Math.floor((end + begin) / 2);
    yield* splitMerge(order, begin, middle, backing);
    yield* splitMerge(order, middle, end, backing);
    yield* merge(backing, begin, middle, end, order);
  }

  function* merge(backing: number[], begin: number, middle: number, end: number, order: number[]) {
    let i = begin;
    let j = middle;
    for (let k = begin; k < end; k++) {
      let swap = i < middle;
      if (swap && !(j >= end)) {
        swap = yield [order[i], order[j]];
      }

      if (swap) {
        backing[k] = order[i];
        i += 1;
      } else {
        backing[k] = order[j];
        j += 1;
      }
    }
  }

  $effect(function() {
    // send hello
  	const msg: HelloMsg = {
  		message: "hello",
  		name,
  	};
  	conn.send(JSON.stringify(msg));

  	// setup receiver
    conn.on('data', function(data) {
      const parsed = JSON.parse(data);
      if (!('message' in parsed)) return;

      const msg = parsed as ServerMsg;
      switch (msg.message) {
      case 'status':
        medals = msg.medals;
        place = msg.place;
        break;
      case 'state':
        state = msg;
        sending = false;
        filled = '';
        if (msg.state === 'vote') {
          merger = mergeSort();
          currentCompare = merger.next().value;
          // TODO: we might already be done here
        } else {
          merger = undefined;
          currentCompare = undefined;
        }
        break;
      }
    })
  })

  function oninput(event: InputEvent) {
    filled = event.target.value;
  }

  function onfill() {
    if (!isValid()) return;
    sending = true;

    const msg: FillMsg = {
      message: 'fill',
      fill: filled,
    };
    conn.send(JSON.stringify(msg));
  }

  function voteleft() {
    const next = merger.next(true);
    if (next.done) {
      sending = true;

      const msg: VoteMsg = {
        message: 'vote',
        order: next.value,
      };
      conn.send(JSON.stringify(msg));
    } else {
      currentCompare = next.value;
    }
  }

  function voteright() {
    const next = merger.next(false);
    if (next.done) {
      sending = true;

      const msg: VoteMsg = {
        message: 'vote',
        order: next.value,
      };
      conn.send(JSON.stringify(msg));
    } else {
      currentCompare = next.value;
    }
  }

  function hasCounter(): boolean {
    return state.state === 'fill' && state.gimmick === 'words'
  }

  function isValid(): boolean {
    return state.state === 'fill' && (
      (state.gimmick === 'words' && wordCounter === state.wordQuota!) ||
      (state.gimmick === 'number' && /^\d+$/.test(filled)) ||
      (state.gimmick === 'guess' || state.gimmick === undefined)
    )
  }
</script>

<div class="inline-block">
{#if place}
<p class="inline-block">#{place}</p>
{/if}
<Name {name} {medals}/>
</div>

{#if state.state === 'wait'}
  <p class="text-center">Geen huidige input nodig &#128513;</p>
{/if}

{#if state.state === 'vote'}
  <p class="text-2xl text-center">{state.prompt}</p>
  <p class="text-center">Tijd om te stemmen! Dit doe je <em>individueel</em>.</p>

  <div class="flex grow items-center ml-2 mr-2">
    <div class="flex flex-col items-center w-full">
      <div class="flex items-stretch justify-center w-full mb-2">
      {#if currentCompare !== undefined}
        <button onclick={voteleft} type="button" class="mr-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">{state.answers[currentCompare[0]]}</button>
        <button onclick={voteright} type="button" class="ml-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">{state.answers[currentCompare[1]]}</button>
      {/if}
      </div>
      <p><em>Welke is leuker?</em></p>
      {#if sending}
    		<Jumper size="60" color="#FF3E00" unit="px" duration="1s" />
    	{:else}
    	  <div style="height: 60px;"></div>
      {/if}
    </div>
  </div>
{/if}

{#if state.state === 'fill'}
  <p class="text-2xl text-center">{state.prompt}</p>
  <p class="text-center">
  {#if state.partners.length === 1}Deze ronde doe je alleen.
  {:else}Deze ronde doe je samen met 
  {#each state.partners.filter(p => p !== name) as partner, i}
    {#if i > 0}{" en "}{/if}
    <strong>{partner}</strong>
  {/each}. Alleen één van jullie levert een antwoord in.
  {/if}
  </p>

  <div class="flex grow items-center ml-2 mr-2">
    <div class="flex flex-col items-center w-full">
      <form class="w-full" onsubmit={onfill}>
        <input type="text" class="w-full" oninput={oninput} disabled={sending}/>
        {#if hasCounter()}
          <p class="text-right w-full mr-2" class:text-green-800={isValid()} class:text-red-600={!isValid()}>{wordCounter} woord{#if wordCounter !== 1}en{/if}</p>
        {/if}
        <div class="text-center">
          <button type="submit" disabled={!isValid() || sending} class="bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">Stuur</button>
        </div>
      </form>
      {#if sending}
    		<Jumper size="60" color="#FF3E00" unit="px" duration="1s" />
    	{:else}
    	  <div style="height: 60px;"></div>
      {/if}
    </div>
  </div>
{/if}
