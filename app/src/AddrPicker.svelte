<script lang="ts">
  import { listCounties, listStates } from "./covid";

  import type { AddressType } from "./types";

  export let addr: AddressType;

  let states = listStates().sort();
  $: counties = listCounties(addr.state);
</script>

<label>state
  <select
    bind:value={addr.state}
    on:change={() => (addr.county = null)}
    on:blur={() => (addr.county = null)}>
    {#each states as state}
      <option>{state}</option>
    {/each}
  </select>
</label>
{#if addr.state}
  <label>county
    <select bind:value={addr.county}>
      {#each counties as county}
        <option>{county}</option>
      {/each}
    </select>
  </label>
{/if}
