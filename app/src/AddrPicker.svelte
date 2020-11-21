<script lang="ts">
  import { listCounties, listStates } from "./covid";

  import type { AddressType } from "./types";

  export let addr: AddressType;

  let states = listStates().sort();
  addr.state = states[0];
  let counties = listCounties(addr.state);
  if (counties) {
    addr.county = counties[0];
  }

  function stateSelected() {
    counties = listCounties(addr.state);
    addr.county = counties[0];
  }
</script>

<label>state
  <select
    bind:value={addr.state}
    on:change={stateSelected}
    on:blur={stateSelected}>
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
