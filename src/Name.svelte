<script lang="ts">
  let { name, medals }: { name: string, medals: Medals } = $props();

	import goldMedal from '$lib/images/gold-medal.png';
	import silverMedal from '$lib/images/silver-medal.png';
	import bronzeMedal from '$lib/images/bronze-medal.png';
</script>

<div class="inline-block">
<p class="inline-block text-xl font-bold">{name}</p>
{#if medals.gold || medals.silver || medals.bronze}
<div class="inline-block h-6">
{#each { length: medals.gold }}
  <img class="h-full inline-block" alt='Gold medal' src={goldMedal}/>
{/each}{#each { length: medals.silver }}
  <img class="h-full inline-block" alt='Silver medal' src={silverMedal}/>
{/each}{#each { length: medals.bronze }}
  <img class="h-full inline-block" alt='Bronze medal' src={bronzeMedal}/>
{/each}
</div>
{/if}
</div>
