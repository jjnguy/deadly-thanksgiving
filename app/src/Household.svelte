<script lang="ts">
  import {
    chanceToBeInfectedInPast,
    getInfectionRate,
    listCounties,
  } from "./covid";

  export let states: string[];
  export let name: string;
  export let people: number;

  let addr = { state: "MN", county: null };

  $: counties = listCounties(addr.state);
</script>

<div>{name}</div>
<label>state
  <select bind:value={addr.state} on:blur={() => (addr.county = null)}>
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
<span>Chance of individual being infected in past 14 days %{(chanceToBeInfectedInPast(14, addr) * 100).toFixed(4)}</span>
<h3>People</h3>
<input bind:value={people} type="number" />
<div>
  Chance of household being infected in past 14 days %{(chanceToBeInfectedInPast(14, addr) * people * 100).toFixed(4)}
</div>
