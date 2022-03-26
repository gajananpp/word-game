<script lang="ts">
	import { onMount } from 'svelte';

	onMount(async () => {
		const game = await import('$lib/game');
	});
</script>
