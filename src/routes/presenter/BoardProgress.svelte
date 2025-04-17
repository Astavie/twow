<script lang="ts">
  import Name from '../../Name.svelte';

  type Player = {
    name: string,
    medals: Medals,
    ready: bool,
  }

  let { players }: { players: Player[] } = $props();
</script>

<div class="flex grow items-center justify-center ml-2 mr-2">
  <div class="flex flex-col items-stretch">
    {#each players as player (player.name)}
    <div class="flex justify-between items-center">
      <Name name={player.name} medals={player.medals}/>
      {#if player.ready}<p class="ml-2">&#9989;</p>{/if}
    </div>
    {/each}
  </div>
</div>
