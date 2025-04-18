<script lang="ts">
  import BoardProgress from './BoardProgress.svelte';
  import BoardPrompt from './BoardPrompt.svelte';
  import BoardResults from './BoardResults.svelte';
	import Name from '../../Name.svelte';
  import Peer, { type DataConnection } from 'peerjs';
  let { word, peer }: { word: string, peer: Peer } = $props();

	import tienletterwoord from '$lib/images/tienletterwoord.png';
	import markie from '$lib/images/markie.jpg';

  type Player = {
    medals: Medals,
    connection: DataConnection,
    votes?: number[],
  }

  type Pair = {
    players: string[],
    fill?: string,
    score?: number,
    revealed?: boolean,
  }

  const prompts: Prompt[] = [

    { prompt: "Eenden hebben veel gender, maar welk deel van een eend heeft het meeste gender?", image: "https://external-content.duckduckgo.com/iu/?u=https%3A%2F%2Fpng.pngtree.com%2Fbackground%2F20230519%2Foriginal%2Fpngtree-close-up-of-a-duck-with-its-mouth-open-picture-image_2664687.jpg&f=1&ipt=6057b5d5d8c03b0369f909c3d72e7d9b43f114e398629a23d51b83a8c460a402" },
    { prompt: "5 personen zijn vastgebonden aan de treinrails. Er is een schakel naar een ander spoor, maar daar is nog 1 persoon vastgebonden. Wat doe je?", image: "https://substackcdn.com/image/fetch/f_auto,q_auto:good,fl_progressive:steep/https%3A%2F%2Fsubstack-post-media.s3.amazonaws.com%2Fpublic%2Fimages%2F48da444a-3eb7-434b-8664-cf163bd7d443_2058x1080.jpeg" },
    { prompt: "Flammie de Flamingo is verkozen tot de nieuwe Fiscus van Anteros! Maar later blijkt dat Flammie het geld heeft misbruikt voor persoonlijk vermaak, namelijk..." },
    { prompt: "Kies een tienletterwoord een maak er een acroniem (afkorting) van die het woord beschrijft.", image: tienletterwoord },
    { prompt: "Maak een slogan voor een restaurant in een wereld waar eten gezien wordt als taboe." },

    { prompt: "Wat wordt de volgende vraag?" },
    { prompt: "[insert volgende vraag hier]", nextquestion: true },

    { prompt: "Wat stond er op de to-do lijst van Mark Rutte van afgelopen dinsdag?", image: markie },
    { prompt: "Beschrijf een bekend sprookje op de meest queer manier mogelijk.", image: "https://imageio.forbes.com/specials-images/imageserve/5f3d04936c3b686510f0d91a/why--The-Dog-And-The-Sailor--is-the-gay-fairytale-folklore-lost-for-over-200-years-/0x0.jpg?format=jpg&crop=4000,2667,x0,y161,safe&width=960" },
    { prompt: "Welk nieuw gebouw heeft Sesamstraat echt nodig?" },
    { prompt: "Er was eens een kapper in een dorp. De kapper scheerde iedereen in het dorp die niet zichzelf scheerde. Maar wie scheerde dan de kapper?" },
    { prompt: "Bedenk een nieuw woord voor een fenomeen dat totaal vaak gebeurd." },
    { prompt: "Je bent vergeten een project te maken en de deadline is vandaag. Je hebt zin om wat chaos te zaaien. Wat lever je in in plaats daarvan?" },
    { prompt: "Wat zijn de tien woorden van wijsheid?", multiplier: 2 },
  ];

  let players: Record<string, Player> = $state({});
  let pairs: Pair[] = $state([]);

  let allfilled = $derived(pairs.every(pair => pair.fill !== undefined));
  let allvoted = $derived(Object.values(players).every(player => player.votes !== undefined));

  let state: 'lobby' | 'fill' | 'vote' | 'results' | 'leaderboard' = $state('lobby');
  let started: bool = $derived(state !== 'lobby');
  let index: number = $state(0);

  let lastquestion: string = $state("");
  let currentPrompt = $derived(prompts[index].nextquestion ? lastquestion : prompts[index].prompt);

  let playerOrder = $derived.by(() => {
    const names = Object.keys(players);
    names.sort((a, b) => {
      const pA = players[a].medals;
      const pB = players[b].medals;

      // const totalA = pA.gold + pA.silver + pA.bronze;
      // const totalB = pB.gold + pB.silver + pB.bronze;
      // if (totalA !== totalB) return totalB - totalA;

      if (pA.gold !== pB.gold) return pB.gold - pA.gold;
      if (pA.silver !== pB.silver) return pB.silver - pA.silver;
      if (pA.bronze !== pB.bronze) return pB.bronze - pA.bronze;
      return a.localeCompare(b);
    });
    return names;
  })

  let playersProgress = $derived(playerOrder.map(name => ({
    name,
    medals: players[name].medals,
    ready: state === 'lobby' ? false : (state === 'fill' ?
      !pairs.some(pair => pair.players.includes(name) && pair.fill === undefined) :
      players[name].votes !== undefined)
  })));

  $effect(function () {
    if (peer.disconnected) {
      peer.reconnect();
    }
    peer.on('connection', handleConnection);
  })

  const splitAt = function(i, xs) {
    var a = xs.slice(0, i);
    var b = xs.slice(i, xs.length);
    return [a, b];
  };

  const shuffle = function(xs) {
    return xs.slice(0).sort(function() {
      return .5 - Math.random();
    });
  };

  const zip = function(xs) {
    return xs[0].map(function(_,i) {
      return xs.map(function(x) {
        return x[i];
      });
    });
  }

  function start() {
    startFill();
  }

  function assignPairs(): string[][] {
    const names = shuffle(Object.keys(players));
    if (names.length % 2 === 1) {
      const leftover = names.pop();
      if (names.length === 0) {
        return [[leftover]];
      } else {
        const result = zip(splitAt(names.length / 2, names));
        result[0].push(leftover);
        return result;
      }
    } else {
      return zip(splitAt(names.length / 2, names));
    }
  }

  function startFill() {
    pairs = assignPairs().map(players => ({ players }));

    state = 'fill';
    for (const player of Object.keys(players)) {
      sendState(player);
    }
  }

  function startVote() {
    state = 'vote';
    for (const player of Object.keys(players)) {
      sendState(player);
    }
  }

  function startResults() {
    // calculate scores
    for (let i = 0; i < pairs.length; i++) {
      const places = Object.values(players).map(player => player.votes.indexOf(i)).filter(place => place !== -1);
      // TODO: will fail if there are no votes
      const average = places.reduce((a, b) => a + b) / places.length;
      pairs[i].score = average;
    }
    pairs.sort((a, b) => a.score - b.score);
    lastquestion = pairs[0].fill;

    // remove votes
    for (const player of Object.keys(players)) {
      delete players[player].votes;
    }

    state = 'results';
    for (const player of Object.keys(players)) {
      sendState(player);
    }
  }

  function sendState(player: string) {
    const conn = players[player].connection;

    const res: StatusMsg = {
      message: 'status',
      medals: players[player].medals,
      place: started ? playerOrder.indexOf(player) + 1 : undefined,
    };
    conn.send(JSON.stringify(res));

    const pair = pairs.find(pair => pair.players.includes(player));
    if (!started ||
      state === 'results' ||
      state === 'leaderboard' ||
      (state === 'fill' && (pair === undefined || pair.fill !== undefined)) ||
      (state === 'vote' && players[player].votes !== undefined))
    {
      const msg: ChangeStateMsg = {
        message: 'state',
        state: 'wait',
      };
      conn.send(JSON.stringify(msg));
    } else if (state === 'fill') {
      const msg: ChangeStateMsg = {
        message: 'state',
        state: 'fill',
        partners: pair.players,
        prompt: currentPrompt,
      };
      conn.send(JSON.stringify(msg));
    } else if (state === 'vote') {
      const msg: ChangeStateMsg = {
        message: 'state',
        state: 'vote',
        answers: pairs.filter(pair => !pair.players.includes(player)).map(pair => pair.fill),
        prompt: currentPrompt,
      };
      conn.send(JSON.stringify(msg));
    }
  }

  function reveal(n: number) {
    pairs[n].revealed = true;
  }

  function next() {
    // award medals
    // TODO: fails if not enough pairs
    const amount = prompts[index].multiplier ?? 1;
    for (const player of pairs[0].players) {
      players[player].medals.gold += amount;
    }
    for (const player of pairs[1].players) {
      players[player].medals.silver += amount;
    }
    for (const player of pairs[2].players) {
      players[player].medals.bronze += amount;
    }

    // continue
    if (index + 1 < prompts.length) {
      index += 1;
      startFill();
    } else {
      state = 'leaderboard';
      for (const player of Object.keys(players)) {
        sendState(player);
      }
    }
  }

  function handleConnection(conn: DataConnection) {
    let name: string | undefined;

  	conn.on('data', function(data) {
  	  const parsed = JSON.parse(data);
  	  if (!('message' in parsed)) return;

  	  const msg = parsed as ClientMsg;
  	  switch (msg.message) {
  	    case 'hello': {
  	      name = msg.name;
  	      if (!(name in players)) {
  	        players[name] = {
  	          medals: {
  	            bronze: 0,
  	            silver: 0,
  	            gold: 0,
  	          },
  	          connection: conn,
  	        };
  	      } else if (players[name].connection !== conn) {
  	        players[name].connection.close();
  	        players[name].connection = conn;
  	      }

  	      sendState(name);
    	    break;
    	  }
    	  case 'fill': {
          const pair = pairs.findIndex(pair => pair.players.includes(name));
          if (pair === -1 || pair.fill !== undefined) {
            sendState(name);
            break;
          }

          pairs[pair].fill = msg.fill;
          if (allfilled) {
            startVote();
          } else {
            for (const player of pairs[pair].players) {
              sendState(player);
            }
          }
          break;
        }
        case 'vote': {
          if (players[name].votes !== undefined) {
            sendState(name);
            break;
          }

          const pair = pairs.findIndex(pair => pair.players.includes(name));
          if (pair === -1) {
            players[name].votes = msg.order;
          } else {
            players[name].votes = msg.order.map(idx => idx >= pair ? idx + 1 : idx);
            console.log(name, players[name].votes);
          }

          if (allvoted) {
            startResults();
          } else {
            sendState(name);
          }
          break;
        }
  	  }
  	});
  }
