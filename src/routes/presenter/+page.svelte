<script lang="ts">
  import Board from './Board.svelte';
  import Peer, { type DataConnection } from 'peerjs';
  import getUuid from 'uuid-by-string';
  import { words } from "../sverdle/words";

  let word: string = $state(words[Math.floor(Math.random() * words.length)]);
  let peer: Peer = fromWord(word);

  function fromWord(word: string): Peer {
    const uuid = getUuid(`astavie-twow-${word}`);
    const peer = new Peer(uuid);
    return peer;
  }
</script>

<svelte:head>
	<title>TWOW: Presenter View</title>
</svelte:head>

<h1 class="visually-hidden">TWOW: Presenter View</h1>
<Board {word} {peer}/>
