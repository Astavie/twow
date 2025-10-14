<script lang="ts">
	import Ingame from './Ingame.svelte';
	import { Jumper, Circle } from 'svelte-loading-spinners';
	import Peer, { type DataConnection } from 'peerjs';
  import getUuid from 'uuid-by-string';

  let peer: Peer | undefined = $state(undefined);
  let gameConn: DataConnection | undefined = $state(undefined);
  let gameName: string | undefined = $state(undefined);

  let loading: bool = $derived(peer !== undefined && gameConn === undefined);

  let name;
  let word;

	$effect(function() {
  	name.value = window.sessionStorage.getItem('twow-name');
  	word.value = window.sessionStorage.getItem('twow-word');
	});

  function connect() {
    const uuid = getUuid(`astavie-twow-${word.value.toLowerCase()}`);
    if (!name || !word) return;

    window.sessionStorage.setItem('twow-name', name.value);
    window.sessionStorage.setItem('twow-word', word.value);

  	peer = new Peer();
    peer.on('open', function() {
	  	const conn = peer.connect(uuid);

	  	// handshake
	    conn.on('open', function() {
		  	gameConn = conn;
		  	gameName = name;
	    });

	    // reset on close
	    conn.on('close', function() {
	    	peer.disconnect();
	    	peer = undefined;
	    	gameConn = undefined;
	    });

	    // reset on no connection
	    setTimeout(function() {
	    	if (gameConn === undefined) {
	    		peer.disconnect();
	    		peer = undefined;
	    	}
	    }, 5 * 1000);
    });
  }
</script>

<svelte:head>
	<title>TWOW</title>
</svelte:head>

<h1 class="visually-hidden">TWOW</h1>

{#if gameConn !== undefined}
	<Ingame conn={gameConn} name={gameName}/>
{:else}
	<div class="flex items-center justify-center grow">
		<form onsubmit={connect} class="w-100">
			<div class="flex flex-col">
				<label class="mt-2">Naam</label>
				<input class="m-1" type="text" bind:this={name} disabled={loading}/>
				<label class="mt-2">Code</label>
				<input class="m-1" type="text" bind:this={word} disabled={loading}/>
				<button class="m-1 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded" type="submit" disabled={loading}>(Re)connect</button>
				{#if loading}
					<center><Jumper size="60" color="#FF3E00" unit="px" duration="1s" /></center>
	    	{:else}
	    	  <div style="height: 60px;"></div>
				{/if}
			</div>
		</form>
	</div>
{/if}
