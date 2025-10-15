<script lang="ts">
  import Name from '../../Name.svelte';
  type Player = {
    name: string,
    medals: Medals,
  }
  type Pair = {
    fill: string,
    players: Player[],
    revealed: boolean,
    placement: number | null,
  }
  let { pairs, reveal, next, count }: { pairs: Pair[], reveal: (number) => void, next: () => void, count: number } = $props();

	import goldMedal from '$lib/images/gold-medal.png';
	import silverMedal from '$lib/images/silver-medal.png';
	import bronzeMedal from '$lib/images/bronze-medal.png';

	function onclick(event: MouseEvent) {
	  reveal(parseInt(event.target.id.substr(1)));
	}
</script>

<div class="flex grow items-center justify-left ml-2 mr-2">
  <div class="flex flex-col items-start">
    {#each pairs as pair, index}
      <div class="h-9 flex items-end">
        {#if pair.placement === 0}
        {#each { length: count }}
          <img class="h-7" alt='Gold medal' src={goldMedal}/>
        {/each}
        {:else if pair.placement === 1}
        {#each { length: count }}
          <img class="h-7" alt='Silver medal' src={silverMedal}/>
        {/each}
        {:else if pair.placement === 2}
        {#each { length: count }}
          <img class="h-7" alt='Bronze medal' src={bronzeMedal}/>
        {/each}
        {:else if pair.placement !== null}
          <p class="mb-0.5">#{pair.placement + 1}</p>
        {/if}
        <div class="mr-1"></div>
        {#if pair.revealed}
          {#each pair.players as player, index}
            {#if index > 0}
              <p class="ml-1 mr-1 mb-0.5">en</p>
            {/if}
            <Name name={player.name} medals={player.medals}/>
          {/each}
        {/if}
        </div>
      {#if pair.revealed}
      <p class="text-lg mb-3 min-h-6">
        {pair.fill}
      </p>
      {:else}
        <button type="button" id={`b${index}`} onclick={onclick} class="mt-1 mb-1 bg-blue-500 hover:bg-blue-400 text-white font-bold px-3 border-b-4 border-blue-700 hover:border-blue-500 rounded">Bekijk</button>
      {/if}
    {/each}
  </div>
</div>
<button onclick={next} disabled={pairs.some(pair => !pair.revealed)} class="mt-2 bg-blue-500 hover:bg-blue-400 text-white font-bold py-2 px-4 border-b-4 border-blue-700 hover:border-blue-500 rounded">
  Doorgaan
</button>