</script>

{#if !started}
  <p class="text-center">Verbind met code</p>
  <h1>{word.toUpperCase()}</h1>

  <BoardProgress players={playersProgress}/>

  <button onclick={start} class="mt-auto bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">
    Start
  </button>
{:else if state === 'leaderboard'}
  <h1>Leaderboard</h1>
  <p class="text-center">Bedankt voor het spelen!</p>
  <div class="flex grow items-center justify-center ml-2 mr-2">
    <div class="flex flex-col items-stretch">
      {#each playerOrder as name, index}
      <div class="inline-block">
        <p class="inline-block">#{index + 1}</p>
        <Name {name} medals={players[name].medals}/>
      </div>
      {/each}
    </div>
  </div>
{:else}
  <p class="text-left">Code: <strong>{word.toUpperCase()}</strong></p>
  <BoardPrompt prompt={{ prompt: currentPrompt, image: prompts[index].image }}/>
  {#if state === 'results'}
    <BoardResults count={prompts[index].multiplier ?? 1} {reveal} {next} pairs={pairs.map(pair => ({ fill: pair.fill, revealed: pair.revealed ?? false, players: pair.players.map(name => ({ name, medals: players[name].medals })) }))}/>
  {:else}
    {#if state === 'fill'}
      <p class="text-center">Zoek je partner(s) en vul de vraag in!</p>
    {:else}
      <p class="text-center">Vote now on your phones!</p>
    {/if}
    <BoardProgress players={playersProgress}/>
  {/if}
{/if}

<style>
:global(body) {
  height: 100vh;
}
</style>
