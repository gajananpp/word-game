<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		await import('$lib/game');
	});
</script>

<svelte:head>
	<title>Word Game</title>
</svelte:head>
