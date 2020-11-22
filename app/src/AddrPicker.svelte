<script lang="ts" context="module">
  var count = 0;
</script>

<script lang="ts">
  import { listCounties, listStates } from "./covid";

  import type { AddressType } from "./types";

  export let addr: AddressType;

  count++;

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

<style>
  label {
    display: inline;
  }
</style>

<div>
  <label for="state-select-{count}">state</label>
  <select
    id="state-select-{count}"
    bind:value={addr.state}
    on:change={stateSelected}
    on:blur={stateSelected}>
    {#each states as state}
      <option>{state}</option>
    {/each}
  </select>
</div>
{#if addr.state}
  <div>
    <label for="county-select-{count}">county</label>
    <select id="county-select-{count}" bind:value={addr.county}>
      {#each counties as county}
        <option>{county}</option>
      {/each}
    </select>
  </div>
{/if}
