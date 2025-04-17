<script lang="ts">
  let { prompt }: { prompt: Prompt } = $props();
</script>

<h1>{prompt.prompt}</h1>
{#if prompt.image}
  <center><img class="m-10 w-150 object-contain" alt='Funny' src={prompt.image}/></center>
{/if}
